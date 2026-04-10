/**
 * Audit logging for admin actions.
 *
 * Logs are stored in Vercel Blob as JSON files with date-based partitioning.
 * Falls back to console.log when Blob is not configured.
 *
 * ## Retention & Deletion Policy
 *
 * Audit logs may contain personal data (admin usernames, IP addresses) and
 * are subject to GDPR data minimisation requirements.
 *
 * - **Retention period**: 90 days (recommended).  Logs older than this should
 *   be deleted periodically via the Vercel Blob dashboard or an automated
 *   cleanup job.
 * - **Data stored**: timestamp, action type, actor (admin username), optional
 *   target, optional details, and client IP address.
 * - **Access**: Stored with `access: "private"` so only server-side code with
 *   a valid `BLOB_READ_WRITE_TOKEN` can read them.
 * - **Deletion requests**: Under GDPR Art. 17, data subjects may request
 *   erasure of their personal data.  Use the Vercel Blob dashboard or API to
 *   delete specific log entries when a valid erasure request is received.
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
        access: "private",
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
        // Use downloadUrl for private blobs (falls back to url for public blobs)
        const fetchUrl = blob.downloadUrl ?? blob.url;
        const res = await fetch(fetchUrl, { cache: "no-store" });
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
