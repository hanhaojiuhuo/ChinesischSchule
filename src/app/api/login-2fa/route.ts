import { NextResponse } from "next/server";
import { Resend } from "resend";
import { readAdmins } from "@/lib/edge-config";
import { verifyPassword } from "@/lib/password";
import { resetRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-helpers";
import { logAuditEvent } from "@/lib/audit-log";
import { getClientIP } from "@/lib/request-utils";
import { generateHmacCode, verifyHmacCode, getOtpSecret } from "@/lib/otp";
import { loginCodeEmail } from "@/lib/email-templates";
import { maskEmail } from "@/lib/text-utils";
import { setSessionCookie } from "@/lib/session";
import { requireJson } from "@/lib/api-helpers";
import { ErrorMessages } from "@/lib/error-messages";

/** Max failed login attempts per account per day. */
const MAX_ATTEMPTS_PER_ACCOUNT = 10;
/** Max failed login attempts per IP per day. */
const MAX_ATTEMPTS_PER_IP = 20;
/** Rate limit window: 24 hours. */
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * POST /api/login-2fa
 *
 * Two-factor authentication for admin login.
 *
 * Actions:
 *   - "request": Verify username+password, then send 2FA code to admin's email.
 *     Body: { action: "request", username: string, password: string }
 *
 *   - "verify": Verify the 2FA code and complete login.
 *     Body: { action: "verify", username: string, code: string }
 */
export async function POST(request: Request) {
  try {
    const parsed = await requireJson<Record<string, string>>(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;
    const { action } = body;
    const ip = getClientIP(request);

    /* ── Step 1: Verify credentials and send 2FA code ─────────── */
    if (action === "request") {
      const { username, password } = body;
      if (!username?.trim() || !password) {
        return NextResponse.json(
          { error: "Username and password required" },
          { status: 400 }
        );
      }

      // Check IP rate limit
      const ipCheck = await enforceRateLimit(
        `login-ip:${ip}`,
        MAX_ATTEMPTS_PER_IP,
        RATE_LIMIT_WINDOW_MS,
        { success: false, blocked: true, remainingAttempts: 0 },
      );
      if (!ipCheck.ok) return ipCheck.response;

      // Check per-account rate limit
      const accountCheck = await enforceRateLimit(
        `login-account:${username.trim()}`,
        MAX_ATTEMPTS_PER_ACCOUNT,
        RATE_LIMIT_WINDOW_MS,
        { success: false, blocked: true, remainingAttempts: 0 },
      );
      if (!accountCheck.ok) return accountCheck.response;

      // Verify credentials
      const admins = await readAdmins();
      const admin = admins.find((a) => a.username === username.trim());
      if (!admin) {
        const remaining = Math.min(accountCheck.remaining, ipCheck.remaining);
        return NextResponse.json(
          { success: false, blocked: remaining <= 0, remainingAttempts: remaining },
          { status: 401 }
        );
      }

      const passwordValid = await verifyPassword(password, admin.password);
      if (!passwordValid) {
        const remaining = Math.min(accountCheck.remaining, ipCheck.remaining);
        return NextResponse.json(
          { success: false, blocked: remaining <= 0, remainingAttempts: remaining },
          { status: 401 }
        );
      }

      // Credentials valid — now check if admin has email for 2FA
      if (!admin.email) {
        // No email configured — skip 2FA and login directly
        await resetRateLimit(`login-account:${username.trim()}`);
        await logAuditEvent({
          action: "LOGIN",
          actor: username.trim(),
          details: "Login without 2FA (no email configured)",
          ip,
        });

        const response = NextResponse.json({ success: true, twoFactorRequired: false });
        setSessionCookie(response, username.trim());
        return response;
      }

      // Send 2FA code via email
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        // Email service not configured — skip 2FA
        await resetRateLimit(`login-account:${username.trim()}`);
        await logAuditEvent({
          action: "LOGIN",
          actor: username.trim(),
          details: "Login without 2FA (RESEND_API_KEY not configured)",
          ip,
        });

        const response = NextResponse.json({ success: true, twoFactorRequired: false });
        setSessionCookie(response, username.trim());
        return response;
      }

      const CODE_SLOT_MS = 5 * 60 * 1000;
      const otpSecret = getOtpSecret();
      if (!otpSecret) {
        return NextResponse.json(
          { error: "OTP service not configured" },
          { status: 503 }
        );
      }
      const code = generateHmacCode("login-2fa", admin.username, otpSecret, CODE_SLOT_MS);
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
      const resend = new Resend(apiKey);

      const { error } = await resend.emails.send({
        from: fromEmail,
        to: admin.email,
        subject: "Anmeldecode / Login Code / 登录验证码 — YiXin 中文学校",
        html: loginCodeEmail(code),
      });

      if (error) {
        console.error("[login-2fa] Failed to send 2FA code:", error);
        return NextResponse.json(
          { error: "Failed to send verification email. Please try again later. / E-Mail konnte nicht gesendet werden. / 验证邮件发送失败，请稍后重试。" },
          { status: 500 }
        );
      }

      // Mask email for client display
      const maskedAddr = maskEmail(admin.email);

      return NextResponse.json({
        success: true,
        twoFactorRequired: true,
        maskedEmail: maskedAddr,
      });
    }

    /* ── Step 2: Verify 2FA code and complete login ───────────── */
    if (action === "verify") {
      const { username, code } = body;
      if (!username?.trim() || !code?.trim()) {
        return NextResponse.json(
          { error: "Username and code are required" },
          { status: 400 }
        );
      }

      // Rate limit 2FA verification attempts per IP
      const verifyIpCheck = await enforceRateLimit(
        `2fa-verify-ip:${ip}`,
        MAX_ATTEMPTS_PER_IP,
        RATE_LIMIT_WINDOW_MS,
        { error: ErrorMessages.RATE_LIMITED_VERIFY },
      );
      if (!verifyIpCheck.ok) return verifyIpCheck.response;

      // Rate limit 2FA verification per account
      const verifyAccountCheck = await enforceRateLimit(
        `2fa-verify-account:${username.trim()}`,
        MAX_ATTEMPTS_PER_ACCOUNT,
        RATE_LIMIT_WINDOW_MS,
        { error: ErrorMessages.RATE_LIMITED_VERIFY },
      );
      if (!verifyAccountCheck.ok) return verifyAccountCheck.response;

      const otpVerifySecret = getOtpSecret();
      if (!otpVerifySecret) {
        return NextResponse.json(
          { error: "OTP service not configured" },
          { status: 503 }
        );
      }

      const valid = verifyHmacCode("login-2fa", username.trim(), otpVerifySecret, code.trim(), 5 * 60 * 1000);
      if (!valid) {
        await logAuditEvent({
          action: "LOGIN_2FA_FAILED",
          actor: username.trim(),
          details: "Invalid 2FA code",
          ip,
        });
        return NextResponse.json(
          { error: ErrorMessages.INVALID_OR_EXPIRED_CODE },
          { status: 400 }
        );
      }

      // 2FA verified — complete login
      await resetRateLimit(`login-account:${username.trim()}`);
      await logAuditEvent({
        action: "LOGIN",
        actor: username.trim(),
        details: "Login with 2FA",
        ip,
      });

      const response = NextResponse.json({ success: true });
      setSessionCookie(response, username.trim());
      return response;
    }

    return NextResponse.json({ error: ErrorMessages.INVALID_ACTION }, { status: 400 });
  } catch (err) {
    console.error("[login-2fa] Error:", err);
    return NextResponse.json(
      { error: ErrorMessages.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
