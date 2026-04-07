"use client";

import React from "react";

interface SessionTimeoutWarningProps {
  remainingSeconds: number;
  onExtend: () => void;
}

/**
 * Modal popup shown when the admin session is about to expire.
 * The user must click "Extend Session" to reset the timeout.
 */
export default function SessionTimeoutWarning({
  remainingSeconds,
  onExtend,
}: SessionTimeoutWarningProps) {
  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const ss = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
        {/* Warning icon */}
        <div className="text-5xl mb-3">⚠️</div>

        {/* Title – trilingual */}
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          会话即将超时 / Session Timeout / Sitzung läuft ab
        </h2>

        {/* Countdown */}
        <p className="text-3xl font-mono font-bold text-red-600 my-4">
          {mm}:{ss}
        </p>

        {/* Description – trilingual */}
        <p className="text-sm text-gray-600 mb-6">
          您的管理员会话即将到期。请点击下方按钮延长会话。
          <br />
          Your admin session is about to expire. Click below to extend it.
          <br />
          Ihre Admin-Sitzung läuft bald ab. Klicken Sie unten, um sie zu
          verlängern.
        </p>

        {/* Extend button */}
        <button
          onClick={onExtend}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-lg transition-colors text-base shadow-md"
        >
          延长会话 / Extend Session / Sitzung verlängern
        </button>
      </div>
    </div>
  );
}
