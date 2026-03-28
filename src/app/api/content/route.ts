import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { readContentOverrides, writeContentOverrides } from "@/lib/edge-config";

const BLOB_PATHNAME = "yixin-content-overrides.json";

export async function GET() {
  try {
    // 1. Try Vercel Blob (primary — public store for site content)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // With addRandomSuffix: false there is at most one blob for this path.
      const { blobs } = await list({
        prefix: BLOB_PATHNAME,
        limit: 1,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      if (blobs.length > 0) {
        const res = await fetch(blobs[0].url, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data, {
            headers: {
              "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
          });
        }
      }
    }

    // 2. Fallback: read from Edge Config
    const data = await readContentOverrides();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(request: Request) {
  // Require an authenticated admin session
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const content = await request.json();

    // 1. Try Vercel Blob (primary — overwrites in place with addRandomSuffix: false)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put(BLOB_PATHNAME, JSON.stringify(content), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return NextResponse.json({ success: true });
    }

    // 2. Fallback: store in Edge Config
    const saved = await writeContentOverrides(content as Record<string, unknown>);
    if (!saved) {
      return NextResponse.json(
        { error: "No storage backend configured (BLOB_READ_WRITE_TOKEN or VERCEL_API_TOKEN + EDGE_CONFIG_ID required)." },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
