/**
 * Audit logging for admin actions.
 *
 * Logs are stored in Vercel Blob as JSON files.
 * Falls back to console.log when Blob is not configured.
 */

import { put, list } from "@vercel/blob";

const BLOB_PREFIX = "yixin-audit-logs/";

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  actor: string;
  target?: string;
  details?: string;
  ip?: string;
}

/**
 * Append an audit log entry.
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, "timestamp">): Promise<void> {
  const fullEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Always log to console for serverless log aggregation
  console.log(`[AUDIT] ${fullEntry.timestamp} | ${fullEntry.action} | actor=${fullEntry.actor}${fullEntry.target ? ` | target=${fullEntry.target}` : ""}${fullEntry.details ? ` | ${fullEntry.details}` : ""}`);

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;

  try {
    // Use date-based partitioning: yixin-audit-logs/2026/04/09/timestamp-random.json
    const d = new Date();
    const datePath = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;
    const filename = `${d.getTime()}-${Math.random().toString(36).slice(2, 8)}.json`;

    await put(
      `${BLOB_PREFIX}${datePath}/${filename}`,
      JSON.stringify(fullEntry),
      {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        token,
      }
    );
  } catch (err) {
    console.warn("[audit-log] Failed to persist to Blob:", err);
  }
}

/**
 * Read recent audit log entries.
 * Returns up to `limit` entries from the most recent logs.
 */
export async function readRecentAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return [];

  try {
    const { blobs } = await list({
      prefix: BLOB_PREFIX,
      limit: limit,
      token,
    });

    // Sort by pathname descending (most recent first)
    const sorted = blobs.sort((a, b) => b.pathname.localeCompare(a.pathname));

    const entries: AuditLogEntry[] = [];
    for (const blob of sorted.slice(0, limit)) {
      try {
        const res = await fetch(blob.url, { cache: "no-store" });
        if (res.ok) {
          entries.push(await res.json());
        }
      } catch {
        // skip unreadable entries
      }
    }

    return entries;
  } catch {
    return [];
  }
}
