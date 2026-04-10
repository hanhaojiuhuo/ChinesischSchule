import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            /**
             * CSP configuration notes:
             *
             * 'unsafe-inline' in script-src and style-src is required by
             * Next.js for inline scripts and style injection used during
             * server-side rendering and client hydration.  A nonce-based
             * approach would require custom middleware to generate and inject
             * nonces into every response, which Next.js does not natively
             * support in the App Router without significant complexity.
             *
             * 'unsafe-eval' is only included in development mode for Next.js
             * hot module replacement and React runtime patterns.  It is
             * excluded from production builds.
             *
             * These directives weaken CSP protection against inline script
             * injection but are mitigated by other security layers:
             * - DOMPurify sanitization for all user-generated HTML
             * - Strict input validation on all API endpoints
             * - httpOnly session cookies preventing JavaScript access
             *
             * TODO: Monitor Next.js support for nonce-based CSP in App Router
             *       and migrate when stable support is available.
             */
            value: [
              "default-src 'self'",
              process.env.NODE_ENV === "production"
                ? "script-src 'self' 'unsafe-inline'"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
