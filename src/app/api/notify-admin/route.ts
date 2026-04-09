import { NextResponse } from "next/server";
import { Resend } from "resend";
import { newAdminWelcomeEmail, newAdminOwnerNotificationEmail } from "@/lib/email-templates";

/**
 * POST /api/notify-admin
 * Send a notification email when a new admin is added.
 * Body: { newUsername: string, newEmail?: string, addedBy: string }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string>;
    const { newUsername, newEmail, addedBy } = body;

    if (!newUsername?.trim()) {
      return NextResponse.json(
        { error: "newUsername is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Email service not configured — skip silently
      return NextResponse.json({ success: true, skipped: true });
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

    const resend = new Resend(apiKey);

    // If the new admin has an email, send them a welcome notification
    if (newEmail?.trim()) {
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: newEmail.trim(),
        subject:
          "Administratorkonto erstellt / Admin Account Created / 管理员账户已创建",
        html: newAdminWelcomeEmail(newUsername.trim(), addedBy?.trim() ?? "System"),
      });
      if (error) {
        console.warn("[notify-admin] Failed to send welcome email:", error);
      }
    }

    // Also notify the site owner if NOTIFICATION_EMAIL is set
    const notificationEmail = process.env.NOTIFICATION_EMAIL;
    if (notificationEmail) {
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: notificationEmail,
        subject: `Neuer Admin hinzugefügt: ${newUsername.trim()} / New admin added / 新增管理员：${newUsername.trim()}`,
        html: newAdminOwnerNotificationEmail(
          newUsername.trim(),
          newEmail?.trim(),
          addedBy?.trim() ?? "System",
        ),
      });
      if (error) {
        console.warn(
          "[notify-admin] Failed to send owner notification:",
          error
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[notify-admin] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}


