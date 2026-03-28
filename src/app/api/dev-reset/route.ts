import { NextResponse } from "next/server";
import {
  readAdmins,
  writeAdmins,
  DEFAULT_ADMINS,
  type AdminUser,
} from "@/lib/edge-config";

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

  // Update existing user or append new entry
  const idx = admins.findIndex((a) => a.username === username);
  if (idx >= 0) {
    admins[idx] = { ...admins[idx], password: newPassword };
  } else {
    admins.push({ username, password: newPassword });
  }

  // Persist to Vercel Edge Config
  const saved = await writeAdmins(admins);
  if (!saved) {
    return NextResponse.json(
      {
        error:
          "Vercel Edge Config not configured (VERCEL_API_TOKEN and EDGE_CONFIG_ID required).",
      },
      { status: 503 }
    );
  }

  console.warn(
    `[Dev-Reset] Password reset via developer mode for user "${username}". ` +
      "Disable RECOVERY_MODE after use."
  );

  return NextResponse.json({ success: true });
}
