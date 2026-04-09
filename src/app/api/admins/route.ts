import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  readAdmins,
  writeAdmins,
  getLastPersistError,
  type AdminUser,
} from "@/lib/edge-config";

export type { AdminUser };

export async function GET() {
  const admins = await readAdmins();

  // Only authenticated admins can see the full admin list (including passwords).
  // Unauthenticated callers receive a sanitised list with passwords redacted.
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    const sanitised = admins.map(({ username, email }) => ({
      username,
      email: email ?? undefined,
      password: "********",
    }));
    return NextResponse.json(sanitised);
  }

  return NextResponse.json(admins);
}

export async function POST(request: Request) {
  // Require an authenticated admin session
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admins = (await request.json()) as AdminUser[];

    await writeAdmins(admins);
    const persistError = getLastPersistError();

    return NextResponse.json({
      success: true,
      persisted: !persistError,
      persistError: persistError ?? undefined,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
