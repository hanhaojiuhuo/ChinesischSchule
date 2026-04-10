import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit-log";
import { requireAuth } from "@/lib/api-helpers";
import { enforceRateLimit } from "@/lib/rate-limit-helpers";

/** Max uploads per admin per hour. */
const UPLOAD_RATE_LIMIT_MAX = 30;
const UPLOAD_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const sessionUser = auth.user;

  // Rate limit uploads per admin
  const rl = await enforceRateLimit(`upload:${sessionUser}`, UPLOAD_RATE_LIMIT_MAX, UPLOAD_RATE_LIMIT_WINDOW_MS);
  if (!rl.ok) return rl.response;

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
  // Validate file type — both MIME type and extension must match to prevent spoofing.
  // A file with an unknown/empty MIME type is still accepted if its extension matches
  // (common for RAW camera formats), but known-bad MIME types are always rejected.
  const knownBadType = file.type && !ALLOWED_TYPES.includes(file.type);
  const badExtension = !ALLOWED_EXTENSIONS.test(file.name);
  if (knownBadType || badExtension) {
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
    // Sanitize filename: strip path components and dangerous characters,
    // but preserve the file extension
    const rawName = file.name;
    const lastDot = rawName.lastIndexOf(".");
    const ext = lastDot >= 0 ? rawName.slice(lastDot) : "";
    const base = lastDot >= 0 ? rawName.slice(0, lastDot) : rawName;
    const sanitizedBase = base
      .replace(/[/\\]/g, "_")                    // strip path separators
      .replace(/[^a-zA-Z0-9._-]/g, "_")          // only safe chars
      .replace(/\.{2,}/g, ".")                    // no double dots
      .slice(0, 80);                              // cap base length
    const sanitizedExt = ext
      .replace(/[^a-zA-Z0-9.]/g, "")             // only safe chars in ext
      .slice(0, 20);                              // cap ext length
    const sanitizedName = `${sanitizedBase}${sanitizedExt}` || "upload";

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
