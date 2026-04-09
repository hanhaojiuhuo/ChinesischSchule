import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { Resend } from "resend";
import { readAdmins } from "@/lib/edge-config";
import { logAuditEvent } from "@/lib/audit-log";

const SESSION_COOKIE = "yixin-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const CODE_SLOT_MS = 10 * 60 * 1000; // 10 minutes

function generateRecoveryCode(username: string, secret: string): string {
  const slot = Math.floor(Date.now() / CODE_SLOT_MS);
  const mac = createHmac("sha256", secret);
  mac.update(`recovery:${username}:${slot}`);
  return mac.digest("hex").slice(0, 8).toUpperCase();
}

function verifyRecoveryCode(username: string, secret: string, code: string): boolean {
  const slot = Math.floor(Date.now() / CODE_SLOT_MS);
  for (const s of [slot, slot - 1]) {
    const mac = createHmac("sha256", secret);
    mac.update(`recovery:${username}:${s}`);
    if (mac.digest("hex").slice(0, 8).toUpperCase() === code.toUpperCase()) {
      return true;
    }
  }
  return false;
}

/**
 * Recovery login: allows an admin to log in using email verification when the
 * RECOVERY_MODE environment variable is set to "true".
 *
 * To enable recovery mode, add `RECOVERY_MODE=true` to your Vercel project's
 * environment variables, then deploy.  Remove the variable (or set it to
 * anything other than "true") once a new admin account has been created.
 *
 * Actions:
 *   - "request": Send recovery code to the admin's notification email or to a provided email.
 *     Body: { action: "request", username: string }
 *
 *   - "verify": Verify the recovery code and log in.
 *     Body: { action: "verify", username: string, code: string }
 *
 *   - (legacy, no action): attempt login — now requires email verification.
 */
export async function POST(request: Request) {
  if (process.env.RECOVERY_MODE !== "true") {
    return NextResponse.json(
      { error: "Recovery mode is not enabled" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as Record<string, string>;
  const { action, username } = body;

  if (!username?.trim()) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const trimmedUsername = username.trim();

  /* ── Step 1: Send recovery verification code ──────────── */
  if (action === "request") {
    const apiKey = process.env.RESEND_API_KEY;
    const notificationEmail = process.env.NOTIFICATION_EMAIL;

    // Try to find the admin's email, or use NOTIFICATION_EMAIL
    const admins = await readAdmins();
    const admin = admins.find((a) => a.username === trimmedUsername);
    const targetEmail = admin?.email || notificationEmail;

    if (!apiKey || !targetEmail) {
      return NextResponse.json(
        {
          error: "Email verification is required for recovery but email service is not configured. Set RESEND_API_KEY and NOTIFICATION_EMAIL.",
          noEmail: true,
        },
        { status: 503 }
      );
    }

    const code = generateRecoveryCode(trimmedUsername, apiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: targetEmail,
      subject: "Recovery Mode Verifizierungscode / Recovery Verification Code / 恢复模式验证码",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#c0392b">
            YiXin 中文学校 · Chinesisch Schule Heilbronn
          </h2>
          <h3>Recovery Mode / 恢复模式</h3>
          <p>
            <strong>DE:</strong> Ein Recovery-Mode-Login wurde für Benutzer <code>${trimmedUsername}</code> angefordert.<br>
            <strong>EN:</strong> A recovery mode login was requested for user <code>${trimmedUsername}</code>.<br>
            <strong>ZH:</strong> 用户 <code>${trimmedUsername}</code> 请求了恢复模式登录。
          </p>
          <p style="font-size:32px;letter-spacing:6px;font-weight:bold;color:#c0392b;text-align:center;font-family:monospace">
            ${code}
          </p>
          <p style="color:#666;font-size:13px">
            DE: Dieser Code ist 20 Minuten gültig.<br>
            EN: This code is valid for 20 minutes.<br>
            ZH: 此验证码有效期为 20 分钟。
          </p>
          <p style="color:#c0392b;font-weight:bold;font-size:13px">
            ⚠️ DE: Deaktivieren Sie RECOVERY_MODE nach der Anmeldung!<br>
            ⚠️ EN: Disable RECOVERY_MODE after logging in!<br>
            ⚠️ ZH: 登录后请禁用 RECOVERY_MODE！
          </p>
        </div>`,
    });

    if (error) {
      console.error("[recovery] Failed to send code:", error);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    console.warn(
      `[Recovery] Recovery code sent for user "${trimmedUsername}". Disable RECOVERY_MODE after use.`
    );

    return NextResponse.json({ success: true, codeSent: true });
  }

  /* ── Step 2: Verify code and complete recovery login ──── */
  if (action === "verify") {
    const { code } = body;
    if (!code?.trim()) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      );
    }

    if (!verifyRecoveryCode(trimmedUsername, apiKey, code.trim())) {
      return NextResponse.json(
        { error: "Invalid or expired code / Ungültiger Code / 验证码无效" },
        { status: 400 }
      );
    }

    await logAuditEvent({
      action: "RECOVERY_LOGIN",
      actor: trimmedUsername,
      details: "Recovery mode login with email verification",
    });

    console.warn(
      `[Recovery] Recovery mode login verified for user "${trimmedUsername}". Disable RECOVERY_MODE after creating a new admin account.`
    );

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, trimmedUsername, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  /* ── Legacy: no action field — reject (no longer accept any password) ── */
  return NextResponse.json(
    { error: "Recovery mode now requires email verification. Use action: 'request' then 'verify'.", requiresVerification: true },
    { status: 400 }
  );
}
