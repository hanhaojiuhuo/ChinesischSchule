import { NextResponse } from "next/server";
import {
  readEdgeConfigItem,
  writeEdgeConfigItem,
  readAdmins,
  readContentOverrides,
  EDGE_CONFIG_KEY,
  CONTENT_EDGE_CONFIG_KEY,
} from "@/lib/edge-config";

/**
 * GET /api/vercel-test
 *
 * Tests Vercel Edge Config connectivity:
 *  1. Checks that required env vars are present.
 *  2. Writes a test value, reads it back, then deletes it.
 *  3. Reads the admin list and content overrides.
 *
 * Returns a JSON report with pass/fail status for each check.
 */
export async function GET() {
  const TEST_KEY = "__vercel_connectivity_test__";
  const testValue = `test-${Date.now()}`;

  const results: Record<string, { ok: boolean; detail: string }> = {};

  /* ── 1. Env vars ─────────────────────────────────────────────── */
  const hasToken = !!process.env.VERCEL_API_TOKEN;
  const hasConfigId = !!process.env.EDGE_CONFIG_ID;
  results["env_VERCEL_API_TOKEN"] = {
    ok: hasToken,
    detail: hasToken ? "set" : "MISSING",
  };
  results["env_EDGE_CONFIG_ID"] = {
    ok: hasConfigId,
    detail: hasConfigId ? "set" : "MISSING",
  };

  if (!hasToken || !hasConfigId) {
    return NextResponse.json(
      { overall: "FAIL", message: "Missing required environment variables.", results },
      { status: 503 }
    );
  }

  /* ── 2. Write test value ─────────────────────────────────────── */
  const writeOk = await writeEdgeConfigItem(TEST_KEY, testValue);
  results["write_test"] = {
    ok: writeOk,
    detail: writeOk ? "write succeeded" : "write FAILED",
  };

  /* ── 3. Read test value back ─────────────────────────────────── */
  if (writeOk) {
    const readBack = await readEdgeConfigItem<string>(TEST_KEY);
    const readOk = readBack === testValue;
    results["read_test"] = {
      ok: readOk,
      detail: readOk
        ? "read-back matches written value"
        : `expected "${testValue}", got "${readBack}"`,
    };

    // Clean up test key
    try {
      await fetch(
        `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [{ operation: "delete", key: TEST_KEY }],
          }),
        }
      );
    } catch {
      // best-effort cleanup
    }
  }

  /* ── 4. Read admins ──────────────────────────────────────────── */
  try {
    const admins = await readAdmins();
    results["read_admins"] = {
      ok: Array.isArray(admins) && admins.length > 0,
      detail: `${admins.length} admin(s) found (key: ${EDGE_CONFIG_KEY})`,
    };
  } catch (err) {
    results["read_admins"] = { ok: false, detail: String(err) };
  }

  /* ── 5. Read content overrides ───────────────────────────────── */
  try {
    const content = await readContentOverrides();
    const keys = Object.keys(content);
    results["read_content_overrides"] = {
      ok: true,
      detail:
        keys.length > 0
          ? `languages with overrides: ${keys.join(", ")} (key: ${CONTENT_EDGE_CONFIG_KEY})`
          : `no overrides stored yet (key: ${CONTENT_EDGE_CONFIG_KEY})`,
    };
  } catch (err) {
    results["read_content_overrides"] = { ok: false, detail: String(err) };
  }

  /* ── overall ─────────────────────────────────────────────────── */
  const allOk = Object.values(results).every((r) => r.ok);

  return NextResponse.json({
    overall: allOk ? "PASS" : "PARTIAL",
    message: allOk
      ? "All Vercel Edge Config connectivity tests passed."
      : "Some tests did not pass — see results for details.",
    results,
  });
}
