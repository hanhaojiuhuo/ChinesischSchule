import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, COOKIE_MAX_AGE } from "@/lib/constants";
import { requireJson } from "@/lib/api-helpers";

/** Set session cookie after a successful login */
export async function POST(request: Request) {
  const parsed = await requireJson<{ username: string }>(request);
  if (!parsed.ok) return parsed.response;
  const { username } = parsed.body;
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
