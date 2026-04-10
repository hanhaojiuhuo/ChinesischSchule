import { NextResponse } from "next/server";
import { readAdmins } from "@/lib/edge-config";
import { verifyPassword } from "@/lib/password";
import { resetRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-helpers";
import { logAuditEvent } from "@/lib/audit-log";
import { getClientIP } from "@/lib/request-utils";
import { setSessionCookie } from "@/lib/session";
import { requireJson } from "@/lib/api-helpers";
import { ErrorMessages } from "@/lib/error-messages";

/* ── Rate-limit configuration ───────────────────────────────────── */

/** Max failed login attempts per admin account per day. */
const MAX_ATTEMPTS_PER_ACCOUNT = 10;

/** Max failed login attempts per IP address per day. */
const MAX_ATTEMPTS_PER_IP = 20;

/** Window duration: 24 hours. */
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/* ── POST /api/login ────────────────────────────────────────────── */

export async function POST(request: Request) {
  try {
    const parsed = await requireJson<{
      username?: string;
      password?: string;
    }>(request);
    if (!parsed.ok) return parsed.response;
    const { body } = parsed;

    const { username, password } = body;
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const ip = getClientIP(request);

    // Check IP rate limit first (broader limit) — persistent across restarts
    const ipCheck = await enforceRateLimit(
      `login-ip:${ip}`,
      MAX_ATTEMPTS_PER_IP,
      RATE_LIMIT_WINDOW_MS,
      { success: false, blocked: true, remainingAttempts: 0 },
    );
    if (!ipCheck.ok) return ipCheck.response;

    // Check per-account rate limit — persistent across restarts
    const accountCheck = await enforceRateLimit(
      `login-account:${username}`,
      MAX_ATTEMPTS_PER_ACCOUNT,
      RATE_LIMIT_WINDOW_MS,
      { success: false, blocked: true, remainingAttempts: 0 },
    );
    if (!accountCheck.ok) return accountCheck.response;

    // Verify credentials server-side (supports bcrypt and legacy plaintext)
    const admins = await readAdmins();
    const found = admins.find((a) => a.username === username);

    if (found && (await verifyPassword(password, found.password))) {
      // Successful login – reset account-level rate limit
      await resetRateLimit(`login-account:${username}`);

      await logAuditEvent({
        action: "LOGIN",
        actor: username,
        ip,
      });

      const response = NextResponse.json({ success: true });
      setSessionCookie(response, username);
      return response;
    }

    await logAuditEvent({
      action: "LOGIN_FAILED",
      actor: username,
      ip,
    });

    // Failed login – return remaining attempts (minimum of both limits)
    const remaining = Math.min(accountCheck.remaining, ipCheck.remaining);
    return NextResponse.json(
      { success: false, blocked: remaining <= 0, remainingAttempts: remaining },
      { status: 401 }
    );
  } catch (err) {
    console.error("[login] Error:", err);
    return NextResponse.json(
      { error: ErrorMessages.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
