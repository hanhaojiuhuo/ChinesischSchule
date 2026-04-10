/**
 * Persistent rate limiting backed by Vercel Blob storage.
 *
 * Falls back to in-memory storage when BLOB_READ_WRITE_TOKEN is not available.
 * Rate limit data survives serverless cold starts when Blob is configured.
 */

import { put, list } from "@vercel/blob";

const BLOB_PREFIX = "yixin-rate-limits/";

/** In-memory fallback store for when Blob is not configured. */
const memoryStore = new Map<string, { count: number; windowStart: number }>();

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Sanitise a key for use as a Blob file path.
 * Replaces characters not safe for file paths.
 */
function sanitiseKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

/**
 * Read a rate limit entry from Blob storage.
 */
async function readEntry(key: string): Promise<RateLimitEntry | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    if (!memoryStore.has("__warned_no_blob")) {
      console.warn("[rate-limit] BLOB_READ_WRITE_TOKEN not set — using in-memory fallback. Rate limits will reset on cold start.");
      memoryStore.set("__warned_no_blob", { count: 0, windowStart: 0 });
    }
    return memoryStore.get(key) ?? null;
  }

  try {
    const { blobs } = await list({
      prefix: `${BLOB_PREFIX}${sanitiseKey(key)}.json`,
      limit: 1,
      token,
    });
    if (blobs.length > 0) {
      // Use downloadUrl for private blobs (falls back to url for public blobs)
      const fetchUrl = blobs[0].downloadUrl ?? blobs[0].url;
      const res = await fetch(fetchUrl, { cache: "no-store" });
      if (res.ok) {
        return (await res.json()) as RateLimitEntry;
      }
    }
  } catch {
    // Fall back to memory
    return memoryStore.get(key) ?? null;
  }
  return null;
}

/**
 * Write a rate limit entry to Blob storage.
 */
async function writeEntry(key: string, entry: RateLimitEntry): Promise<void> {
  memoryStore.set(key, entry);

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;

  try {
    await put(
      `${BLOB_PREFIX}${sanitiseKey(key)}.json`,
      JSON.stringify(entry),
      {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        token,
      }
    );
  } catch {
    // Blob write failed — in-memory still updated
  }
}

/**
 * Check and increment rate limit for a given key.
 */
export async function checkRateLimitPersistent(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const entry = await readEntry(key);

  if (!entry || now - entry.windowStart > windowMs) {
    // First attempt or window expired – start new window
    await writeEntry(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  const updated = { count: entry.count + 1, windowStart: entry.windowStart };
  await writeEntry(key, updated);
  return {
    allowed: true,
    remaining: maxAttempts - updated.count,
    retryAfterMs: 0,
  };
}

/**
 * Reset (delete) rate limit data for a key.
 */
export async function resetRateLimit(key: string): Promise<void> {
  memoryStore.delete(key);
  // We overwrite with a zeroed entry (Vercel Blob doesn't have a simple delete-by-path)
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    try {
      await put(
        `${BLOB_PREFIX}${sanitiseKey(key)}.json`,
        JSON.stringify({ count: 0, windowStart: 0 }),
        {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          token,
        }
      );
    } catch {
      // ignore
    }
  }
}
