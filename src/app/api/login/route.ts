import { NextResponse } from "next/server";
import { readAdmins } from "@/lib/edge-config";
import { verifyPassword } from "@/lib/password";
import { checkRateLimitPersistent, resetRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit-log";
import { getClientIP } from "@/lib/request-utils";

const SESSION_COOKIE = "yixin-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

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
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const { username, password } = body;
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const ip = getClientIP(request);

    // Check IP rate limit first (broader limit) — persistent across restarts
    const ipCheck = await checkRateLimitPersistent(
      `login-ip:${ip}`,
      MAX_ATTEMPTS_PER_IP,
      RATE_LIMIT_WINDOW_MS
    );
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { success: false, blocked: true, remainingAttempts: 0 },
        { status: 429 }
      );
    }

    // Check per-account rate limit — persistent across restarts
    const accountCheck = await checkRateLimitPersistent(
      `login-account:${username}`,
      MAX_ATTEMPTS_PER_ACCOUNT,
      RATE_LIMIT_WINDOW_MS
    );
    if (!accountCheck.allowed) {
      return NextResponse.json(
        { success: false, blocked: true, remainingAttempts: 0 },
        { status: 429 }
      );
    }

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
      response.cookies.set(SESSION_COOKIE, username, {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
        secure: process.env.NODE_ENV === "production",
      });
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
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
