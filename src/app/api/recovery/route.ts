import { NextResponse } from "next/server";
import { Resend } from "resend";
import { readAdmins } from "@/lib/edge-config";
import { logAuditEvent } from "@/lib/audit-log";
import { generateHmacCode, verifyHmacCode, getOtpSecret } from "@/lib/otp";
import { recoveryCodeEmail } from "@/lib/email-templates";
import { setSessionCookie } from "@/lib/session";
import { requireJson } from "@/lib/api-helpers";
import { enforceRateLimit } from "@/lib/rate-limit-helpers";
import { getClientIP } from "@/lib/request-utils";
import { ErrorMessages } from "@/lib/error-messages";

const CODE_SLOT_MS = 10 * 60 * 1000; // 10 minutes

/** Max recovery code requests per IP per hour. */
const RECOVERY_REQUEST_MAX = 5;
const RECOVERY_REQUEST_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Max recovery code verification attempts per IP per hour. */
const RECOVERY_VERIFY_MAX = 10;
const RECOVERY_VERIFY_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Recovery login: allows an admin to log in using email verification when the
 * RECOVERY_MODE environment variable is set to "true".
 *
 * To enable recovery mode, add `RECOVERY_MODE=true` to your Vercel project's
 * environment variables, then deploy.  Remove the variable (or set it to
 * anything other than "true") once a new admin account has been created.
 *
 * Actions:
 *   - "request": Send recovery code to the admin's notification email or to a provided email.
 *     Body: { action: "request", username: string }
 *
 *   - "verify": Verify the recovery code and log in.
 *     Body: { action: "verify", username: string, code: string }
 *
 *   - (legacy, no action): attempt login — now requires email verification.
 */
export async function POST(request: Request) {
  try {
    if (process.env.RECOVERY_MODE !== "true") {
      return NextResponse.json(
        { error: "Recovery mode is not enabled" },
        { status: 403 }
      );
    }

    /* ── Startup warning for RECOVERY_MODE ─────────────────── */
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[SECURITY] ⚠️  RECOVERY_MODE is enabled in production. " +
        "Disable it immediately after creating a new admin account " +
        "by removing the RECOVERY_MODE environment variable and redeploying."
      );
    }

    const parsed = await requireJson<Record<string, string>>(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;
    const { action, username } = body;

    if (!username?.trim()) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    const trimmedUsername = username.trim();

    const ip = getClientIP(request);

    /* ── Step 1: Send recovery verification code ──────────── */
    if (action === "request") {
      // Rate limit code requests per IP
      const rl = await enforceRateLimit(
        `recovery-request-ip:${ip}`,
        RECOVERY_REQUEST_MAX,
        RECOVERY_REQUEST_WINDOW_MS,
        { error: ErrorMessages.RATE_LIMITED },
      );
      if (!rl.ok) return rl.response;

      const apiKey = process.env.RESEND_API_KEY;
      const notificationEmail = process.env.NOTIFICATION_EMAIL;

      // Try to find the admin's email, or use NOTIFICATION_EMAIL
      const admins = await readAdmins();
      const admin = admins.find((a) => a.username === trimmedUsername);
      const targetEmail = admin?.email || notificationEmail;

      const otpSecret = getOtpSecret();
      if (!apiKey || !targetEmail || !otpSecret) {
        return NextResponse.json(
          {
            error: "Email verification is required for recovery but email service is not configured. Set RESEND_API_KEY and NOTIFICATION_EMAIL.",
            noEmail: true,
          },
          { status: 503 }
        );
      }

      const code = generateHmacCode("recovery", trimmedUsername, otpSecret, CODE_SLOT_MS);
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
      const resend = new Resend(apiKey);

      const { error } = await resend.emails.send({
        from: fromEmail,
        to: targetEmail,
        subject: "Recovery Mode Verifizierungscode / Recovery Verification Code / 恢复模式验证码",
        html: recoveryCodeEmail(code, trimmedUsername),
      });

      if (error) {
        console.error("[recovery] Failed to send code:", error);
        return NextResponse.json(
          { error: "Failed to send verification email" },
          { status: 500 }
        );
      }

      console.warn(
        `[Recovery] Recovery code sent for user "${trimmedUsername}". Disable RECOVERY_MODE after use.`
      );

      return NextResponse.json({ success: true, codeSent: true });
    }

    /* ── Step 2: Verify code and complete recovery login ──── */
    if (action === "verify") {
      const { code } = body;
      if (!code?.trim()) {
        return NextResponse.json({ error: "code required" }, { status: 400 });
      }

      // Rate limit verify attempts per IP
      const rl = await enforceRateLimit(
        `recovery-verify-ip:${ip}`,
        RECOVERY_VERIFY_MAX,
        RECOVERY_VERIFY_WINDOW_MS,
        { error: ErrorMessages.RATE_LIMITED_VERIFY },
      );
      if (!rl.ok) return rl.response;

      const otpVerifySecret = getOtpSecret();
      if (!otpVerifySecret) {
        return NextResponse.json(
          { error: "OTP service not configured" },
          { status: 503 }
        );
      }

      if (!verifyHmacCode("recovery", trimmedUsername, otpVerifySecret, code.trim(), CODE_SLOT_MS)) {
        return NextResponse.json(
          { error: "Invalid or expired code / Ungültiger Code / 验证码无效" },
          { status: 400 }
        );
      }

      await logAuditEvent({
        action: "RECOVERY_LOGIN",
        actor: trimmedUsername,
        details: "Recovery mode login with email verification",
      });

      console.warn(
        `[Recovery] Recovery mode login verified for user "${trimmedUsername}". Disable RECOVERY_MODE after creating a new admin account.`
      );

      const response = NextResponse.json({ success: true });
      setSessionCookie(response, trimmedUsername);
      return response;
    }

    /* ── Legacy: no action field — reject (no longer accept any password) ── */
    return NextResponse.json(
      { error: "Recovery mode now requires email verification. Use action: 'request' then 'verify'.", requiresVerification: true },
      { status: 400 }
    );
  } catch (err) {
    console.error("[recovery] Error:", err);
    return NextResponse.json(
      { error: ErrorMessages.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
