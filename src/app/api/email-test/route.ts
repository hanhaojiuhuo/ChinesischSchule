import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAuth } from "@/lib/api-helpers";
import { enforceRateLimit } from "@/lib/rate-limit-helpers";

/**
 * GET /api/email-test
 *
 * Diagnostic endpoint to verify that RESEND_API_KEY and NOTIFICATION_EMAIL
 * are configured correctly and that emails can be sent.
 *
 * - Requires admin authentication.
 * - Checks that both env vars are present.
 * - Sends a test email to NOTIFICATION_EMAIL.
 * - Reports success or failure with actionable diagnostics.
 *
 * Rate-limited: at most 3 test emails per 10 minutes (persistent via Blob).
 */

const TEST_RATE_LIMIT_MAX = 3;
const TEST_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const results: Record<string, { ok: boolean; detail: string }> = {};

  /* ── 1. Check env vars ─────────────────────────────────────── */
  const apiKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  results["RESEND_API_KEY"] = {
    ok: !!apiKey,
    detail: apiKey
      ? "configured"
      : "MISSING — add RESEND_API_KEY in Vercel → Settings → Environment Variables",
  };

  results["NOTIFICATION_EMAIL"] = {
    ok: !!notificationEmail,
    detail: notificationEmail
      ? `configured: ${notificationEmail}`
      : "MISSING — add NOTIFICATION_EMAIL in Vercel → Settings → Environment Variables",
  };

  results["RESEND_FROM_EMAIL"] = {
    ok: true,
    detail: `using: ${fromEmail}${
      process.env.RESEND_FROM_EMAIL
        ? " (custom)"
        : " (default Resend sandbox — emails only delivered to your verified Resend account email)"
    }`,
  };

  if (!apiKey || !notificationEmail) {
    return NextResponse.json({
      overall: "FAIL",
      message: "Missing required environment variables — see details.",
      results,
    });
  }

  /* ── 2. Rate limit (persistent via Blob) ─────────────────── */
  const rl = await enforceRateLimit(
    "email-test-global",
    TEST_RATE_LIMIT_MAX,
    TEST_RATE_LIMIT_WINDOW_MS,
  );
  if (!rl.ok) {
    results["send_test_email"] = {
      ok: false,
      detail: `Rate limited — max ${TEST_RATE_LIMIT_MAX} test emails per 10 minutes. Try again later.`,
    };
    return NextResponse.json({
      overall: "RATE_LIMITED",
      message: "Test email rate-limited. Environment variables look correct.",
      results,
    });
  }

  /* ── 3. Send a test email ──────────────────────────────────── */
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: notificationEmail,
      subject: "✅ YiXin Email Test / 邮件功能测试 / E-Mail-Test",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#c0392b">
            YiXin 中文学校 · Chinesisch Schule Heilbronn
          </h2>
          <h3>✅ E-Mail-Test erfolgreich / Email Test Successful / 邮件测试成功</h3>
          <p>
            <strong>DE:</strong> Diese E-Mail bestätigt, dass das Kontaktformular korrekt konfiguriert ist.<br>
            <strong>EN:</strong> This email confirms the contact form email function is working correctly.<br>
            <strong>ZH:</strong> 此邮件确认网站联系表单的邮件功能已正确配置。
          </p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr>
              <td style="padding:8px 12px;font-weight:bold;color:#666;border-bottom:1px solid #eee;width:140px">
                RESEND_API_KEY
              </td>
              <td style="padding:8px 12px;border-bottom:1px solid #eee;color:green">✓ configured</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:bold;color:#666;border-bottom:1px solid #eee">
                NOTIFICATION_EMAIL
              </td>
              <td style="padding:8px 12px;border-bottom:1px solid #eee;color:green">✓ ${notificationEmail}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:bold;color:#666;border-bottom:1px solid #eee">
                From address
              </td>
              <td style="padding:8px 12px;border-bottom:1px solid #eee">${fromEmail}</td>
            </tr>
          </table>
          <p style="color:#999;font-size:12px;margin-top:24px">
            Sent at: ${new Date().toISOString()}<br>
            Kontaktformular, Passwortänderung und Admin-Benachrichtigungen verwenden denselben E-Mail-Service.<br>
            Contact form, password change, and admin notifications use the same email service.
          </p>
        </div>`,
    });

    if (error) {
      results["send_test_email"] = {
        ok: false,
        detail: `Resend API returned error — check API key and sender configuration`,
      };

      // Provide actionable guidance
      const errorStr = JSON.stringify(error);
      if (errorStr.includes("API key")) {
        results["diagnosis"] = {
          ok: false,
          detail:
            "RESEND_API_KEY appears invalid. Generate a new key at https://resend.com/api-keys",
        };
      } else if (
        errorStr.includes("not allowed") ||
        errorStr.includes("not verified")
      ) {
        results["diagnosis"] = {
          ok: false,
          detail:
            "Using Resend sandbox (onboarding@resend.dev). In test mode, emails can ONLY be sent to your Resend account email. Either: 1) Make sure NOTIFICATION_EMAIL matches your Resend account email, or 2) Add a verified domain in Resend to send to any address.",
        };
      }

      return NextResponse.json({
        overall: "FAIL",
        message: "Email send failed — see details.",
        results,
      });
    }

    results["send_test_email"] = {
      ok: true,
      detail: `Email sent successfully! Resend ID: ${data?.id ?? "unknown"}`,
    };

    return NextResponse.json({
      overall: "PASS",
      message: `Test email sent to ${notificationEmail}. Check your inbox (and spam folder).`,
      results,
    });
  } catch (err) {
    results["send_test_email"] = {
      ok: false,
      detail: `Exception: ${String(err)}`,
    };
    return NextResponse.json({
      overall: "FAIL",
      message: "Email send threw an exception — see details.",
      results,
    });
  }
}
