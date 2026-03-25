import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "yixin-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Set session cookie after a successful login */
export async function POST(request: Request) {
  const { username } = (await request.json()) as { username: string };
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

/** Clear session cookie on logout */
export async function DELETE() {
  const cookieStore = await cookies();
  const response = NextResponse.json({ success: true });
  if (cookieStore.has(SESSION_COOKIE)) {
    response.cookies.delete(SESSION_COOKIE);
  }
  return response;
}
