import { NextResponse } from "next/server";
import { Resend } from "resend";

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
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#c0392b">
              YiXin 中文学校 · Chinesisch Schule Heilbronn
            </h2>
            <h3>Willkommen als Administrator / Welcome as Administrator / 欢迎成为管理员</h3>
            <p>
              <strong>DE:</strong> Ihr Administratorkonto wurde erstellt.<br>
              <strong>EN:</strong> Your administrator account has been created.<br>
              <strong>ZH:</strong> 您的管理员账户已创建。
            </p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr>
                <td style="padding:8px 12px;font-weight:bold;color:#666;border-bottom:1px solid #eee">
                  Benutzername / Username / 用户名
                </td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee">
                  ${escapeHtml(newUsername.trim())}
                </td>
              </tr>
              <tr>
                <td style="padding:8px 12px;font-weight:bold;color:#666;border-bottom:1px solid #eee">
                  Hinzugefügt von / Added by / 添加者
                </td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee">
                  ${escapeHtml(addedBy?.trim() ?? "System")}
                </td>
              </tr>
            </table>
            <p style="color:#666;font-size:13px">
              DE: Bitte melden Sie sich unter /admin an und ändern Sie Ihr Passwort.<br>
              EN: Please log in at /admin and change your password.<br>
              ZH: 请前往 /admin 登录并修改密码。
            </p>
            <p style="color:#999;font-size:12px">
              Falls Sie diese Nachricht nicht erwarten, ignorieren Sie sie bitte.<br>
              If you did not expect this message, please ignore it.<br>
              如非预期操作，请忽略此邮件。
            </p>
          </div>`,
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
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#c0392b">
              YiXin 中文学校 · Chinesisch Schule Heilbronn
            </h2>
            <h3>Neuer Administrator / New Administrator / 新增管理员</h3>
            <p>
              <strong>DE:</strong> Ein neuer Administrator wurde hinzugefügt.<br>
              <strong>EN:</strong> A new administrator has been added.<br>
              <strong>ZH:</strong> 已添加新的管理员。
            </p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr>
                <td style="padding:8px 12px;font-weight:bold;color:#666;border-bottom:1px solid #eee">
                  Benutzername / Username / 用户名
                </td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee">
                  ${escapeHtml(newUsername.trim())}
                </td>
              </tr>
              <tr>
                <td style="padding:8px 12px;font-weight:bold;color:#666;border-bottom:1px solid #eee">
                  E-Mail
                </td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee">
                  ${newEmail?.trim() ? escapeHtml(newEmail.trim()) : "<em>nicht angegeben / not set / 未设置</em>"}
                </td>
              </tr>
              <tr>
                <td style="padding:8px 12px;font-weight:bold;color:#666;border-bottom:1px solid #eee">
                  Hinzugefügt von / Added by / 添加者
                </td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee">
                  ${escapeHtml(addedBy?.trim() ?? "System")}
                </td>
              </tr>
            </table>
          </div>`,
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

/** Escape HTML special characters to prevent injection in email body. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
