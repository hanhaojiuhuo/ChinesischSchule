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
export const CONTENT_EDGE_CONFIG_KEY = "yixin-content-overrides";

/* ── helpers ─────────────────────────────────────────────────────── */

function hasApiCredentials(): boolean {
  return !!(process.env.VERCEL_API_TOKEN && process.env.EDGE_CONFIG_ID);
}

/**
 * Read a single item from Vercel Edge Config via the Vercel REST API.
 * Works with only VERCEL_API_TOKEN + EDGE_CONFIG_ID (no SDK connection string needed).
 */
export async function readEdgeConfigItem<T>(key: string): Promise<T | null> {
  if (!hasApiCredentials()) return null;
  try {
    const res = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/item/${key}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data as T;
  } catch (err) {
    console.warn(`[edge-config] Failed to read key "${key}" via API:`, err);
    return null;
  }
}

/**
 * Write (upsert) a single item to Vercel Edge Config via the Vercel REST API.
 */
export async function writeEdgeConfigItem<T>(key: string, value: T): Promise<boolean> {
  if (!hasApiCredentials()) return false;
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
          items: [{ operation: "upsert", key, value }],
        }),
      }
    );
    return res.ok;
  } catch (err) {
    console.warn(`[edge-config] Failed to write key "${key}" via API:`, err);
    return false;
  }
}

/* ── admin helpers ───────────────────────────────────────────────── */

/**
 * Read the admin list from Vercel Edge Config.
 * Prefers the SDK (EDGE_CONFIG connection string) when available, then falls
 * back to reading via the Vercel REST API (VERCEL_API_TOKEN + EDGE_CONFIG_ID).
 * Returns DEFAULT_ADMINS when Edge Config is not configured or unavailable.
 */
export async function readAdmins(): Promise<AdminUser[]> {
  // 1. Try SDK (fastest – uses the Edge network)
  try {
    if (process.env.EDGE_CONFIG) {
      const client = createClient(process.env.EDGE_CONFIG);
      const admins = await client.get<AdminUser[]>(EDGE_CONFIG_KEY);
      if (Array.isArray(admins) && admins.length > 0) {
        return admins;
      }
    }
  } catch (err) {
    console.warn("[edge-config] SDK read failed, trying API fallback:", err);
  }

  // 2. Fallback: read via Vercel REST API
  const admins = await readEdgeConfigItem<AdminUser[]>(EDGE_CONFIG_KEY);
  if (Array.isArray(admins) && admins.length > 0) {
    return admins;
  }

  return DEFAULT_ADMINS;
}

/**
 * Write the admin list to Vercel Edge Config via the Vercel API.
 * Returns true on success, false when Edge Config is not configured or the write fails.
 */
export async function writeAdmins(admins: AdminUser[]): Promise<boolean> {
  return writeEdgeConfigItem(EDGE_CONFIG_KEY, admins);
}

/* ── content override helpers ────────────────────────────────────── */

/**
 * Read content overrides from Vercel Edge Config.
 * Returns an empty object when not configured or unavailable.
 */
export async function readContentOverrides(): Promise<Record<string, unknown>> {
  const data = await readEdgeConfigItem<Record<string, unknown>>(CONTENT_EDGE_CONFIG_KEY);
  return data ?? {};
}

/**
 * Write content overrides to Vercel Edge Config.
 */
export async function writeContentOverrides(content: Record<string, unknown>): Promise<boolean> {
  return writeEdgeConfigItem(CONTENT_EDGE_CONFIG_KEY, content);
}
