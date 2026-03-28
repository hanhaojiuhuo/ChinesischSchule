import { NextResponse } from "next/server";
import { readAdmins } from "@/lib/edge-config";

const SESSION_COOKIE = "yixin-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/* ── Rate-limit configuration ───────────────────────────────────── */

/** Max failed login attempts per admin account per day. */
const MAX_ATTEMPTS_PER_ACCOUNT = 10;

/** Max failed login attempts per IP address per day. */
const MAX_ATTEMPTS_PER_IP = 20;

/** Window duration: 24 hours. */
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/* ── In-memory rate-limit stores (reset on server restart) ─────── */

const accountAttempts = new Map<
  string,
  { count: number; windowStart: number }
>();
const ipAttempts = new Map<
  string,
  { count: number; windowStart: number }
>();

function checkRateLimit(
  map: Map<string, { count: number; windowStart: number }>,
  key: string,
  maxAttempts: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // First attempt or window expired – start new window
    map.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count };
}

function resetAccountAttempts(username: string) {
  accountAttempts.delete(username);
}

function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

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

    // Check IP rate limit first (broader limit)
    const ipCheck = checkRateLimit(ipAttempts, ip, MAX_ATTEMPTS_PER_IP);
    if (!ipCheck.allowed) {
      return NextResponse.json({
        success: false,
        blocked: true,
        remainingAttempts: 0,
      });
    }

    // Check per-account rate limit
    const accountCheck = checkRateLimit(
      accountAttempts,
      username,
      MAX_ATTEMPTS_PER_ACCOUNT
    );
    if (!accountCheck.allowed) {
      return NextResponse.json({
        success: false,
        blocked: true,
        remainingAttempts: 0,
      });
    }

    // Verify credentials server-side
    const admins = await readAdmins();
    const found = admins.find(
      (a) => a.username === username && a.password === password
    );

    if (found) {
      // Successful login – reset account-level rate limit
      resetAccountAttempts(username);

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

    // Failed login – return remaining attempts (minimum of both limits)
    const remaining = Math.min(accountCheck.remaining, ipCheck.remaining);
    return NextResponse.json({
      success: false,
      blocked: remaining <= 0,
      remainingAttempts: remaining,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
