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
  const sessionUser = await getSessionUser();

  // Require authentication — don't expose admin usernames to the public
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admins = await readAdmins();

  // Always redact password hashes — they should never leave the server
  const sanitised = admins.map(({ username, email }) => ({
    username,
    email: email ?? undefined,
    password: "********",
  }));

  return NextResponse.json(sanitised);
}

export async function POST(request: Request) {
  const parsed = await requireAuthAndJson<AdminUser[]>(request);
  if (!parsed.ok) return parsed.response;
  const { user: sessionUser, body: admins } = parsed;

  try {

    // Validate that the body is a non-empty array of valid admin objects
    if (!Array.isArray(admins) || admins.length === 0) {
      return NextResponse.json(
        { error: "Admin list must be a non-empty array" },
        { status: 400 }
      );
    }
    for (const admin of admins) {
      if (
        !admin ||
        typeof admin !== "object" ||
        typeof admin.username !== "string" ||
        !admin.username.trim() ||
        typeof admin.password !== "string" ||
        !admin.password
      ) {
        return NextResponse.json(
          { error: "Each admin must have a non-empty username and password" },
          { status: 400 }
        );
      }
    }

    // Prevent the current user from removing themselves (potential lockout)
    if (!admins.some((a) => a.username === sessionUser)) {
      return NextResponse.json(
        { error: "Cannot remove your own account from the admin list" },
        { status: 400 }
      );
    }

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
