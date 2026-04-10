import DOMPurify from "dompurify";

/**
 * Allowed tags and attributes for news rich-text content.
 * Restricts output to the subset our RichTextEditor can produce.
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "b", "strong", "i", "em", "u", "br", "div", "p", "span", "a", "font",
  ] as string[],
  ALLOWED_ATTR: [
    "href", "target", "rel", "color", "size", "class",
  ] as string[],
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitize HTML produced by the rich-text editor so it is safe to render
 * with `dangerouslySetInnerHTML`. Only the subset of elements the toolbar
 * can generate is permitted.
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") {
    // SSR fallback: strip all HTML tags since DOMPurify requires a DOM
    return dirty.replace(/<[^>]*>/g, "");
  }
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG) as string;
}

/** Strip all HTML tags and return plain text (useful for word-counts and previews). */
export function stripHtml(html: string): string {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, "");
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent ?? "";
}
