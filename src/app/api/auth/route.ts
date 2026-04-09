import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { getSessionUser } from "@/lib/session";

/**
 * GET /api/auth — check whether the current request carries a valid
 * (signed) session cookie.  Returns the authenticated username on
 * success or a 401 response otherwise.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, username: user });
}

/** DELETE /api/auth — clear session cookie on logout */
export async function DELETE() {
  const cookieStore = await cookies();
  const response = NextResponse.json({ success: true });
  if (cookieStore.has(SESSION_COOKIE)) {
    response.cookies.delete(SESSION_COOKIE);
  }
  return response;
}
