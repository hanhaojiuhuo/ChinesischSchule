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
 * Stores the error message from the most recent Edge Config API write attempt.
 * `null` when the last write succeeded or no write has been attempted.
 * Callers can read this immediately after a write to surface detailed errors.
 */
let _lastPersistError: string | null = null;

/**
 * Returns the error message from the most recent {@link writeEdgeConfigItem}
 * call, or `null` if the last write was durably persisted.
 */
export function getLastPersistError(): string | null {
  return _lastPersistError;
}

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

/**
 * Parse an Edge Config connection string to extract the config ID and token.
 * Format: https://edge-config.vercel.com/{id}?token={token}
 */
function parseConnectionString(
  connectionString: string
): { id: string; token: string } | null {
  try {
    const url = new URL(connectionString);
    const id = url.pathname.split("/").filter(Boolean).pop();
    const token = url.searchParams.get("token");
    if (id && token) return { id, token };
  } catch {
    // invalid URL
  }
  return null;
}

/**
 * Resolve the Edge Config ID and token needed for Vercel REST API operations.
 *
 * **Important:** The Vercel REST API (`api.vercel.com`) requires a *Vercel API
 * token* for write operations (PATCH/POST/DELETE).  The read-only token
 * embedded in the Edge Config connection string (`EDGE_CONFIG`) is only valid
 * for SDK reads — it **cannot** be used to update Edge Config items via the
 * REST API.
 *
 * Token priority (first non-empty wins):
 *  1. `VERCEL_API_TOKEN` – Vercel account-level token (recommended for writes)
 *  2. `EDGE_CONFIG_TOKEN` – explicit env var (backward compat)
 *  3. Token parsed from `EDGE_CONFIG` connection string (read-only fallback)
 *
 * Edge Config ID priority:
 *  1. `EDGE_CONFIG_ID` – explicit env var
 *  2. Parsed from `EDGE_CONFIG` connection string
 */
export function getApiCredentials(): { id: string; token: string } | null {
  // 1. Resolve Edge Config ID
  let id = process.env.EDGE_CONFIG_ID;
  let connToken: string | undefined;

  const connStr = getEdgeConfigConnectionString();
  if (connStr) {
    const parsed = parseConnectionString(connStr);
    if (parsed) {
      if (!id) id = parsed.id;
      connToken = parsed.token;
    }
  }

  if (!id) return null;

  // 2. Resolve API token – prefer VERCEL_API_TOKEN (required for REST API
  //    writes) over the Edge Config connection-string token (read-only).
  const token =
    process.env.VERCEL_API_TOKEN ||
    process.env.EDGE_CONFIG_TOKEN ||
    connToken;

  if (!token) return null;

  return { id, token };
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
  const creds = getApiCredentials();
  if (creds) {
    try {
      const res = await fetch(
        `https://api.vercel.com/v1/edge-config/${creds.id}/item/${key}`,
        {
          headers: {
            Authorization: `Bearer ${creds.token}`,
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
 * Returns true when a Vercel API token is available that can durably persist
 * writes to Edge Config.  When this returns false, writes will only go to the
 * in-memory store and will be lost on server restart.
 *
 * Note: having `getApiCredentials()` return non-null does NOT guarantee write
 * success — the token might be a read-only Edge Config connection token.
 * This helper specifically checks for `VERCEL_API_TOKEN`.
 */
export function hasEdgeConfigPersistence(): boolean {
  return !!process.env.VERCEL_API_TOKEN && !!getApiCredentials();
}

/**
 * Write (upsert) a single item to Vercel Edge Config via the Vercel REST API.
 * Requires a Vercel API token (`VERCEL_API_TOKEN`) plus an Edge Config ID
 * (`EDGE_CONFIG_ID` or parsed from `EDGE_CONFIG` connection string).
 *
 * The value is always written to the in-memory store first (as a write-through
 * cache) so that subsequent reads on the same server instance see the latest
 * data immediately — even before Edge Config propagation completes.
 *
 * Always returns `true` because the data is saved to the in-memory store and
 * is usable for the current server session.  Call {@link getLastPersistError}
 * immediately after to check whether the durable Edge Config write succeeded.
 */
export async function writeEdgeConfigItem<T>(key: string, value: T): Promise<boolean> {
  // Always update the in-memory store as a write-through cache so that reads
  // on the same server instance return the freshly-written value immediately.
  memoryStore.set(key, value);
  _lastPersistError = null;

  const creds = getApiCredentials();
  if (!creds) {
    _lastPersistError =
      "Edge Config API credentials missing – set VERCEL_API_TOKEN (Vercel account token) plus EDGE_CONFIG or EDGE_CONFIG_ID. " +
      "The Edge Config connection-string token is read-only and cannot write. " +
      "Data saved to in-memory store only (will be lost on restart).";
    console.warn(
      `[edge-config] ${_lastPersistError} Key: "${key}".`
    );
    return true;
  }
  try {
    const res = await fetch(
      `https://api.vercel.com/v1/edge-config/${creds.id}/items`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${creds.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ operation: "upsert", key, value }],
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      _lastPersistError =
        `Edge Config API returned ${res.status}${body ? `: ${body.slice(0, 300)}` : ""} – data saved to in-memory store only.`;
      console.warn(
        `[edge-config] API write failed for key "${key}": ${_lastPersistError}`
      );
    }
    return true;
  } catch (err) {
    _lastPersistError =
      `Edge Config API error: ${String(err).slice(0, 300)} – data saved to in-memory store only.`;
    console.warn(`[edge-config] Failed to write key "${key}" via API:`, err);
    return true;
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
 * Always returns true (data is saved to in-memory store at minimum).
 * Call {@link getLastPersistError} to check if durable persistence succeeded.
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
