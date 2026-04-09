import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";

export { SESSION_COOKIE };

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
