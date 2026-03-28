import { createClient } from "@vercel/edge-config";

export interface AdminUser {
  username: string;
  password: string;
  email?: string;
}

export const DEFAULT_ADMINS: AdminUser[] = [
  { username: "admin", password: "yixin" },
];

export const EDGE_CONFIG_KEY = "yixin-admins";

/**
 * Read the admin list from Vercel Edge Config.
 * Falls back to DEFAULT_ADMINS when Edge Config is not configured or unavailable.
 */
export async function readAdmins(): Promise<AdminUser[]> {
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

/**
 * Write the admin list to Vercel Edge Config via the Vercel API.
 * Returns true on success, false when Edge Config is not configured or the write fails.
 */
export async function writeAdmins(admins: AdminUser[]): Promise<boolean> {
  if (!process.env.VERCEL_API_TOKEN || !process.env.EDGE_CONFIG_ID) {
    return false;
  }
  try {
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
    return res.ok;
  } catch {
    return false;
  }
}
