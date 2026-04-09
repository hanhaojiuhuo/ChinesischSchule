import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, COOKIE_MAX_AGE } from "@/lib/constants";
import { createSessionToken, verifySessionToken } from "@/lib/session-token";

export { SESSION_COOKIE };

/**
 * Returns the admin username from the signed session cookie, or null
 * if the cookie is missing, expired, or has an invalid signature.
 */
export async function getSessionUser(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Set a signed session cookie on the given response.
 *
 * Centralises the cookie-creation logic so every route uses the same
 * attributes (httpOnly, sameSite, secure, maxAge, path).
 */
export function setSessionCookie(
  response: NextResponse,
  username: string
): void {
  const token = createSessionToken(username);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}
