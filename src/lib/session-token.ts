/**
 * Signed session tokens using HMAC-SHA256.
 *
 * Format: `<base64url-payload>.<base64url-signature>`
 * Payload: JSON `{ u: username, t: timestamp }`
 *
 * Prevents cookie forgery — the server is the only party that can
 * produce a valid signature because only the server knows SESSION_SECRET.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { COOKIE_MAX_AGE } from "@/lib/constants";

/**
 * Return the session signing secret.
 *
 * In production `SESSION_SECRET` **must** be set — the function throws
 * to prevent the app from starting with an insecure configuration.
 * During local development a fixed dev-only secret is used so the app
 * works out of the box without extra env setup.
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET environment variable is required in production. " +
        "Generate a random 32+ character string and add it to your environment."
    );
  }
  // Dev-only fallback — never used in production.
  return "dev-only-insecure-session-secret-do-not-use-in-prod";
}

/** Create a signed session token for the given username. */
export function createSessionToken(username: string): string {
  const secret = getSessionSecret();
  const payload = Buffer.from(
    JSON.stringify({ u: username, t: Date.now() })
  ).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verify a signed session token.
 *
 * @returns The username embedded in the token, or `null` if the token
 *          is invalid, expired, or tampered with.
 */
export function verifySessionToken(token: string): string | null {
  try {
    const secret = getSessionSecret();
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex < 0) return null;

    const payload = token.substring(0, dotIndex);
    const signature = token.substring(dotIndex + 1);

    // Timing-safe signature comparison
    const expected = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    // Lengths must match for timingSafeEqual
    if (signature.length !== expected.length) return null;
    if (
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return null;
    }

    // Decode and validate payload
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    ) as { u?: unknown; t?: unknown };

    if (typeof decoded.u !== "string" || typeof decoded.t !== "number") {
      return null;
    }

    // Check token age — must not exceed COOKIE_MAX_AGE (in seconds)
    const ageMs = Date.now() - decoded.t;
    if (ageMs < 0 || ageMs > COOKIE_MAX_AGE * 1000) return null;

    return decoded.u;
  } catch {
    return null;
  }
}
