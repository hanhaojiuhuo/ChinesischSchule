/* ── Shared constants ─────────────────────────────────────────── */

/** sessionStorage key for the admin toolbar position (top / bottom). */
export const TOOLBAR_POS_KEY = "yixin-toolbar-position";

/** localStorage key for the cookie consent banner choice. */
export const CONSENT_KEY = "yixin-cookie-consent";

/** Cookie name used for the admin session. */
export const SESSION_COOKIE = "yixin-session";

/** Max age for the admin session cookie (7 days in seconds). */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/** Toolbar position type. */
export type ToolbarPos = "bottom" | "top";
