import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  readEdgeConfigItem,
  writeEdgeConfigItem,
  readAdmins,
  readContentOverrides,
  getEdgeConfigConnectionString,
  EDGE_CONFIG_KEY,
  CONTENT_EDGE_CONFIG_KEY,
} from "@/lib/edge-config";

/**
 * GET /api/vercel-test
 *
 * Tests Vercel storage connectivity:
 *  1. Checks that required env vars are present.
 *  2. Tests Edge Config read (via SDK when EDGE_CONFIG or
 *     EDGE_CONFIG_ID + EDGE_CONFIG_TOKEN are set).
 *  3. Tests Edge Config write/read/delete round-trip (when VERCEL_API_TOKEN is set).
 *  4. Reads the admin list and content overrides.
 *  5. Tests Vercel Blob connectivity (when BLOB_READ_WRITE_TOKEN is set).
 *
 * Returns a JSON report with pass/fail status for each check.
 */
export async function GET() {
  const results: Record<string, { ok: boolean; detail: string }> = {};

  /* ── 1. Environment variables ────────────────────────────────── */
  const hasEdgeConfig = !!process.env.EDGE_CONFIG;
  const hasEdgeConfigId = !!process.env.EDGE_CONFIG_ID;
  const hasEdgeConfigToken = !!process.env.EDGE_CONFIG_TOKEN;
  const hasApiToken = !!process.env.VERCEL_API_TOKEN;
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  const connectionString = getEdgeConfigConnectionString();

  results["env_EDGE_CONFIG"] = {
    ok: hasEdgeConfig,
    detail: hasEdgeConfig ? "set" : "not set (auto-set when deployed to Vercel)",
  };
  results["env_EDGE_CONFIG_ID"] = {
    ok: hasEdgeConfigId,
    detail: hasEdgeConfigId ? "set" : "MISSING",
  };
  results["env_EDGE_CONFIG_TOKEN"] = {
    ok: hasEdgeConfigToken,
    detail: hasEdgeConfigToken ? "set" : "not set",
  };
  results["env_VERCEL_API_TOKEN"] = {
    ok: hasApiToken,
    detail: hasApiToken ? "set" : "not set (required for write operations)",
  };
  results["env_BLOB_READ_WRITE_TOKEN"] = {
    ok: hasBlobToken,
    detail: hasBlobToken ? "set" : "not set (required for Blob uploads)",
  };
  results["edge_config_connection_string"] = {
    ok: !!connectionString,
    detail: connectionString
      ? "available (SDK reads enabled)"
      : "UNAVAILABLE — set EDGE_CONFIG, or EDGE_CONFIG_ID + EDGE_CONFIG_TOKEN",
  };

  /* ── 2. Edge Config SDK read ─────────────────────────────────── */
  if (connectionString) {
    try {
      const admins = await readAdmins();
      results["edge_config_sdk_read"] = {
        ok: Array.isArray(admins) && admins.length > 0,
        detail: `${admins.length} admin(s) found via SDK (key: ${EDGE_CONFIG_KEY})`,
      };
    } catch (err) {
      results["edge_config_sdk_read"] = { ok: false, detail: String(err) };
    }
  } else {
    results["edge_config_sdk_read"] = {
      ok: false,
      detail: "skipped — no connection string available",
    };
  }

  /* ── 3. Edge Config API write/read round-trip ────────────────── */
  if (hasApiToken && hasEdgeConfigId) {
    const TEST_KEY = "__vercel_connectivity_test__";
    const testValue = `test-${Date.now()}`;

    const writeOk = await writeEdgeConfigItem(TEST_KEY, testValue);
    results["edge_config_api_write"] = {
      ok: writeOk,
      detail: writeOk ? "write succeeded" : "write FAILED",
    };

    if (writeOk) {
      const readBack = await readEdgeConfigItem<string>(TEST_KEY);
      const readOk = readBack === testValue;
      results["edge_config_api_read"] = {
        ok: readOk,
        detail: readOk
          ? "read-back matches written value"
          : `expected "${testValue}", got "${readBack}"`,
      };

      // Clean up
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
  } else {
    results["edge_config_api_write"] = {
      ok: false,
      detail: "skipped — VERCEL_API_TOKEN or EDGE_CONFIG_ID missing (write operations unavailable)",
    };
  }

  /* ── 4. Read content overrides ───────────────────────────────── */
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

  /* ── 5. Vercel Blob connectivity ─────────────────────────────── */
  if (hasBlobToken) {
    try {
      const { blobs } = await list({
        limit: 1,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      results["blob_connectivity"] = {
        ok: true,
        detail: `Blob store accessible (${blobs.length > 0 ? "has files" : "empty"})`,
      };
    } catch (err) {
      results["blob_connectivity"] = { ok: false, detail: `Blob list failed: ${String(err)}` };
    }
  } else {
    results["blob_connectivity"] = {
      ok: false,
      detail: "skipped — BLOB_READ_WRITE_TOKEN not set (auto-set when deployed to Vercel)",
    };
  }

  /* ── overall ─────────────────────────────────────────────────── */
  const allOk = Object.values(results).every((r) => r.ok);

  return NextResponse.json({
    overall: allOk ? "PASS" : "PARTIAL",
    message: allOk
      ? "All Vercel storage connectivity tests passed."
      : "Some tests did not pass — see results for details.",
    results,
  });
}
