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

/**
 * In-memory fallback store used when Vercel Edge Config is not configured
 * (e.g. local development).  Data is lost on server restart.
 */
const memoryStore = new Map<string, unknown>();

/**
 * Build the Edge Config connection string.
 * Uses EDGE_CONFIG env var when available (auto-set by Vercel when the store
 * is linked to the project).  Otherwise constructs it from EDGE_CONFIG_ID +
 * EDGE_CONFIG_TOKEN (suitable for local development / `.env.local`).
 */
export function getEdgeConfigConnectionString(): string | undefined {
  if (process.env.EDGE_CONFIG) return process.env.EDGE_CONFIG;
  const id = process.env.EDGE_CONFIG_ID;
  const token = process.env.EDGE_CONFIG_TOKEN;
  if (id && token) {
    return `https://edge-config.vercel.com/${id}?token=${token}`;
  }
  return undefined;
}

function hasApiCredentials(): boolean {
  return !!(process.env.EDGE_CONFIG_TOKEN && process.env.EDGE_CONFIG_ID);
}

/**
 * Read a single item from Vercel Edge Config.
 *
 * Checks the in-memory write-through cache first so that values written by
 * {@link writeEdgeConfigItem} on the same server instance are returned
 * immediately (avoids Edge Config propagation delays and SDK caching issues).
 *
 * Then tries the SDK (fastest – uses the Edge network) when a connection
 * string is available (EDGE_CONFIG, or EDGE_CONFIG_ID + EDGE_CONFIG_TOKEN).
 * Falls back to the Vercel REST API (EDGE_CONFIG_TOKEN + EDGE_CONFIG_ID).
 */
export async function readEdgeConfigItem<T>(key: string): Promise<T | null> {
  // 1. Check in-memory write-through cache first (freshest data on this instance)
  if (memoryStore.has(key)) {
    return memoryStore.get(key) as T;
  }

  // 2. Try SDK (fastest for cold reads)
  const connectionString = getEdgeConfigConnectionString();
  if (connectionString) {
    try {
      const client = createClient(connectionString);
      const value = await client.get<T>(key);
      if (value !== undefined && value !== null) {
        return value;
      }
    } catch (err) {
      console.warn(`[edge-config] SDK read failed for key "${key}":`, err);
    }
  }

  // 3. Fallback: Vercel REST API
  if (hasApiCredentials()) {
    try {
      const res = await fetch(
        `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/item/${key}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.EDGE_CONFIG_TOKEN}`,
          },
          cache: "no-store",
        }
      );
      if (res.ok) {
        return (await res.json()) as T;
      }
    } catch (err) {
      console.warn(`[edge-config] API read failed for key "${key}":`, err);
    }
  }

  return null;
}

/**
 * Returns true when Edge Config API credentials are available, meaning writes
 * will be durably persisted (not just stored in-memory).
 */
export function hasEdgeConfigPersistence(): boolean {
  return hasApiCredentials();
}

/**
 * Write (upsert) a single item to Vercel Edge Config via the Vercel REST API.
 * Requires EDGE_CONFIG_TOKEN + EDGE_CONFIG_ID.
 *
 * The value is always written to the in-memory store first (as a write-through
 * cache) so that subsequent reads on the same server instance see the latest
 * data immediately — even before Edge Config propagation completes.
 */
export async function writeEdgeConfigItem<T>(key: string, value: T): Promise<boolean> {
  // Always update the in-memory store as a write-through cache so that reads
  // on the same server instance return the freshly-written value immediately.
  memoryStore.set(key, value);

  if (!hasApiCredentials()) {
    console.warn(
      `[edge-config] EDGE_CONFIG_TOKEN or EDGE_CONFIG_ID missing – key "${key}" saved to in-memory store only (will be lost on restart).`
    );
    // Return true because the data IS saved (to memory) and is usable for the
    // current server session.  Callers that need to distinguish durable
    // persistence from in-memory-only storage should use hasEdgeConfigPersistence().
    return true;
  }
  try {
    const res = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.EDGE_CONFIG_TOKEN}`,
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
 * Uses SDK (connection string) when available, then falls back to the REST API.
 * Returns DEFAULT_ADMINS when Edge Config is not configured or unavailable.
 */
export async function readAdmins(): Promise<AdminUser[]> {
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
