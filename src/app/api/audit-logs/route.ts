import { NextResponse } from "next/server";
import { readRecentAuditLogs } from "@/lib/audit-log";
import { requireAuth } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/audit-logs
 * Returns recent audit log entries. Requires authenticated admin session.
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const logs = await readRecentAuditLogs(100);
  return NextResponse.json(logs, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
