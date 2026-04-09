import { escapeHtml } from "@/lib/sanitize";

/* ── Shared email template builder ─────────────────────────────── */

const BRAND = "YiXin 中文学校 · Chinesisch Schule Heilbronn";
const BRAND_COLOR = "#c0392b";

/** Wrap arbitrary body content in the standard school email chrome. */
export function emailWrapper(bodyHtml: string): string {
  return `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
  <h2 style="color:${BRAND_COLOR}">${BRAND}</h2>
  ${bodyHtml}
</div>`;
}

/* ── Reusable fragments ───────────────────────────────────────── */

/** Large centered verification-code block. */
export function codeBlock(code: string, fontSize = 36, spacing = 8): string {
  return `<p style="font-size:${fontSize}px;letter-spacing:${spacing}px;font-weight:bold;color:${BRAND_COLOR};text-align:center;font-family:monospace">${code}</p>`;
}

/** Trilingual validity hint. */
export function validityHint(minutes: number): string {
  return `<p style="color:#666;font-size:13px">DE: Dieser Code ist ${minutes} Minuten gültig.<br>EN: This code is valid for ${minutes} minutes.<br>ZH: 此验证码有效期为 ${minutes} 分钟。</p>`;
}

/** Small gray disclaimer paragraph. */
export function disclaimer(deText: string, enText: string, zhText: string): string {
  return `<p style="color:#999;font-size:12px">${deText}<br>${enText}<br>${zhText}</p>`;
}

/** A standard table row. */
function tableRow(label: string, value: string, last = false): string {
  const border = last ? "" : "border-bottom:1px solid #eee;";
  return `<tr>
  <td style="padding:8px 12px;font-weight:bold;color:#666;${border}">${label}</td>
  <td style="padding:8px 12px;${border}">${value}</td>
</tr>`;
}

/** Wrap rows in a table. */
export function infoTable(rows: [label: string, value: string][]): string {
  const inner = rows
    .map((r, i) => tableRow(r[0], r[1], i === rows.length - 1))
    .join("\n");
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">${inner}</table>`;
}

/* ── Concrete templates ───────────────────────────────────────── */

/** 2FA login code email. */
export function loginCodeEmail(code: string): string {
  return emailWrapper(`
    <h3>Anmeldecode / Login Verification Code / 登录验证码</h3>
    <p><strong>DE:</strong> Ihr Anmeldeverifizierungscode lautet:<br><strong>EN:</strong> Your login verification code is:<br><strong>ZH:</strong> 您的登录验证码为：</p>
    ${codeBlock(code, 32, 6)}
    ${validityHint(10)}
    ${disclaimer(
      "Falls Sie sich nicht angemeldet haben, ignorieren Sie diese E-Mail und ändern Sie Ihr Passwort.",
      "If you did not attempt to log in, please ignore this email and change your password.",
      "如非本人登录，请忽略此邮件并修改密码。",
    )}
  `);
}

/** Password reset code (user-initiated). */
export function passwordResetCodeEmail(code: string): string {
  return emailWrapper(`
    <h3>Passwort-Reset / Password Reset / 密码重置</h3>
    <p><strong>DE:</strong> Ihr Verifizierungscode lautet:<br><strong>EN:</strong> Your verification code is:<br><strong>ZH:</strong> 您的验证码为：</p>
    ${codeBlock(code)}
    ${validityHint(30)}
    ${disclaimer(
      "Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.",
      "If you did not request this, please ignore this email.",
      "如非本人操作，请忽略此邮件。",
    )}
  `);
}

