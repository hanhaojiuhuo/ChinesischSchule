import { createHmac } from "crypto";

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
  for (const s of [slot, slot - 1]) {
    const mac = createHmac("sha256", secret);
    mac.update(`${domain}:${username}:${s}`);
    if (mac.digest("hex").slice(0, 8).toUpperCase() === code.toUpperCase()) {
      return true;
    }
  }
  return false;
}
