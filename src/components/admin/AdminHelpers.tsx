"use client";

import { useState } from "react";
import { countWords } from "@/lib/validation";

/* ─── Small helpers ─────────────────────────────────────────── */

export function ExpandModal({
  label,
  value,
  onChange,
  onClose,
  maxWords,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  maxWords?: number;
}) {
  const wc = maxWords != null ? countWords(value) : 0;
  const overLimit = maxWords != null && wc > maxWords;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] flex flex-col p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">{label}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg font-bold px-2"
            title="Close"
          >✕</button>
        </div>
        <textarea
          className={`flex-1 w-full border rounded px-4 py-3 text-sm focus:outline-none resize-none min-h-[60vh] ${overLimit ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-school-red"}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
        {maxWords != null && (
          <p className={`text-xs mt-1 text-right ${overLimit ? "text-red-600 font-semibold" : "text-gray-400"}`}>
            {wc} / {maxWords} words
          </p>
        )}
      </div>
    </div>
  );
}

export function ExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-2 text-gray-400 hover:text-school-red transition-colors"
      title="Expand editor / Vergrößern / 展开编辑器"
    >
      <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
        <path d="M3 3h6v2H5v4H3V3zm14 0h-6v2h4v4h2V3zM3 17h6v-2H5v-4H3v6zm14 0h-6v-2h4v-4h2v6z" />
      </svg>
    </button>
  );
}

export function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
      title={show ? "隐藏密码 / Hide password" : "显示密码 / Show password"}
    >
      {show ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  multiline = false,
  expandable = false,
  type = "text",
  autoComplete,
  showPassword,
  onTogglePassword,
  maxWords,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  expandable?: boolean;
  type?: string;
  autoComplete?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  maxWords?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword && showPassword ? "text" : type;
  const wc = maxWords != null ? countWords(value) : 0;
  const overLimit = maxWords != null && wc > maxWords;
  return (
    <div className="mb-3">
      <div className="flex items-center mb-1">
        <label className="block text-xs font-semibold text-gray-600">{label}</label>
        {multiline && expandable && (
          <ExpandButton onClick={() => setExpanded(true)} />
        )}
      </div>
      {expanded && (
        <ExpandModal
          label={label}
          value={value}
          onChange={onChange}
          onClose={() => setExpanded(false)}
          maxWords={maxWords}
        />
      )}
      {multiline ? (
        <>
          <textarea
            className={`w-full border rounded px-3 py-2 text-sm focus:outline-none resize-y min-h-[80px] ${overLimit ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-school-red"}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {maxWords != null && (
            <p className={`text-xs mt-0.5 text-right ${overLimit ? "text-red-600 font-semibold" : "text-gray-400"}`}>
              {wc} / {maxWords} words
            </p>
          )}
        </>
      ) : isPassword && onTogglePassword ? (
        <div className="relative">
          <input
            type={effectiveType}
            autoComplete={autoComplete}
            className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-school-red"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <EyeToggle show={!!showPassword} onToggle={onTogglePassword} />
        </div>
      ) : (
        <>
          <input
            type={effectiveType}
            autoComplete={autoComplete}
            className={`w-full border rounded px-3 py-2 text-sm focus:outline-none ${overLimit ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-school-red"}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {maxWords != null && (
            <p className={`text-xs mt-0.5 text-right ${overLimit ? "text-red-600 font-semibold" : "text-gray-400"}`}>
              {wc} / {maxWords} words
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function SectionCard({
  title,
  children,
  onSave,
  saveStatus = "idle",
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  onSave?: () => void;
  saveStatus?: "idle" | "saving" | "saved";
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 mb-6 bg-white shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-4">
        <h3 className="font-bold text-school-dark text-base">
          {title}
        </h3>
        {onSave && (
          <button
            onClick={onSave}
            disabled={saveStatus === "saving"}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold rounded transition-colors"
          >
            {saveStatus === "saving"
              ? "⏳ …"
              : saveStatus === "saved"
              ? "✓ Gespeichert!"
              : "💾 Speichern"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
