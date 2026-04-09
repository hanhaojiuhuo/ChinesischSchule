import { NextResponse } from "next/server";
import {
  readAdmins,
  writeAdmins,
  getLastPersistError,
  DEFAULT_ADMINS,
  type AdminUser,
} from "@/lib/edge-config";
import { hashPassword } from "@/lib/password";
import { logAuditEvent } from "@/lib/audit-log";

const SESSION_COOKIE = "yixin-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * GET – check whether developer mode (RECOVERY_MODE) is enabled.
 */
export async function GET() {
  return NextResponse.json({
    enabled: process.env.RECOVERY_MODE === "true",
  });
}

/**
 * POST – reset admin password (requires RECOVERY_MODE=true).
 *
 * Body: { username: string; newPassword: string }
 *
 * If the username already exists its password is updated,
 * otherwise a new admin entry is created.
 */
export async function POST(request: Request) {
  if (process.env.RECOVERY_MODE !== "true") {
    return NextResponse.json(
      {
        error:
          "Developer mode requires RECOVERY_MODE=true in Vercel environment variables.",
        recoveryNotEnabled: true,
      },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    username?: string;
    newPassword?: string;
  };
  const username = body.username?.trim();
  const newPassword = body.newPassword;

  if (!username || !newPassword) {
    return NextResponse.json(
      { error: "Username and new password are required." },
      { status: 400 }
    );
  }
  if (username.length < 4) {
    return NextResponse.json(
      { error: "Username must be at least 4 characters." },
      { status: 400 }
    );
  }
  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  // Read current admin list from Edge Config
  let admins: AdminUser[];
  try {
    admins = await readAdmins();
  } catch {
    admins = [...DEFAULT_ADMINS];
  }

  // Update existing user or append new entry (hash the password)
  const hashedPassword = await hashPassword(newPassword);
  const idx = admins.findIndex((a) => a.username === username);
  if (idx >= 0) {
    admins[idx] = { ...admins[idx], password: hashedPassword };
  } else {
    admins.push({ username, password: hashedPassword });
  }

  // Persist to Vercel Edge Config (also saves to in-memory store)
  await writeAdmins(admins);
  const persistError = getLastPersistError();
  const persisted = !persistError;

  if (persistError) {
    console.warn(
      `[Dev-Reset] Edge Config persistence failed: ${persistError}`
    );
  }

  await logAuditEvent({
    action: "DEV_RESET_PASSWORD",
    actor: username,
    details: "Password reset via developer/recovery mode (hashed)",
  });

  console.warn(
    `[Dev-Reset] Password reset via developer mode for user "${username}". ` +
      "Disable RECOVERY_MODE after use."
  );

  // Set a session cookie so the user is immediately logged in after the
  // password reset — this avoids the need to go through /api/login (which
  // might read stale data from Edge Config or be blocked by rate limiting
  // from previous failed attempts).
  const response = NextResponse.json({
    success: true,
    persisted,
    persistError: persistError ?? undefined,
  });
  response.cookies.set(SESSION_COOKIE, username, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
