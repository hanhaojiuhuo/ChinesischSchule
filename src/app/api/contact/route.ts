import { NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimitPersistent } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/request-utils";
import { contactNotificationEmail, contactConfirmationEmail } from "@/lib/email-templates";

/** Rate-limit: max submissions per IP within 1 hour. */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

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

    // Rate limit by IP — persistent across server restarts
    const ip = getClientIP(request);
    const rl = await checkRateLimitPersistent(`contact-ip:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
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
      html: contactNotificationEmail(trimmedName, trimmedEmail, trimmedMessage),
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
        html: contactConfirmationEmail(trimmedName, trimmedMessage),
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


