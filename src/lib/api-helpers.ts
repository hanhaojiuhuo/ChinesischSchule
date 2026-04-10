import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

/**
 * Maximum allowed request body size (in bytes).
 * Requests larger than this are rejected early to prevent abuse.
 * 1 MB is generous for all current API routes (JSON payloads, form data).
 */
const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1 MB

/**
 * Require an authenticated admin session.
 * Returns the username on success, or a 401 NextResponse on failure.
 */
export async function requireAuth(): Promise<
  | { ok: true; user: string }
  | { ok: false; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, user };
}

/**
 * Parse and validate a JSON request body.
 *
 * - Rejects requests whose `Content-Length` exceeds {@link MAX_BODY_SIZE}.
 * - Returns the parsed body on success, or a 400/413 NextResponse on failure.
 */
export async function requireJson<T = Record<string, unknown>>(
  request: Request
): Promise<
  | { ok: true; body: T }
  | { ok: false; response: NextResponse }
> {
  // Validate Content-Type header
  const contentType = request.headers.get("content-type");
  if (contentType && !contentType.includes("application/json")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 }
      ),
    };
  }

  // Check Content-Length header if present
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      ),
    };
  }

  try {
    const body = (await request.json()) as T;
    return { ok: true, body };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Combined helper: require both authentication and a valid JSON body.
 */
export async function requireAuthAndJson<T = Record<string, unknown>>(
  request: Request
): Promise<
  | { ok: true; user: string; body: T }
  | { ok: false; response: NextResponse }
> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const json = await requireJson<T>(request);
  if (!json.ok) return json;

  return { ok: true, user: auth.user, body: json.body };
}
