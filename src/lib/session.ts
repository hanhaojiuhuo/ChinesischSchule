import { cookies } from "next/headers";

export const SESSION_COOKIE = "yixin-session";

/** Returns the admin username stored in the session cookie, or null if unauthenticated. */
export async function getSessionUser(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get(SESSION_COOKIE)?.value;
    return value ?? null;
  } catch {
    return null;
  }
}
