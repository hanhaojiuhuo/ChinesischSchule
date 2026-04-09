"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Shared error-boundary UI for page-level errors.
 * Logs the error, shows a trilingual recovery message, and offers retry + home link.
 */
export default function PageError({
  error,
  reset,
  label,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** Short tag for console log, e.g. "Impressum" */
  label?: string;
}) {
  useEffect(() => {
    console.error(`[${label ?? "Page"}] Page error:`, error);
  }, [error, label]);

  return (
    <div className="min-h-screen bg-school-gray flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md text-center">
        <h2 className="text-xl font-bold text-school-dark mb-2">
          ⚠️ Seite konnte nicht geladen werden
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Page could not be loaded · 页面加载失败
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 bg-school-red hover:bg-school-red-dark text-white text-sm font-semibold rounded transition-colors"
        >
          Erneut versuchen · Try again · 重试
        </button>
        <p className="mt-4 text-xs text-gray-400">
          <Link href="/" className="underline hover:text-school-red">
            ← Zurück zur Startseite · Back to Home · 返回首页
          </Link>
        </p>
      </div>
    </div>
  );
}
