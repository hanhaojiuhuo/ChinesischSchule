import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { readRecentAuditLogs } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

/**
 * GET /api/audit-logs
 * Returns recent audit log entries. Requires authenticated admin session.
 */
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await readRecentAuditLogs(100);
  return NextResponse.json(logs, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
