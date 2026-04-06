import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { Resend } from "resend";
import { readAdmins } from "@/lib/edge-config";

/** Time-slot duration for HMAC-based code validity (10 minutes). */
const CODE_SLOT_MS = 10 * 60 * 1000;

/** Rate-limit: max code requests per username within 1 hour. */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/** In-memory rate-limit store. */
const rateLimitMap = new Map<
  string,
  { count: number; windowStart: number }
>();

function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterMs: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }
  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Generate a 6-digit HMAC-based code tied to a username and time slot.
 * Domain separation uses "password-change" to distinguish from password-reset codes.
 */
function generateCode(username: string, secret: string): string {
  const slot = Math.floor(Date.now() / CODE_SLOT_MS);
  const mac = createHmac("sha256", secret);
  mac.update(`password-change:${username}:${slot}`);
  const num = parseInt(mac.digest("hex").slice(0, 8), 16);
  return String(num % 1_000_000).padStart(6, "0");
}

/** Verify a code against the current and previous time slot. */
function verifyCode(
  username: string,
  secret: string,
  code: string
): boolean {
  const slot = Math.floor(Date.now() / CODE_SLOT_MS);
  for (const s of [slot, slot - 1]) {
    const mac = createHmac("sha256", secret);
    mac.update(`password-change:${username}:${s}`);
    const num = parseInt(mac.digest("hex").slice(0, 8), 16);
    if (String(num % 1_000_000).padStart(6, "0") === code) {
      return true;
    }
  }
  return false;
}

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
    const body = (await request.json()) as Record<string, string>;
    const { action } = body;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email service not configured (RESEND_API_KEY missing)" },
        { status: 503 }
      );
    }

    /* ── Request a verification code ────────────────────────── */
    if (action === "request") {
      const { username } = body;
      if (!username?.trim()) {
        return NextResponse.json(
          { error: "Username is required" },
          { status: 400 }
        );
      }

      const trimmedUsername = username.trim();

      // Rate limit by username
      const rl = checkRateLimit(`pw-change:${trimmedUsername}`);
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

      const code = generateCode(trimmedUsername, apiKey);
      const fromEmail =
        process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: admin.email,
        subject:
          "Passwortänderung Verifizierungscode / Password Change Code / 密码修改验证码",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#c0392b">
              YiXin 中文学校 · Chinesisch Schule Heilbronn
            </h2>
            <h3>Passwortänderung / Password Change / 密码修改</h3>
            <p>
              <strong>DE:</strong> Ihr Verifizierungscode für die Passwortänderung lautet:<br>
              <strong>EN:</strong> Your password change verification code is:<br>
              <strong>ZH:</strong> 您的密码修改验证码为：
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

      const valid = verifyCode(username.trim(), apiKey, code.trim());
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
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** Mask email for display: j***n@example.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}