/** Password reset code (admin-initiated). */
export function adminPasswordResetEmail(
  code: string,
  username: string,
  resetLink: string,
): string {
  return emailWrapper(`
    <h3>Passwort-Reset durch Administrator / Admin Password Reset / 管理员重置密码</h3>
    <p><strong>DE:</strong> Ein Administrator hat einen Passwort-Reset für Ihr Konto angefordert.<br><strong>EN:</strong> An administrator has requested a password reset for your account.<br><strong>ZH:</strong> 管理员已为您的账户发起密码重置。</p>
    <p style="background:#f8f8f8;padding:10px;border-radius:6px;font-size:14px"><strong>Benutzername / Username / 用户名:</strong> <code style="color:${BRAND_COLOR};font-size:16px">${escapeHtml(username)}</code></p>
    <p><strong>DE:</strong> Ihr Verifizierungscode lautet:<br><strong>EN:</strong> Your verification code is:<br><strong>ZH:</strong> 您的验证码为：</p>
    ${codeBlock(code)}
    <p><strong>DE:</strong> Klicken Sie auf den folgenden Link, um Ihr Passwort zu ändern:<br><strong>EN:</strong> Click the link below to change your password:<br><strong>ZH:</strong> 请点击以下链接修改密码：</p>
    <p style="text-align:center;margin:16px 0"><a href="${resetLink}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">Passwort ändern / Change Password / 修改密码</a></p>
    <p style="color:#666;font-size:12px;word-break:break-all">${resetLink}</p>
    ${validityHint(30)}
    ${disclaimer(
      "Falls Sie diese Anfrage nicht gestellt haben, kontaktieren Sie bitte sofort einen Administrator.",
      "If you did not request this, please contact an administrator immediately.",
      "如非本人操作，请立即联系管理员。",
    )}
  `);
}

/** Password change verification code email. */
export function passwordChangeCodeEmail(code: string): string {
  return emailWrapper(`
    <h3>Passwortänderung / Password Change / 密码修改</h3>
    <p><strong>DE:</strong> Ihr Verifizierungscode für die Passwortänderung lautet:<br><strong>EN:</strong> Your password change verification code is:<br><strong>ZH:</strong> 您的密码修改验证码为：</p>
    ${codeBlock(code)}
    ${validityHint(20)}
    ${disclaimer(
      "Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.",
      "If you did not request this, please ignore this email.",
      "如非本人操作，请忽略此邮件。",
    )}
  `);
}

/** Password successfully changed confirmation email. */
export function passwordChangedConfirmEmail(): string {
  return emailWrapper(`
    <h3>Passwort erfolgreich geändert / Password Changed / 密码已更改</h3>
    <p><strong>DE:</strong> Das Passwort Ihres Admin-Kontos wurde erfolgreich geändert.<br><strong>EN:</strong> Your admin account password has been successfully changed.<br><strong>ZH:</strong> 您的管理员账户密码已成功更改。</p>
    <p style="color:#666;font-size:13px">DE: Falls Sie diese Änderung nicht vorgenommen haben, wenden Sie sich sofort an einen anderen Administrator.<br>EN: If you did not make this change, contact another administrator immediately.<br>ZH: 如非本人操作，请立即联系其他管理员。</p>
  `);
}

/** Recovery mode verification code email. */
export function recoveryCodeEmail(code: string, username: string): string {
  return emailWrapper(`
    <h3>Recovery Mode / 恢复模式</h3>
    <p><strong>DE:</strong> Ein Recovery-Mode-Login wurde für Benutzer <code>${escapeHtml(username)}</code> angefordert.<br><strong>EN:</strong> A recovery mode login was requested for user <code>${escapeHtml(username)}</code>.<br><strong>ZH:</strong> 用户 <code>${escapeHtml(username)}</code> 请求了恢复模式登录。</p>
    ${codeBlock(code, 32, 6)}
    ${validityHint(20)}
    <p style="color:${BRAND_COLOR};font-weight:bold;font-size:13px">⚠️ DE: Deaktivieren Sie RECOVERY_MODE nach der Anmeldung!<br>⚠️ EN: Disable RECOVERY_MODE after logging in!<br>⚠️ ZH: 登录后请禁用 RECOVERY_MODE！</p>
  `);
}

