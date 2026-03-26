import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export async function POST(request: Request) {
  // Require an authenticated admin session
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image upload is not configured (BLOB_READ_WRITE_TOKEN missing)." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }

  // Validate file size (max 5 MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File is too large (max 5 MB)." }, { status: 400 });
  }

  try {
    const blob = await put(`news/${Date.now()}-${file.name}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
