import { put, list, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { readContentOverrides, writeContentOverrides } from "@/lib/edge-config";

const BLOB_PATHNAME = "yixin-content-overrides.json";

export async function GET() {
  try {
    // 1. Try Vercel Blob when configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { blobs } = await list({
        prefix: BLOB_PATHNAME,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      if (blobs.length > 0) {
        const latest = blobs.sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() -
            new Date(a.uploadedAt).getTime()
        )[0];
        const res = await fetch(latest.url);
        if (res.ok) {
          return NextResponse.json(await res.json());
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

    // 1. Try Vercel Blob when configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { blobs } = await list({
        prefix: BLOB_PATHNAME,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      for (const blob of blobs) {
        await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      }
      await put(BLOB_PATHNAME, JSON.stringify(content), {
        access: "public",
        contentType: "application/json",
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
