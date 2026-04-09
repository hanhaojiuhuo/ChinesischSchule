import { NextResponse } from "next/server";
import { Resend } from "resend";
import { readAdmins } from "@/lib/edge-config";
import { checkRateLimitPersistent } from "@/lib/rate-limit";
import { generateHmacCode, verifyHmacCode, getOtpSecret } from "@/lib/otp";
import { passwordChangeCodeEmail } from "@/lib/email-templates";
import { maskEmail } from "@/lib/text-utils";
import { requireJson } from "@/lib/api-helpers";

/** Time-slot duration for HMAC-based code validity (10 minutes). */
const CODE_SLOT_MS = 10 * 60 * 1000;

/** Rate-limit: max code requests per username within 1 hour. */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/**
 * POST /api/password-change
 *
 * Actions:
 *   - "request": Send a verification code to the admin's registered email.
 *     Body: { action: "request", username: string }
 *
 *   - "verify": Verify the code (does NOT change the password).
 *     Body: { action: "verify", username: string, code: string }
 */
export async function POST(request: Request) {
  try {
    const parsed = await requireJson<Record<string, string>>(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;
    const { action } = body;

    /* ── Request a verification code ────────────────────────── */
    if (action === "request") {
      const { username } = body;
      if (!username?.trim()) {
        return NextResponse.json(
          { error: "Username is required" },
          { status: 400 }
        );
      }

      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "Email service not configured (RESEND_API_KEY missing)" },
          { status: 503 }
        );
      }

      const trimmedUsername = username.trim();

      // Rate limit by username — persistent across server restarts
      const rl = await checkRateLimitPersistent(`pw-change:${trimmedUsername}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
      if (!rl.allowed) {
        const retryMinutes = Math.ceil(rl.retryAfterMs / 60000);
        return NextResponse.json(
          {
            error: `Zu viele Versuche. Bitte versuchen Sie es in ${retryMinutes} Minute(n) erneut. / Too many attempts. Please try again in ${retryMinutes} minute(s). / 尝试次数过多，请在 ${retryMinutes} 分钟后重试。`,
            rateLimited: true,
          },
          { status: 429 }
        );
      }

      const admins = await readAdmins();
      const admin = admins.find((a) => a.username === trimmedUsername);

      if (!admin?.email) {
        return NextResponse.json(
          {
            error:
              "Diesem Konto ist keine E-Mail-Adresse zugeordnet. / No email address associated with this account. / 此账户未绑定邮箱地址。",
            noEmail: true,
          },
          { status: 400 }
        );
      }

      const otpSecret = getOtpSecret();
      if (!otpSecret) {
        return NextResponse.json(
          { error: "OTP service not configured" },
          { status: 503 }
        );
      }

      const code = generateHmacCode("password-change", trimmedUsername, otpSecret, CODE_SLOT_MS);
      const fromEmail =
        process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: admin.email,
        subject:
          "Passwortänderung Verifizierungscode / Password Change Code / 密码修改验证码",
        html: passwordChangeCodeEmail(code),
      });

      if (error) {
        console.error("[password-change] Failed to send code:", error);
        return NextResponse.json(
          { error: "Failed to send verification email" },
          { status: 500 }
        );
      }

      // Mask the email for client display
      const maskedEmail = maskEmail(admin.email);
      return NextResponse.json({ success: true, maskedEmail });
    }

    /* ── Verify the code ────────────────────────────────────── */
    if (action === "verify") {
      const { username, code } = body;
      if (!username?.trim() || !code?.trim()) {
        return NextResponse.json(
          { error: "Username and code are required" },
          { status: 400 }
        );
      }

      const apiKey = process.env.RESEND_API_KEY;
      const otpVerifySecret = getOtpSecret();
      if (!otpVerifySecret) {
        return NextResponse.json(
          { error: "OTP service not configured" },
          { status: 503 }
        );
      }

      const valid = verifyHmacCode("password-change", username.trim(), otpVerifySecret, code.trim(), CODE_SLOT_MS);
      if (!valid) {
        return NextResponse.json(
          {
            error:
              "Ungültiger oder abgelaufener Code / Invalid or expired code / 验证码无效或已过期",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[password-change] Error:", err);
    return NextResponse.json(
      { error: "Internal server error / Interner Serverfehler / 服务器内部错误" },
      { status: 500 }
    );
  }
}
