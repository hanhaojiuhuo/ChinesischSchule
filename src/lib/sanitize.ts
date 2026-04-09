/**
 * Shared HTML sanitization utilities.
 * Used by API routes that generate email HTML content.
 */

/** Escape HTML special characters to prevent injection in email body. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
