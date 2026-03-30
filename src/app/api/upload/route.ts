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

  // Validate file type – only JPEG/JPG, PNG, GIF, TIFF, SVG, RAW
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/tiff",
    "image/svg+xml",
    "image/x-dcraw",        // RAW (generic)
    "image/x-canon-cr2",    // Canon RAW
    "image/x-nikon-nef",    // Nikon RAW
    "image/x-sony-arw",     // Sony RAW
    "image/x-adobe-dng",    // Adobe DNG
  ];
  const ALLOWED_EXTENSIONS = /\.(jpe?g|png|gif|tiff?|svg|raw|cr2|nef|arw|dng)$/i;
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.test(file.name)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, GIF, TIFF, SVG, and RAW images are allowed." },
      { status: 400 }
    );
  }

  // Validate file size (max 3 MB)
  const MAX_SIZE = 3 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File is too large (max 3 MB)." }, { status: 400 });
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
