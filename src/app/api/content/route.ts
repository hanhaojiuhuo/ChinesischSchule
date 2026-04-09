import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit-log";
import { requireAuthAndJson } from "@/lib/api-helpers";

/** Ensure GET is never cached by Next.js or Vercel's CDN. */
export const dynamic = "force-dynamic";

const BLOB_PATHNAME = "yixin-content-overrides.json";

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({});
  }

  try {
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
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }
    }
    return NextResponse.json({});
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(request: Request) {
  // Require an authenticated admin session and validate body size
  const parsed = await requireAuthAndJson(request);
  if (!parsed.ok) return parsed.response;
  const { user: sessionUser, body: content } = parsed;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is not configured. Content cannot be saved." },
      { status: 503 }
    );
  }

  try {
    await put(BLOB_PATHNAME, JSON.stringify(content), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    await logAuditEvent({
      action: "CONTENT_SAVE",
      actor: sessionUser,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
