import { list, put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  readEdgeConfigItem,
  writeEdgeConfigItem,
  readAdmins,
  readContentOverrides,
  getEdgeConfigConnectionString,
  getApiCredentials,
  getLastPersistError,
  hasEdgeConfigPersistence,
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
 *  3. Tests Edge Config write/read/delete round-trip (when EDGE_CONFIG_TOKEN is set).
 *  4. Reads the admin list and content overrides.
 *  5. Tests Vercel Blob connectivity (list).
 *  6. Tests Vercel Blob write/read/delete round-trip (data transfer).
 *
 * Returns a JSON report with pass/fail status for each check.
 */
export async function GET() {
  const results: Record<string, { ok: boolean; detail: string }> = {};

  /* ── 1. Environment variables ────────────────────────────────── */
  const hasEdgeConfig = !!process.env.EDGE_CONFIG;
  const hasEdgeConfigId = !!process.env.EDGE_CONFIG_ID;
  const hasEdgeConfigToken = !!process.env.EDGE_CONFIG_TOKEN;
  const hasVercelApiToken = !!process.env.VERCEL_API_TOKEN;
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  const connectionString = getEdgeConfigConnectionString();
  const apiCreds = getApiCredentials();
  const canPersistWrites = hasEdgeConfigPersistence();

  results["env_EDGE_CONFIG"] = {
    ok: hasEdgeConfig,
    detail: hasEdgeConfig ? "set" : "not set (auto-set when deployed to Vercel)",
  };
  results["env_EDGE_CONFIG_ID"] = {
    ok: hasEdgeConfigId || !!apiCreds,
    detail: hasEdgeConfigId
      ? "set"
      : apiCreds
        ? "parsed from EDGE_CONFIG connection string"
        : "MISSING",
  };
  results["env_VERCEL_API_TOKEN"] = {
    ok: hasVercelApiToken,
    detail: hasVercelApiToken
      ? "set (required for Edge Config writes)"
      : "NOT SET — Edge Config writes will fail! Create a token at https://vercel.com/account/tokens and add it as VERCEL_API_TOKEN.",
  };
  results["env_EDGE_CONFIG_TOKEN"] = {
    ok: hasEdgeConfigToken || !!apiCreds,
    detail: hasEdgeConfigToken
      ? "set"
      : apiCreds
        ? "parsed from EDGE_CONFIG connection string (read-only)"
        : "not set",
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
  results["edge_config_write_persistence"] = {
    ok: canPersistWrites,
    detail: canPersistWrites
      ? "VERCEL_API_TOKEN set — Edge Config writes will be durably persisted"
      : "VERCEL_API_TOKEN missing — writes go to in-memory store only (lost on restart). Set VERCEL_API_TOKEN to enable durable persistence.",
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
  if (apiCreds) {
    const TEST_KEY = "__vercel_connectivity_test__";
    const testValue = `test-${Date.now()}`;

    await writeEdgeConfigItem(TEST_KEY, testValue);
    const persistError = getLastPersistError();
    const durableWriteOk = !persistError;
    results["edge_config_api_write"] = {
      ok: durableWriteOk,
      detail: durableWriteOk
        ? "durable write succeeded (data persisted to Edge Config)"
        : `durable write FAILED: ${persistError}`,
    };

    if (durableWriteOk) {
      const readBack = await readEdgeConfigItem<string>(TEST_KEY);
      const readOk = readBack === testValue;
      results["edge_config_api_read"] = {
        ok: readOk,
        detail: readOk
          ? "read-back matches written value"
          : `expected "${testValue}", got "${readBack}"`,
      };

      // Clean up test data (uses API credentials resolved with VERCEL_API_TOKEN priority)
      try {
        await fetch(
          `https://api.vercel.com/v1/edge-config/${apiCreds.id}/items`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${apiCreds.token}`,
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
      detail: "skipped — no Edge Config credentials available (set EDGE_CONFIG + VERCEL_API_TOKEN)",
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

  /* ── 6. Vercel Blob write/read/delete round-trip ─────────────── */
  if (hasBlobToken) {
    const TEST_BLOB_PATH = "__vercel_blob_test__.json";
    const testPayload = { test: true, ts: Date.now() };
    try {
      // Write
      const blob = await put(TEST_BLOB_PATH, JSON.stringify(testPayload), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      // Read back
      const readRes = await fetch(blob.url, { cache: "no-store" });
      if (!readRes.ok) {
        results["blob_data_transfer"] = {
          ok: false,
          detail: `Blob read-back failed with status ${readRes.status}`,
        };
      } else {
        const readData = await readRes.json();
        const matches = readData.test === true && readData.ts === testPayload.ts;
        results["blob_data_transfer"] = {
          ok: matches,
          detail: matches
            ? "write → read round-trip succeeded"
            : `data mismatch: expected {test:true,ts:${testPayload.ts}}, got {test:${readData.test},ts:${readData.ts}}`,
        };
      }

      // Clean up
      try {
        await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      } catch {
        // best-effort cleanup
      }
    } catch (err) {
      results["blob_data_transfer"] = {
        ok: false,
        detail: `Blob write/read round-trip failed: ${String(err)}`,
      };
    }
  } else {
    results["blob_data_transfer"] = {
      ok: false,
      detail: "skipped — BLOB_READ_WRITE_TOKEN not set",
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
