import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { Resend } from "resend";
import { readAdmins, writeAdmins, getLastPersistError } from "@/lib/edge-config";

/** Time-slot duration for HMAC-based code validity (10 minutes). */
const CODE_SLOT_MS = 10 * 60 * 1000;

/** Rate-limit: max attempts per email within 1 hour. */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** In-memory rate-limit store (keyed by email). Reset on server restart. */
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(key: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfterMs: 0 };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, remaining: 0, retryAfterMs };
  }
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, retryAfterMs: 0 };
}


/**
 * Generate a 6-digit HMAC-based code tied to a username and a 10-minute time
 * slot. Stateless – no server-side storage required.
 * Domain separation ("password-reset") is included in the HMAC message so the
 * raw API key can be used directly as the HMAC secret without modification.
 */
function generateCode(username: string, secret: string): string {
  const slot = Math.floor(Date.now() / CODE_SLOT_MS);
  const mac = createHmac("sha256", secret);
  mac.update(`password-reset:${username}:${slot}`);
  const num = parseInt(mac.digest("hex").slice(0, 8), 16);
  return String(num % 1_000_000).padStart(6, "0");
}

/**
 * Verify a code against the current and previous time slot so codes remain
 * valid for up to 20 minutes regardless of when the user acts.
 */
function verifyCode(username: string, secret: string, code: string): boolean {
  const slot = Math.floor(Date.now() / CODE_SLOT_MS);
  for (const s of [slot, slot - 1]) {
    const mac = createHmac("sha256", secret);
    mac.update(`password-reset:${username}:${s}`);
    const num = parseInt(mac.digest("hex").slice(0, 8), 16);
    if (String(num % 1_000_000).padStart(6, "0") === code) {
      return true;
    }
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string>;
    const { action } = body;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email service not configured (RESEND_API_KEY missing)" },
        { status: 503 }
      );
    }

    /* ── Step 1: Request a reset code (by email) ──────────────────── */
    if (action === "request") {
      const { email } = body;
      if (!email?.trim()) {
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Rate limit by email
      const rl = checkRateLimit(normalizedEmail);
      if (!rl.allowed) {
        const retryMinutes = Math.ceil(rl.retryAfterMs / 60000);
        return NextResponse.json(
          {
            error: `Too many attempts. Please try again in ${retryMinutes} minute(s). / Zu viele Versuche. Bitte versuchen Sie es in ${retryMinutes} Minute(n) erneut. / 尝试次数过多，请在 ${retryMinutes} 分钟后重试。`,
            rateLimited: true,
            retryAfterMs: rl.retryAfterMs,
          },
          { status: 429 }
        );
      }

      const admins = await readAdmins();
      const admin = admins.find(
        (a) => a.email && a.email.toLowerCase() === normalizedEmail
      );

      // Always respond success to avoid leaking whether an email is registered
      if (!admin) {
        return NextResponse.json({ success: true, remaining: rl.remaining });
      }

      const code = generateCode(admin.username, apiKey);
      const fromEmail =
        process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: admin.email!,
        subject:
          "Passwort-Reset Verifizierungscode / Password Reset Code / 密码重置验证码",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#c0392b">
              YiXin 中文学校 · Chinesisch Schule Heilbronn
            </h2>
            <h3>Passwort-Reset / Password Reset / 密码重置</h3>
            <p>
              <strong>DE:</strong> Ihr Verifizierungscode lautet:<br>
              <strong>EN:</strong> Your verification code is:<br>
              <strong>ZH:</strong> 您的验证码为：
            </p>
            <p style="font-size:36px;letter-spacing:8px;font-weight:bold;color:#c0392b;text-align:center">
              ${code}
            </p>
            <p style="color:#666;font-size:13px">
              DE: Dieser Code ist 20 Minuten gültig.<br>
              EN: This code is valid for 20 minutes.<br>
              ZH: 此验证码有效期为 20 分钟。
            </p>
            <p style="color:#999;font-size:12px">
              Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.<br>
              If you did not request this, please ignore this email.<br>
              如非本人操作，请忽略此邮件。
            </p>
          </div>`,
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
      const { email, code } = body;
      if (!email?.trim() || !code?.trim()) {
        return NextResponse.json(
          { error: "Email and code are required" },
          { status: 400 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();
      const admins = await readAdmins();
      const admin = admins.find(
        (a) => a.email && a.email.toLowerCase() === normalizedEmail
      );

      if (!admin) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }

      const valid = verifyCode(admin.username, apiKey, code.trim());
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
      const { email, code, newPassword } = body;
      if (!email?.trim() || !code?.trim() || !newPassword) {
        return NextResponse.json(
          { error: "Email, code, and new password are required" },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();
      const admins = await readAdmins();
      const admin = admins.find(
        (a) => a.email && a.email.toLowerCase() === normalizedEmail
      );

      if (!admin) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }

      // Re-verify the code before applying the change
      if (!verifyCode(admin.username, apiKey, code.trim())) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }

      const idx = admins.findIndex((a) => a.username === admin.username);
      const updated = admins.map((a, i) =>
        i === idx ? { ...a, password: newPassword } : a
      );

      await writeAdmins(updated);
      const persistError = getLastPersistError();
      if (persistError) {
        console.warn(
          `[password-reset] Edge Config persistence failed: ${persistError}`
        );
      }

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
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#c0392b">
                YiXin 中文学校 · Chinesisch Schule Heilbronn
              </h2>
              <h3>Passwort erfolgreich geändert / Password Changed / 密码已更改</h3>
              <p>
                <strong>DE:</strong> Das Passwort Ihres Admin-Kontos wurde erfolgreich geändert.<br>
                <strong>EN:</strong> Your admin account password has been successfully changed.<br>
                <strong>ZH:</strong> 您的管理员账户密码已成功更改。
              </p>
              <p style="color:#666;font-size:13px">
                DE: Falls Sie diese Änderung nicht vorgenommen haben, wenden Sie sich sofort an einen anderen Administrator.<br>
                EN: If you did not make this change, contact another administrator immediately.<br>
                ZH: 如非本人操作，请立即联系其他管理员。
              </p>
            </div>`,
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

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
