/**
 * Shared validation utilities for content fields and image uploads.
 */

/* ─── Word counting ──────────────────────────────────────────── */

/** Count words in text, handling both CJK characters (each = 1 word) and latin words. */
export function countWords(text: string): number {
  if (!text.trim()) return 0;
  const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}]/gu);
  const stripped = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}]/gu, " ");
  const latin = stripped.trim().split(/\s+/).filter(Boolean);
  return (cjk?.length ?? 0) + latin.length;
}

export const MAX_WORDS_NEWS = 1000;
export const MAX_WORDS_DEFAULT = 200;

/* ─── Image validation ───────────────────────────────────────── */

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/tiff",
  "image/svg+xml",
];

/** Fallback extension check for formats (like RAW) without standardised MIME types. */
export const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|tiff?|svg|raw|cr2|nef|arw|dng)$/i;

export const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3 MB

export const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/gif,image/tiff,image/svg+xml,.raw,.cr2,.nef,.arw,.dng";

/**
 * Validate an image file for type and size.
 * Returns an error string (trilingual) or null when valid.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !ALLOWED_IMAGE_EXTENSIONS.test(file.name)) {
    return "Only JPEG, PNG, GIF, TIFF, SVG, and RAW images are allowed. / Nur JPEG, PNG, GIF, TIFF, SVG und RAW erlaubt. / 仅支持 JPEG、PNG、GIF、TIFF、SVG、RAW 格式。";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "File size must be under 3 MB. / Dateigröße muss unter 3 MB liegen. / 文件大小不能超过 3 MB。";
  }
  return null;
}
