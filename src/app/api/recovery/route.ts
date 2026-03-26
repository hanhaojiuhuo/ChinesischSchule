import { NextResponse } from "next/server";

const SESSION_COOKIE = "yixin-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Recovery login: allows an admin to log in with any password when the
 * RECOVERY_MODE environment variable is set to "true".
 *
 * To enable recovery mode, add `RECOVERY_MODE=true` to your Vercel project's
 * environment variables, then deploy.  Remove the variable (or set it to
 * anything other than "true") once a new admin account has been created.
 */
export async function POST(request: Request) {
  if (process.env.RECOVERY_MODE !== "true") {
    return NextResponse.json(
      { error: "Recovery mode is not enabled" },
      { status: 403 }
    );
  }

  // Warn in server logs so operators are aware recovery mode is being used.
  console.warn(
    "[Recovery] Recovery mode login used. Disable RECOVERY_MODE after creating a new admin account."
  );

  const { username } = (await request.json()) as { username?: string };
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

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
