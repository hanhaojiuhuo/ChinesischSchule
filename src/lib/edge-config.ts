import { createClient } from "@vercel/edge-config";
import { put, list } from "@vercel/blob";

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

/** Blob path used as durable fallback storage for admin credentials. */
const ADMIN_BLOB_PATHNAME = "yixin-admins.json";

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
 * Cached Edge Config ID discovered via the Vercel REST API.
 * `undefined` = not yet attempted, `null` = attempted but none found.
 */
let _discoveredEdgeConfigId: string | null | undefined;

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
 * Auto-discover the Edge Config ID by listing stores via the Vercel REST API.
 * Requires `VERCEL_API_TOKEN`.  The result is cached for the lifetime of the
 * server instance so the API is called at most once.
 */
async function discoverEdgeConfigId(): Promise<string | null> {
  if (_discoveredEdgeConfigId !== undefined) return _discoveredEdgeConfigId;

  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    _discoveredEdgeConfigId = null;
    return null;
  }

  try {
    const res = await fetch("https://api.vercel.com/v1/edge-config", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(
        `[edge-config] Auto-discovery: API returned ${res.status} – ` +
          "cannot list Edge Config stores. Check VERCEL_API_TOKEN."
      );
      _discoveredEdgeConfigId = null;
      return null;
    }
    const data: unknown = await res.json();
    const stores = Array.isArray(data) ? data : [];
    if (stores.length === 0) {
      console.warn(
        "[edge-config] Auto-discovery: no Edge Config stores found. " +
          "Create one in the Vercel dashboard and link it to this project."
      );
      _discoveredEdgeConfigId = null;
      return null;
    }
    if (stores.length > 1) {
      console.warn(
        `[edge-config] Auto-discovery: ${stores.length} Edge Config stores found. ` +
          `Using first: ${stores[0].id} ("${stores[0].slug ?? "?"}"). ` +
          "Set EDGE_CONFIG_ID explicitly to choose a different store."
      );
    }
    _discoveredEdgeConfigId =
      typeof stores[0].id === "string" && stores[0].id
        ? stores[0].id
        : null;
    if (!_discoveredEdgeConfigId) {
      console.warn(
        "[edge-config] Auto-discovery: first store has no valid id."
      );
      return null;
    }
    console.log(
      `[edge-config] Auto-discovered Edge Config ID: ${_discoveredEdgeConfigId}`
    );
    return _discoveredEdgeConfigId;
  } catch (err) {
    console.warn("[edge-config] Auto-discovery failed:", err);
    _discoveredEdgeConfigId = null;
    return null;
  }
}

/**
 * Async version of {@link getApiCredentials} that includes auto-discovery of
 * the Edge Config ID via the Vercel REST API when `VERCEL_API_TOKEN` is set
 * but `EDGE_CONFIG` / `EDGE_CONFIG_ID` are not configured.
 *
 * Use this in async contexts (read/write functions) for maximum resilience.
 */
export async function resolveApiCredentials(): Promise<{
  id: string;
  token: string;
} | null> {
  // Fast path: sync resolution already has everything
  const sync = getApiCredentials();
  if (sync) return sync;

  // Slow path: VERCEL_API_TOKEN is set but Edge Config ID is unknown
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return null;

  const id = await discoverEdgeConfigId();
  if (!id) return null;

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

  // 3. Fallback: Vercel REST API (includes auto-discovery of Edge Config ID)
  const creds = await resolveApiCredentials();
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
 * Async version of {@link hasEdgeConfigPersistence} that includes auto-discovery
 * of the Edge Config ID via the Vercel REST API.
 */
export async function checkEdgeConfigPersistence(): Promise<boolean> {
  if (!process.env.VERCEL_API_TOKEN) return false;
  return !!(await resolveApiCredentials());
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

  // The Vercel Edge Config REST API requires a Vercel account-level API token
  // (VERCEL_API_TOKEN) for write operations.  The read-only token embedded in
  // the EDGE_CONFIG connection string CANNOT be used for writes — attempting to
  // do so results in 404 / 401 errors from the REST API.  Guard early so we
  // don't make a doomed request.
  if (!process.env.VERCEL_API_TOKEN) {
    _lastPersistError =
      "VERCEL_API_TOKEN not set – cannot write to Edge Config via REST API. " +
      "The EDGE_CONFIG connection-string token is read-only.";
    console.warn(
      `[edge-config] ${_lastPersistError} Key: "${key}".`
    );
    return true;
  }

  const creds = await resolveApiCredentials();
  if (!creds) {
    _lastPersistError =
      "Edge Config ID could not be resolved – VERCEL_API_TOKEN is set but no " +
      "EDGE_CONFIG or EDGE_CONFIG_ID found. Ensure an Edge Config store is " +
      "linked to this Vercel project.";
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

/* ── Blob fallback for admin data ─────────────────────────────────── */

/**
 * Read admin list from Vercel Blob (durable fallback).
 * Returns null when Blob is not configured or has no admin data.
 */
async function readAdminsFromBlob(): Promise<AdminUser[] | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("[edge-config] BLOB_READ_WRITE_TOKEN not set – Blob read skipped.");
    return null;
  }
  try {
    const { blobs } = await list({
      prefix: ADMIN_BLOB_PATHNAME,
      limit: 1,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url, { cache: "no-store" });
      if (!res.ok) {
        console.warn(
          `[edge-config] Blob read returned HTTP ${res.status} for ${blobs[0].url}`
        );
        return null;
      }
      // Guard against unexpectedly large responses (max 1 MB)
      const contentLength = res.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > 1_048_576) {
        console.warn("[edge-config] Blob admin data too large, skipping.");
        return null;
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(
          `[edge-config] Loaded ${(data as AdminUser[]).length} admin(s) from Blob.`
        );
        return data as AdminUser[];
      }
    }
  } catch (err) {
    console.warn("[edge-config] Blob read fallback failed:", err);
  }
  return null;
}

