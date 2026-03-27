import { createClient } from "@vercel/edge-config";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export interface AdminUser {
  username: string;
  password: string;
  email?: string;
}

const DEFAULT_ADMINS: AdminUser[] = [
  { username: "admin", password: "yixin" },
];

const EDGE_CONFIG_KEY = "yixin-admins";

async function readAdmins(): Promise<AdminUser[]> {
  try {
    if (!process.env.EDGE_CONFIG) {
      return DEFAULT_ADMINS;
    }
    const client = createClient(process.env.EDGE_CONFIG);
    const admins = await client.get<AdminUser[]>(EDGE_CONFIG_KEY);
    if (Array.isArray(admins) && admins.length > 0) {
      return admins;
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_ADMINS;
}

export async function GET() {
  const admins = await readAdmins();
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

    if (!process.env.VERCEL_API_TOKEN || !process.env.EDGE_CONFIG_ID) {
      // Cloud not configured — return success (no persistent storage in this mode)
      return NextResponse.json({ success: true });
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
        { error: `Failed to save admins: ${text}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
