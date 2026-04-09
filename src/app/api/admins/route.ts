import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  readAdmins,
  writeAdmins,
  getLastPersistError,
  type AdminUser,
} from "@/lib/edge-config";
import { hashPassword, isBcryptHash } from "@/lib/password";
import { logAuditEvent } from "@/lib/audit-log";
import { requireAuthAndJson } from "@/lib/api-helpers";

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
  const parsed = await requireAuthAndJson<AdminUser[]>(request);
  if (!parsed.ok) return parsed.response;
  const { user: sessionUser, body: admins } = parsed;

  try {

    // Auto-hash any plaintext passwords before persisting
    const hashedAdmins = await Promise.all(
      admins.map(async (admin) => {
        if (isBcryptHash(admin.password)) {
          return admin; // Already hashed
        }
        return {
          ...admin,
          password: await hashPassword(admin.password),
        };
      })
    );

    await writeAdmins(hashedAdmins);
    const persistError = getLastPersistError();

    await logAuditEvent({
      action: "UPDATE_ADMIN_LIST",
      actor: sessionUser,
      details: `Admin list updated (${hashedAdmins.length} entries)`,
    });

    return NextResponse.json({
      success: true,
      persisted: !persistError,
      persistError: persistError ?? undefined,
    });
  } catch (err) {
    console.error("[admins] Error:", err);
    return NextResponse.json(
      { error: "Internal server error / Interner Serverfehler / 服务器内部错误" },
      { status: 500 }
    );
  }
}
