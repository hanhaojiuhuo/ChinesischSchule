import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { Resend } from "resend";
import { readAdmins } from "@/lib/edge-config";
import { verifyPassword } from "@/lib/password";
import { checkRateLimitPersistent, resetRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit-log";
import { getClientIP } from "@/lib/request-utils";

const SESSION_COOKIE = "yixin-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Time-slot duration for HMAC-based code validity (5 minutes). */
const CODE_SLOT_MS = 5 * 60 * 1000;

/** Max failed login attempts per account per day. */
const MAX_ATTEMPTS_PER_ACCOUNT = 10;
/** Max failed login attempts per IP per day. */
const MAX_ATTEMPTS_PER_IP = 20;
/** Rate limit window: 24 hours. */
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Generate an 8-character alphanumeric code tied to a username and time slot.
 * Domain separation: "login-2fa"
 */
function generateCode(username: string, secret: string): string {
  const slot = Math.floor(Date.now() / CODE_SLOT_MS);
  const mac = createHmac("sha256", secret);
  mac.update(`login-2fa:${username}:${slot}`);
  const hex = mac.digest("hex");
  // Take 8 alphanumeric characters from the hash
  return hex.slice(0, 8).toUpperCase();
}

/**
 * Verify a code against the current and previous time slot.
 */
function verifyCode(username: string, secret: string, code: string): boolean {
  const slot = Math.floor(Date.now() / CODE_SLOT_MS);
  for (const s of [slot, slot - 1]) {
    const mac = createHmac("sha256", secret);
    mac.update(`login-2fa:${username}:${s}`);
    const hex = mac.digest("hex");
    if (hex.slice(0, 8).toUpperCase() === code.toUpperCase()) {
      return true;
    }
  }
  return false;
}

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
    const body = (await request.json()) as Record<string, string>;
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
      const ipCheck = await checkRateLimitPersistent(
        `login-ip:${ip}`,
        MAX_ATTEMPTS_PER_IP,
        RATE_LIMIT_WINDOW_MS
      );
      if (!ipCheck.allowed) {
        return NextResponse.json(
          { success: false, blocked: true, remainingAttempts: 0 },
          { status: 429 }
        );
      }

      // Check per-account rate limit
      const accountCheck = await checkRateLimitPersistent(
        `login-account:${username.trim()}`,
        MAX_ATTEMPTS_PER_ACCOUNT,
        RATE_LIMIT_WINDOW_MS
      );
      if (!accountCheck.allowed) {
        return NextResponse.json(
          { success: false, blocked: true, remainingAttempts: 0 },
          { status: 429 }
        );
      }

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
        response.cookies.set(SESSION_COOKIE, username.trim(), {
          httpOnly: true,
          sameSite: "strict",
          path: "/",
          maxAge: COOKIE_MAX_AGE,
          secure: process.env.NODE_ENV === "production",
        });
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
        response.cookies.set(SESSION_COOKIE, username.trim(), {
          httpOnly: true,
          sameSite: "strict",
          path: "/",
          maxAge: COOKIE_MAX_AGE,
          secure: process.env.NODE_ENV === "production",
        });
        return response;
      }

      const code = generateCode(admin.username, apiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
      const resend = new Resend(apiKey);

      const { error } = await resend.emails.send({
        from: fromEmail,
        to: admin.email,
        subject: "Anmeldecode / Login Code / 登录验证码 — YiXin 中文学校",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#c0392b">
              YiXin 中文学校 · Chinesisch Schule Heilbronn
            </h2>
            <h3>Anmeldecode / Login Verification Code / 登录验证码</h3>
            <p>
              <strong>DE:</strong> Ihr Anmeldeverifizierungscode lautet:<br>
              <strong>EN:</strong> Your login verification code is:<br>
              <strong>ZH:</strong> 您的登录验证码为：
            </p>
            <p style="font-size:32px;letter-spacing:6px;font-weight:bold;color:#c0392b;text-align:center;font-family:monospace">
              ${code}
            </p>
            <p style="color:#666;font-size:13px">
              DE: Dieser Code ist 10 Minuten gültig.<br>
              EN: This code is valid for 10 minutes.<br>
              ZH: 此验证码有效期为 10 分钟。
            </p>
            <p style="color:#999;font-size:12px">
              Falls Sie sich nicht angemeldet haben, ignorieren Sie diese E-Mail und ändern Sie Ihr Passwort.<br>
              If you did not attempt to log in, please ignore this email and change your password.<br>
              如非本人登录，请忽略此邮件并修改密码。
            </p>
          </div>`,
      });

      if (error) {
        console.error("[login-2fa] Failed to send 2FA code:", error);
        // Fall back to login without 2FA
        await resetRateLimit(`login-account:${username.trim()}`);
        await logAuditEvent({
          action: "LOGIN",
          actor: username.trim(),
          details: "Login without 2FA (email send failed)",
          ip,
        });

        const response = NextResponse.json({ success: true, twoFactorRequired: false });
        response.cookies.set(SESSION_COOKIE, username.trim(), {
          httpOnly: true,
          sameSite: "strict",
          path: "/",
          maxAge: COOKIE_MAX_AGE,
          secure: process.env.NODE_ENV === "production",
        });
        return response;
      }

      // Mask email for client display
      const [local, domain] = admin.email.split("@");
      const maskedEmail =
        !local || !domain
          ? "***@***"
          : local.length <= 2
          ? `${local[0]}***@${domain}`
          : `${local[0]}***${local[local.length - 1]}@${domain}`;

      return NextResponse.json({
        success: true,
        twoFactorRequired: true,
        maskedEmail,
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

      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "Email service not configured" },
          { status: 503 }
        );
      }

      const valid = verifyCode(username.trim(), apiKey, code.trim());
      if (!valid) {
        await logAuditEvent({
          action: "LOGIN_2FA_FAILED",
          actor: username.trim(),
          details: "Invalid 2FA code",
          ip,
        });
        return NextResponse.json(
          { error: "Invalid or expired code / Ungültiger oder abgelaufener Code / 验证码无效或已过期" },
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
      response.cookies.set(SESSION_COOKIE, username.trim(), {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
        secure: process.env.NODE_ENV === "production",
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[login-2fa] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
