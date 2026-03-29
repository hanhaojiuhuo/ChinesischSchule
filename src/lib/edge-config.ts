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
 * Build the `?teamId=…` query string for Vercel REST API calls.
 *
 * When a Vercel project belongs to a **team**, some API endpoints require a
 * `teamId` query parameter so the request is scoped to the correct
 * organisation.  Without it, calls may return 404 or empty results.
 *
 * Checks (in order): `VERCEL_TEAM_ID` (explicit), `VERCEL_ORG_ID`
 * (sometimes auto-set by Vercel in CI/build contexts).
 * Returns an empty string for personal-account projects.
 */
export function getTeamIdParam(): string {
  const teamId = process.env.VERCEL_TEAM_ID || process.env.VERCEL_ORG_ID;
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

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
    const res = await fetch(`https://api.vercel.com/v1/edge-config${getTeamIdParam()}`, {
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
        `https://api.vercel.com/v1/edge-config/${creds.id}/item/${key}${getTeamIdParam()}`,
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

  let creds = await resolveApiCredentials();
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

  const teamParam = getTeamIdParam();

  /** Attempt a single PATCH write and return the Response or null on network error. */
  async function attemptWrite(id: string, token: string): Promise<Response | null> {
    try {
      return await fetch(
        `https://api.vercel.com/v1/edge-config/${id}/items${teamParam}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [{ operation: "upsert", key, value }],
          }),
        }
      );
    } catch (err) {
      console.warn(`[edge-config] Network error writing key "${key}":`, err);
      return null;
    }
  }

  // First attempt with current credentials
  let res = await attemptWrite(creds.id, creds.token);

  // On 404, the Edge Config ID may be stale (e.g. store was re-created).
  // Invalidate the cached discovery result and retry with a fresh lookup.
  if (res && res.status === 404 && _discoveredEdgeConfigId !== undefined) {
    console.warn(
      `[edge-config] Write returned 404 for Edge Config ID "${creds.id}" ` +
        `(teamParam: "${teamParam}"). Retrying with fresh auto-discovery…`
    );
    _discoveredEdgeConfigId = undefined; // reset cache so discoverEdgeConfigId() re-fetches
    const freshCreds = await resolveApiCredentials();
    if (freshCreds && freshCreds.id !== creds.id) {
      creds = freshCreds;
      res = await attemptWrite(creds.id, creds.token);
    }
  }

  if (!res) {
    _lastPersistError =
      "Edge Config API network error – data saved to in-memory store only.";
    console.warn(`[edge-config] ${_lastPersistError} Key: "${key}".`);
    return true;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    _lastPersistError =
      `Edge Config API returned ${res.status}${body ? `: ${body.slice(0, 300)}` : ""}` +
      ` (edgeConfigId: ${creds.id}, teamParam: "${teamParam}")` +
      " – data saved to in-memory store only.";
    console.warn(
      `[edge-config] API write failed for key "${key}": ${_lastPersistError}`
    );
  }
  return true;
}

/* ── admin helpers ───────────────────────────────────────────────── */

/**
 * Read the admin list.
 *
 * Priority:
 *  1. Edge Config (in-memory cache → SDK → REST API)
 *  2. DEFAULT_ADMINS (hardcoded)
 */
export async function readAdmins(): Promise<AdminUser[]> {
  // 1. Try Edge Config (includes in-memory write-through cache)
  const admins = await readEdgeConfigItem<AdminUser[]>(EDGE_CONFIG_KEY);
  if (Array.isArray(admins) && admins.length > 0) {
    return admins;
  }

  // 2. Hardcoded default
  return DEFAULT_ADMINS;
}

/**
 * Write the admin list to Edge Config.
 *
 * Writes to Edge Config (in-memory store + REST API if VERCEL_API_TOKEN is set).
 *
 * Always returns true (data is at least in the in-memory store).
 * Call {@link getLastPersistError} to check if the durable Edge Config write
 * succeeded.
 */
export async function writeAdmins(admins: AdminUser[]): Promise<boolean> {
  await writeEdgeConfigItem(EDGE_CONFIG_KEY, admins);
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
