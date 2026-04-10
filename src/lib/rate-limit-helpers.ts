/**
 * Higher-level rate-limit helpers used across API routes.
 *
 * Wraps {@link checkRateLimitPersistent} with a standard 429 response so
 * every route doesn't have to duplicate the same check → respond pattern.
 */

import { NextResponse } from "next/server";
import { checkRateLimitPersistent } from "@/lib/rate-limit";
import { ErrorMessages } from "@/lib/error-messages";

export interface RateLimitOk {
  ok: true;
  remaining: number;
}

export interface RateLimitBlocked {
  ok: false;
  response: NextResponse;
  retryAfterMs: number;
}

export type RateLimitCheckResult = RateLimitOk | RateLimitBlocked;

/**
 * Check a rate limit and return a pre-built 429 response when the limit is
 * exceeded.  On success the remaining attempt count is returned so callers
 * can include it in their own responses.
 *
 * @param key         Unique rate-limit key (e.g. `login-ip:${ip}`)
 * @param maxAttempts Maximum attempts within the window
 * @param windowMs    Window duration in milliseconds
 * @param message     Optional custom 429 message body (defaults to generic
 *                    trilingual rate-limit message)
 */
export async function enforceRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  message?: Record<string, unknown>,
): Promise<RateLimitCheckResult> {
  const check = await checkRateLimitPersistent(key, maxAttempts, windowMs);
  if (!check.allowed) {
    const body = message ?? {
      error: ErrorMessages.RATE_LIMITED,
      blocked: true,
      remainingAttempts: 0,
    };
    return {
      ok: false,
      response: NextResponse.json(body, { status: 429 }),
      retryAfterMs: check.retryAfterMs,
    };
  }
  return { ok: true, remaining: check.remaining };
}
