import { NextResponse } from "next/server";
import { Resend } from "resend";
import { readAdmins, writeAdmins, getLastPersistError } from "@/lib/edge-config";
import type { AdminUser } from "@/lib/edge-config";
import { hashPassword } from "@/lib/password";
import { checkRateLimitPersistent, resetRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-helpers";
import { logAuditEvent } from "@/lib/audit-log";
import { generateHmacCode, verifyHmacCode, getOtpSecret } from "@/lib/otp";
import {
  passwordResetCodeEmail,
  adminPasswordResetEmail,
  passwordChangedConfirmEmail,
} from "@/lib/email-templates";
import { requireJson } from "@/lib/api-helpers";
import { ErrorMessages } from "@/lib/error-messages";

/** Time-slot duration for HMAC-based code validity (15 minutes). */
const CODE_SLOT_MS = 15 * 60 * 1000;

/** Rate-limit: max attempts per email within 1 hour. */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Max wrong username+email mismatch attempts before blocking (per day). */
const MISMATCH_MAX = 3;
const MISMATCH_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Find an admin by username and/or email from the admin list.
 * Avoids duplicating the lookup logic across verify and reset steps.
 */
function findAdmin(
  admins: AdminUser[],
  username?: string,
  email?: string
): AdminUser | undefined {
  if (username?.trim()) {
    const trimmedUsername = username.trim();
    const admin = admins.find((a) => a.username === trimmedUsername);
    // Also verify email matches if both provided
    if (admin && email?.trim() && admin.email?.toLowerCase() !== email.trim().toLowerCase()) {
      return undefined;
    }
    return admin;
  }
  if (email?.trim()) {
    const normalizedEmail = email.trim().toLowerCase();
    return admins.find(
      (a) => a.email && a.email.toLowerCase() === normalizedEmail
    );
  }
  return undefined;
}


export async function POST(request: Request) {
  try {
    const parsed = await requireJson<Record<string, string>>(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;
    const { action } = body;

    /* ── Step 1: Request a reset code (by username + email) ──────── */
    if (action === "request") {
      const { username, email, adminInitiated } = body;
      if (!username?.trim() || !email?.trim()) {
        return NextResponse.json(
          { error: "Username and email are required / Benutzername und E-Mail erforderlich / 用户名和邮箱为必填项" },
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
      const normalizedEmail = email.trim().toLowerCase();
      const mismatchKey = `forgot:${trimmedUsername}`;

      // Check mismatch block (3 wrong attempts → blocked) — persistent
      const mm = await enforceRateLimit(mismatchKey, MISMATCH_MAX, MISMATCH_WINDOW_MS);
      if (!mm.ok) {
        return NextResponse.json(
          {
            error: "Too many incorrect attempts. Please wait 24 hours before trying again. / Zu viele Fehlversuche. Bitte warten Sie 24 Stunden. / 错误尝试次数过多，请等待24小时后再试。",
            blocked: true,
          },
          { status: 403 }
        );
      }

      // Rate limit by email — persistent across server restarts
      const rl = await enforceRateLimit(`pw-reset:${normalizedEmail}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
      if (!rl.ok) return rl.response;

      const admins = await readAdmins();

      // First check if username exists
      const adminByUsername = admins.find((a) => a.username === trimmedUsername);
      if (!adminByUsername) {
        return NextResponse.json(
          {
            error: "Username not found. Please check and try again. / Benutzername nicht gefunden. Bitte überprüfen und erneut versuchen. / 用户名未找到，请检查后重试。",
            mismatchRemaining: mm.remaining,
          },
          { status: 404 }
        );
      }

      // Check if email matches the username
      if (!adminByUsername.email || adminByUsername.email.toLowerCase() !== normalizedEmail) {
        return NextResponse.json(
          {
            error: "Email does not match this username. Please check and try again. / E-Mail stimmt nicht mit diesem Benutzernamen überein. / 邮箱与该用户名不匹配，请检查后重试。",
            mismatchRemaining: mm.remaining,
          },
          { status: 400 }
        );
      }

      // Username + email match — reset the mismatch counter (persistent)
      await resetRateLimit(mismatchKey);
      const admin = adminByUsername;

      const otpSecret = getOtpSecret();
      if (!otpSecret) {
        return NextResponse.json(
          { error: "OTP service not configured" },
          { status: 503 }
        );
      }

      const code = generateHmacCode("password-reset", admin.username, otpSecret, CODE_SLOT_MS);
      const fromEmail =
        process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

      const resend = new Resend(apiKey);

      // Use a different email template when the reset is initiated by an admin
      let emailHtml: string;
      let emailSubject: string;
      if (adminInitiated) {
        const origin = new URL(request.url).origin;
        const resetLink = `${origin}/admin?reset=1&username=${encodeURIComponent(admin.username)}`;
        emailSubject = "Passwort-Reset durch Administrator / Admin Password Reset / 管理员重置密码";
        emailHtml = adminPasswordResetEmail(code, admin.username, resetLink);
      } else {
        emailSubject = "Passwort-Reset Verifizierungscode / Password Reset Code / 密码重置验证码";
        emailHtml = passwordResetCodeEmail(code);
      }

      const { error } = await resend.emails.send({
        from: fromEmail,
        to: admin.email!,
        subject: emailSubject,
        html: emailHtml,
      });

      if (error) {
        return NextResponse.json(
          { error: "Failed to send email" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, remaining: rl.remaining });
    }

    /* ── Step 2: Verify a code (no password change yet) ───────────── */
    if (action === "verify") {
      const { username, email, code } = body;
      if ((!username?.trim() && !email?.trim()) || !code?.trim()) {
        return NextResponse.json(
          { error: "Username/email and code are required" },
          { status: 400 }
        );
      }

      const otpVerifySecret = getOtpSecret();
      if (!otpVerifySecret) {
        return NextResponse.json(
          { error: "OTP service not configured" },
          { status: 503 }
        );
      }

      const admins = await readAdmins();
      const admin = findAdmin(admins, username, email);

      if (!admin) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }

      const valid = verifyHmacCode("password-reset", admin.username, otpVerifySecret, code.trim(), CODE_SLOT_MS);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    }

    /* ── Step 3: Reset the password ───────────────────────────────── */
    if (action === "reset") {
      const { username, email, code, newPassword } = body;
      if ((!username?.trim() && !email?.trim()) || !code?.trim() || !newPassword) {
        return NextResponse.json(
          { error: "Username/email, code, and new password are required" },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters / Passwort muss mindestens 8 Zeichen lang sein / 密码至少需要8个字符" },
          { status: 400 }
        );
      }

      const apiKey = process.env.RESEND_API_KEY;
      const otpResetSecret = getOtpSecret();
      if (!otpResetSecret) {
        return NextResponse.json(
          { error: "OTP service not configured" },
          { status: 503 }
        );
      }

      const admins = await readAdmins();
      const admin = findAdmin(admins, username, email);

      if (!admin) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }

      // Re-verify the code before applying the change
      if (!verifyHmacCode("password-reset", admin.username, otpResetSecret, code.trim(), CODE_SLOT_MS)) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }

      const idx = admins.findIndex((a) => a.username === admin.username);
      const hashedPassword = await hashPassword(newPassword);
      const updated = admins.map((a, i) =>
        i === idx ? { ...a, password: hashedPassword } : a
      );

      await writeAdmins(updated);
      const persistError = getLastPersistError();
      if (persistError) {
        console.warn(
          `[password-reset] Edge Config persistence failed: ${persistError}`
        );
      }

      await logAuditEvent({
        action: "PASSWORD_RESET",
        actor: admin.username,
        details: "Password reset via email verification",
      });

      // Send confirmation email (best-effort — password is already saved)
      if (admin.email) {
        const fromEmail =
          process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
        const resend = new Resend(apiKey);
        const { error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: admin.email,
          subject:
            "Passwort erfolgreich geändert / Password Changed / 密码已更改",
          html: passwordChangedConfirmEmail(),
        });
        if (emailError) {
          console.warn(
            "[password-reset] Confirmation email failed to send:",
            emailError
          );
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: ErrorMessages.INVALID_ACTION }, { status: 400 });
  } catch (err) {
    console.error("[password-reset] Error:", err);
    return NextResponse.json(
      { error: ErrorMessages.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