/** Contact form – admin notification email. */
export function contactNotificationEmail(
  name: string,
  email: string,
  message: string,
): string {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <h2 style="color:${BRAND_COLOR}">${BRAND}</h2>
  <h3>Neue Kontaktanfrage / New Contact Message / 新联系留言</h3>
  ${infoTable([
    ["Name", escapeHtml(name)],
    ["E-Mail", `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`],
    ["Nachricht", `<span style="white-space:pre-wrap">${escapeHtml(message)}</span>`],
  ])}
  ${disclaimer(
    "Diese E-Mail wurde über das Kontaktformular der Website gesendet.",
    "This email was sent via the website contact form.",
    "此邮件通过网站联系表单发送。",
  )}
</div>`;
}

/** Contact form – user confirmation email. */
export function contactConfirmationEmail(name: string, message: string): string {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <h2 style="color:${BRAND_COLOR}">${BRAND}</h2>
  <h3>Vielen Dank für Ihre Nachricht! / Thank you for your message! / 感谢您的留言！</h3>
  <p><strong>DE:</strong> Liebe/r ${escapeHtml(name)}, wir haben Ihre Nachricht erhalten und werden uns so bald wie möglich bei Ihnen melden.<br><br><strong>EN:</strong> Dear ${escapeHtml(name)}, we have received your message and will get back to you as soon as possible.<br><br><strong>ZH:</strong> 亲爱的${escapeHtml(name)}，我们已收到您的留言，将会尽快回复您。</p>
  <h4 style="color:#666;margin-bottom:4px">Ihre Nachricht / Your message / 您的留言：</h4>
  <div style="background:#f8f8f8;padding:12px 16px;border-radius:6px;white-space:pre-wrap;font-size:14px;color:#333;border-left:3px solid ${BRAND_COLOR}">${escapeHtml(message)}</div>
  ${disclaimer(
    "Dies ist eine automatische Bestätigungs-E-Mail. Bitte antworten Sie nicht auf diese E-Mail.",
    "This is an automated confirmation email. Please do not reply to this email.",
    "这是一封自动确认邮件，请勿直接回复此邮件。",
  )}
</div>`;
}

/** New admin welcome email. */
export function newAdminWelcomeEmail(username: string, addedBy: string): string {
  return emailWrapper(`
    <h3>Willkommen als Administrator / Welcome as Administrator / 欢迎成为管理员</h3>
    <p><strong>DE:</strong> Ihr Administratorkonto wurde erstellt.<br><strong>EN:</strong> Your administrator account has been created.<br><strong>ZH:</strong> 您的管理员账户已创建。</p>
    ${infoTable([
      ["Benutzername / Username / 用户名", escapeHtml(username)],
      ["Hinzugefügt von / Added by / 添加者", escapeHtml(addedBy)],
    ])}
    <p style="color:#666;font-size:13px">DE: Bitte melden Sie sich unter /admin an und ändern Sie Ihr Passwort.<br>EN: Please log in at /admin and change your password.<br>ZH: 请前往 /admin 登录并修改密码。</p>
    ${disclaimer(
      "Falls Sie diese Nachricht nicht erwarten, ignorieren Sie sie bitte.",
      "If you did not expect this message, please ignore it.",
      "如非预期操作，请忽略此邮件。",
    )}
  `);
}

/** Owner notification when a new admin is added. */
export function newAdminOwnerNotificationEmail(
  username: string,
  email: string | undefined,
  addedBy: string,
): string {
  return emailWrapper(`
    <h3>Neuer Administrator / New Administrator / 新增管理员</h3>
    <p><strong>DE:</strong> Ein neuer Administrator wurde hinzugefügt.<br><strong>EN:</strong> A new administrator has been added.<br><strong>ZH:</strong> 已添加新的管理员。</p>
    ${infoTable([
      ["Benutzername / Username / 用户名", escapeHtml(username)],
      ["E-Mail", email ? escapeHtml(email) : "<em>nicht angegeben / not set / 未设置</em>"],
      ["Hinzugefügt von / Added by / 添加者", escapeHtml(addedBy)],
    ])}
  `);
}
