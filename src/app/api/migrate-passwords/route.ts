import { NextResponse } from "next/server";
import { readAdmins, writeAdmins, getLastPersistError } from "@/lib/edge-config";
import { hashPassword, isBcryptHash } from "@/lib/password";
import { logAuditEvent } from "@/lib/audit-log";
import { requireAuth } from "@/lib/api-helpers";

/**
 * POST /api/migrate-passwords
 * Migrates all plaintext admin passwords to bcrypt hashes.
 * Requires an authenticated admin session.
 */
export async function POST() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const sessionUser = auth.user;

  try {
    const admins = await readAdmins();
    let migratedCount = 0;

    const updated = await Promise.all(
      admins.map(async (admin) => {
        if (isBcryptHash(admin.password)) {
          return admin; // Already hashed
        }
        migratedCount++;
        return {
          ...admin,
          password: await hashPassword(admin.password),
        };
      })
    );

    if (migratedCount === 0) {
      return NextResponse.json({
        success: true,
        message: "All passwords are already hashed.",
        migrated: 0,
      });
    }

    await writeAdmins(updated);
    const persistError = getLastPersistError();

    await logAuditEvent({
      action: "MIGRATE_PASSWORDS",
      actor: sessionUser,
      details: `Migrated ${migratedCount} password(s) to bcrypt`,
    });

    return NextResponse.json({
      success: true,
      migrated: migratedCount,
      persisted: !persistError,
      persistError: persistError ?? undefined,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
