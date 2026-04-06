import { NextResponse } from "next/server";
import { Resend } from "resend";

/** Rate-limit: max submissions per IP within 1 hour. */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** In-memory rate-limit store (keyed by IP). Reset on server restart. */
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string>;
    const { name, email, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        {
          error:
            "Alle Felder sind erforderlich / All fields are required / 所有字段均为必填",
        },
        { status: 400 }
      );
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        {
          error:
            "Ungültige E-Mail-Adresse / Invalid email address / 邮箱地址无效",
        },
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

    const notificationEmail = process.env.NOTIFICATION_EMAIL;
    if (!notificationEmail) {
      return NextResponse.json(
        {
          error:
            "Notification email not configured (NOTIFICATION_EMAIL missing)",
        },
        { status: 503 }
      );
    }

    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      const retryMinutes = Math.ceil(rl.retryAfterMs / 60000);
      return NextResponse.json(
        {
          error: `Zu viele Anfragen. Bitte versuchen Sie es in ${retryMinutes} Minute(n) erneut. / Too many requests. Please try again in ${retryMinutes} minute(s). / 请求过于频繁，请在 ${retryMinutes} 分钟后重试。`,
          rateLimited: true,
        },
        { status: 429 }
      );
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: notificationEmail,
      subject: `Neue Kontaktanfrage von ${name.trim()} / New contact from ${name.trim()} / 新留言：${name.trim()}`,
      replyTo: email.trim(),
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#c0392b">
            YiXin 中文学校 · Chinesisch Schule Heilbronn
          </h2>
          <h3>Neue Kontaktanfrage / New Contact Message / 新联系留言</h3>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr>
              <td style="padding:8px 12px;font-weight:bold;color:#666;border-bottom:1px solid #eee;width:100px">
                Name
              </td>
              <td style="padding:8px 12px;border-bottom:1px solid #eee">
                ${escapeHtml(name.trim())}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:bold;color:#666;border-bottom:1px solid #eee">
                E-Mail
              </td>
              <td style="padding:8px 12px;border-bottom:1px solid #eee">
                <a href="mailto:${escapeHtml(email.trim())}">${escapeHtml(email.trim())}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:bold;color:#666;vertical-align:top">
                Nachricht
              </td>
              <td style="padding:8px 12px;white-space:pre-wrap">
                ${escapeHtml(message.trim())}
              </td>
            </tr>
          </table>
          <p style="color:#999;font-size:12px;margin-top:24px">
            Diese E-Mail wurde über das Kontaktformular der Website gesendet.<br>
            This email was sent via the website contact form.<br>
            此邮件通过网站联系表单发送。
          </p>
        </div>`,
    });

    if (error) {
      console.error("[contact] Failed to send email:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** Escape HTML special characters to prevent injection in email body. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
