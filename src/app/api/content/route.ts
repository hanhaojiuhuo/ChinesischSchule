import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

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
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
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
  // Require an authenticated admin session
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is not configured. Content cannot be saved." },
      { status: 503 }
    );
  }

  try {
    const content = await request.json();

    await put(BLOB_PATHNAME, JSON.stringify(content), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
