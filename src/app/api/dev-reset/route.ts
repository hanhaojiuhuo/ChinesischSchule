import { createClient } from "@vercel/edge-config";
import { NextResponse } from "next/server";

interface AdminUser {
  username: string;
  password: string;
  email?: string;
}

const EDGE_CONFIG_KEY = "yixin-admins";
const DEFAULT_ADMINS: AdminUser[] = [
  { username: "admin", password: "yixin" },
];

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
  let admins: AdminUser[] = [...DEFAULT_ADMINS];
  try {
    if (process.env.EDGE_CONFIG) {
      const client = createClient(process.env.EDGE_CONFIG);
      const stored = await client.get<AdminUser[]>(EDGE_CONFIG_KEY);
      if (Array.isArray(stored) && stored.length > 0) {
        admins = stored;
      }
    }
  } catch {
    // use defaults
  }

  // Update existing user or append new entry
  const idx = admins.findIndex((a) => a.username === username);
  if (idx >= 0) {
    admins[idx] = { ...admins[idx], password: newPassword };
  } else {
    admins.push({ username, password: newPassword });
  }

  // Persist to Vercel Edge Config
  if (!process.env.VERCEL_API_TOKEN || !process.env.EDGE_CONFIG_ID) {
    return NextResponse.json(
      {
        error:
          "Vercel Edge Config not configured (VERCEL_API_TOKEN and EDGE_CONFIG_ID required).",
      },
      { status: 503 }
    );
  }

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          { operation: "upsert", key: EDGE_CONFIG_KEY, value: admins },
        ],
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Failed to save to Vercel: ${text}` },
      { status: 500 }
    );
  }

  console.warn(
    `[Dev-Reset] Password reset via developer mode for user "${username}". ` +
      "Disable RECOVERY_MODE after use."
  );

  return NextResponse.json({ success: true });
}
