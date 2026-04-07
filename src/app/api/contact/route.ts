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

    // Trim once and reuse throughout
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    if (!/^[^\s@]+@[^\s@]+$/.test(trimmedEmail) || !trimmedEmail.includes(".")) {
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
      subject: `Neue Kontaktanfrage von ${trimmedName} / New contact from ${trimmedName} / 新留言：${trimmedName}`,
      replyTo: trimmedEmail,
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
                ${escapeHtml(trimmedName)}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:bold;color:#666;border-bottom:1px solid #eee">
                E-Mail
              </td>
              <td style="padding:8px 12px;border-bottom:1px solid #eee">
                <a href="mailto:${escapeHtml(trimmedEmail)}">${escapeHtml(trimmedEmail)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:bold;color:#666;vertical-align:top">
                Nachricht
              </td>
              <td style="padding:8px 12px;white-space:pre-wrap">
                ${escapeHtml(trimmedMessage)}
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

    // Send confirmation email to user (best-effort — don't fail the request)
    try {
      const { error: confirmError } = await resend.emails.send({
        from: fromEmail,
        to: trimmedEmail,
        subject:
          "Nachricht erhalten / Message Received / 留言已收到 — YiXin 中文学校",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2 style="color:#c0392b">
              YiXin 中文学校 · Chinesisch Schule Heilbronn
            </h2>
            <h3>Vielen Dank für Ihre Nachricht! / Thank you for your message! / 感谢您的留言！</h3>
            <p>
              <strong>DE:</strong> Liebe/r ${escapeHtml(trimmedName)}, wir haben Ihre Nachricht erhalten und werden uns so bald wie möglich bei Ihnen melden.<br><br>
              <strong>EN:</strong> Dear ${escapeHtml(trimmedName)}, we have received your message and will get back to you as soon as possible.<br><br>
              <strong>ZH:</strong> 亲爱的${escapeHtml(trimmedName)}，我们已收到您的留言，将会尽快回复您。
            </p>
            <h4 style="color:#666;margin-bottom:4px">Ihre Nachricht / Your message / 您的留言：</h4>
            <div style="background:#f8f8f8;padding:12px 16px;border-radius:6px;white-space:pre-wrap;font-size:14px;color:#333;border-left:3px solid #c0392b">
              ${escapeHtml(trimmedMessage)}
            </div>
            <p style="color:#999;font-size:12px;margin-top:24px">
              Dies ist eine automatische Bestätigungs-E-Mail. Bitte antworten Sie nicht auf diese E-Mail.<br>
              This is an automated confirmation email. Please do not reply to this email.<br>
              这是一封自动确认邮件，请勿直接回复此邮件。
            </p>
          </div>`,
      });
      if (confirmError) {
        console.warn(
          "[contact] Confirmation email to user failed:",
          confirmError
        );
      }
    } catch (confirmErr) {
      console.warn(
        "[contact] Confirmation email to user threw:",
        confirmErr
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
