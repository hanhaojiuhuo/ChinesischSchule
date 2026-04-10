"use client";

/**
 * Global error boundary – catches errors that escape route-level error.tsx
 * boundaries (e.g. root layout errors).
 *
 * Must render its own <html>/<body> because the root layout is not available
 * when this component is shown.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              padding: "2rem",
              maxWidth: "28rem",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              ⚠️ Seite konnte nicht geladen werden
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
              Page could not be loaded · 页面加载失败
            </p>
            {error?.digest && (
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "1rem" }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1.25rem",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Erneut versuchen · Try again · 重试
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
