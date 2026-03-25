import { put, list, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

const BLOB_PATHNAME = "yixin-content-overrides.json";

export async function GET() {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({});
    }
    const { blobs } = await list({
      prefix: BLOB_PATHNAME,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (blobs.length === 0) {
      return NextResponse.json({});
    }
    // Use the most recently uploaded blob
    const latest = blobs.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0];
    const res = await fetch(latest.url);
    if (!res.ok) {
      return NextResponse.json({});
    }
    const data = await res.json();
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
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      // Cloud not configured — return success (no persistent storage in this mode)
      return NextResponse.json({ success: true });
    }
    const content = await request.json();

    // Delete any existing blobs with the same pathname
    const { blobs } = await list({
      prefix: BLOB_PATHNAME,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    for (const blob of blobs) {
      await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    }

    // Upload updated content
    await put(BLOB_PATHNAME, JSON.stringify(content), {
      access: "public",
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