/**
 * Write admin list to Vercel Blob (durable fallback).
 * Returns true on success, false on failure or when Blob is not configured.
 */
async function writeAdminsToBlob(admins: AdminUser[]): Promise<boolean> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("[edge-config] BLOB_READ_WRITE_TOKEN not set – Blob write skipped.");
    return false;
  }
  try {
    await put(ADMIN_BLOB_PATHNAME, JSON.stringify(admins), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log(
      `[edge-config] Admin data (${admins.length} admin(s)) written to Blob successfully.`
    );
    return true;
  } catch (err) {
    console.warn("[edge-config] Blob write fallback failed:", err);
    return false;
  }
}

/* ── admin helpers ───────────────────────────────────────────────── */

/**
 * Read the admin list.
 *
 * Priority:
 *  1. Edge Config (in-memory cache → SDK → REST API)
 *  2. Vercel Blob (durable fallback — works even without VERCEL_API_TOKEN)
 *  3. DEFAULT_ADMINS (hardcoded)
 */
export async function readAdmins(): Promise<AdminUser[]> {
  // 1. Try Edge Config (includes in-memory write-through cache)
  const admins = await readEdgeConfigItem<AdminUser[]>(EDGE_CONFIG_KEY);
  if (Array.isArray(admins) && admins.length > 0) {
    return admins;
  }

  // 2. Try Vercel Blob as durable fallback
  const blobAdmins = await readAdminsFromBlob();
  if (blobAdmins) {
    return blobAdmins;
  }

  // 3. Hardcoded default
  return DEFAULT_ADMINS;
}

/**
 * Write the admin list to all available durable storage backends.
 *
 * Writes to:
 *  1. Edge Config (in-memory store + REST API if VERCEL_API_TOKEN is set)
 *  2. Vercel Blob (durable fallback — uses BLOB_READ_WRITE_TOKEN, auto-set
 *     by Vercel when a Blob store is linked to the project)
 *
 * Always returns true (data is at least in the in-memory store).
 * Call {@link getLastPersistError} to check if ANY durable persistence
 * succeeded.  The error is cleared when Blob write succeeds as fallback.
 */
export async function writeAdmins(admins: AdminUser[]): Promise<boolean> {
  // 1. Write to Edge Config (in-memory cache + optional API write)
  await writeEdgeConfigItem(EDGE_CONFIG_KEY, admins);
  const edgeConfigError = getLastPersistError();

  // 2. ALSO write to Vercel Blob as durable fallback
  const blobOk = await writeAdminsToBlob(admins);

  // If Edge Config durable write failed but Blob write succeeded,
  // the data IS durably stored — clear the persist error so callers
  // know the save was successful.
  if (edgeConfigError && blobOk) {
    _lastPersistError = null;
    console.log(
      "[edge-config] Edge Config write unavailable, but admin data " +
        "persisted to Vercel Blob successfully."
    );
  }

  // If BOTH durable backends failed, ensure the error reflects that
  if (edgeConfigError && !blobOk) {
    _lastPersistError =
      `${edgeConfigError} Blob fallback also unavailable – ` +
      "ensure BLOB_READ_WRITE_TOKEN is configured and a Blob store " +
      "is linked to this Vercel project.";
  }

  return true;
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
