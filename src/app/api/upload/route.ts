import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit-log";
import { requireAuth } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const sessionUser = auth.user;

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

  // Validate file type – only JPEG/JPG, PNG, GIF, TIFF, RAW (no SVG — stored XSS risk)
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/tiff",
    "image/x-dcraw",        // RAW (generic)
    "image/x-canon-cr2",    // Canon RAW
    "image/x-nikon-nef",    // Nikon RAW
    "image/x-sony-arw",     // Sony RAW
    "image/x-adobe-dng",    // Adobe DNG
  ];
  const ALLOWED_EXTENSIONS = /\.(jpe?g|png|gif|tiff?|raw|cr2|nef|arw|dng)$/i;
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.test(file.name)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, GIF, TIFF, and RAW images are allowed." },
      { status: 400 }
    );
  }

  // Validate file size (max 3 MB)
  const MAX_SIZE = 3 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File is too large (max 3 MB)." }, { status: 400 });
  }

  try {
    // Sanitize filename: strip path components and dangerous characters
    const sanitizedName = file.name
      .replace(/[/\\]/g, "_")                    // strip path separators
      .replace(/[^a-zA-Z0-9._-]/g, "_")          // only safe chars
      .replace(/\.{2,}/g, ".")                    // no double dots
      .slice(0, 100);                             // cap length

    const blob = await put(`news/${Date.now()}-${sanitizedName}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    await logAuditEvent({
      action: "FILE_UPLOAD",
      actor: sessionUser,
      details: `Uploaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[upload] Error:", err);
    return NextResponse.json(
      { error: "Internal server error / Interner Serverfehler / 服务器内部错误" },
      { status: 500 }
    );
  }
}
