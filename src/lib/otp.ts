import { createHmac, timingSafeEqual } from "crypto";

/**
 * Return the secret used for HMAC-based OTP codes.
 *
 * Prefers a dedicated OTP_SECRET env var. Falls back to RESEND_API_KEY
 * so existing deployments continue to work, but OTP_SECRET should be
 * set in production to avoid coupling email credentials with OTP security.
 */
export function getOtpSecret(): string | undefined {
  const dedicated = process.env.OTP_SECRET;
  if (dedicated) return dedicated;

  // Warn once about fallback
  if (
    process.env.RESEND_API_KEY &&
    !process.env.OTP_SECRET &&
    typeof globalThis !== "undefined" &&
    !(globalThis as Record<string, unknown>).__otpFallbackWarned
  ) {
    console.warn(
      "[otp] ⚠️  OTP_SECRET is not set — falling back to RESEND_API_KEY. " +
      "Set a dedicated OTP_SECRET in production so email credential rotation " +
      "doesn't invalidate outstanding OTP codes."
    );
    (globalThis as Record<string, unknown>).__otpFallbackWarned = true;
  }

  return process.env.RESEND_API_KEY;
}

/**
 * Generate an 8-character uppercase hex code tied to a username, domain, and
 * time slot via HMAC-SHA256.  Stateless — no server-side storage required.
 *
 * @param domain  Domain separation string (e.g. "login-2fa", "password-reset")
 * @param username  The admin username
 * @param secret  The HMAC secret (typically RESEND_API_KEY)
 * @param slotMs  Time-slot duration in milliseconds
 */
export function generateHmacCode(
  domain: string,
  username: string,
  secret: string,
  slotMs: number,
): string {
  const slot = Math.floor(Date.now() / slotMs);
  const mac = createHmac("sha256", secret);
  mac.update(`${domain}:${username}:${slot}`);
  return mac.digest("hex").slice(0, 8).toUpperCase();
}

/**
 * Verify a code against the current and previous time slot so codes remain
 * valid for up to 2× slotMs regardless of when the user acts.
 */
export function verifyHmacCode(
  domain: string,
  username: string,
  secret: string,
  code: string,
  slotMs: number,
): boolean {
  const slot = Math.floor(Date.now() / slotMs);
  const normalizedCode = code.toUpperCase();
  for (const s of [slot, slot - 1]) {
    const mac = createHmac("sha256", secret);
    mac.update(`${domain}:${username}:${s}`);
    const expected = mac.digest("hex").slice(0, 8).toUpperCase();
    // Constant-time comparison to prevent timing attacks
    if (
      normalizedCode.length === expected.length &&
      timingSafeEqual(Buffer.from(normalizedCode, "ascii"), Buffer.from(expected, "ascii"))
    ) {
      return true;
    }
  }
  return false;
}
