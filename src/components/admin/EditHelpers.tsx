"use client";

import React from "react";

/* ─── Inline editable helpers ──────────────────────────────── */
export function EditField({
  value,
  onChange,
  className = "",
  placeholder = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${className} bg-amber-50/30 border-b-2 border-dashed border-amber-400 focus:outline-none focus:border-amber-500 focus:bg-amber-50/60 transition-colors`}
      placeholder={placeholder}
    />
  );
}

export function EditArea({
  value,
  onChange,
  className = "",
  placeholder = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${className} w-full bg-amber-50/30 border-2 border-dashed border-amber-400 focus:outline-none focus:border-amber-500 focus:bg-amber-50/60 transition-colors resize-y min-h-[3em] rounded-sm`}
      placeholder={placeholder}
    />
  );
}

/* Block wrapper — amber outline in edit mode */
export function EditBlock({
  label,
  children,
  onDelete,
  className = "",
}: {
  label?: string;
  children: React.ReactNode;
  onDelete?: () => void;
  className?: string;
}) {
  return (
    <div className={`relative ring-2 ring-amber-400 ring-offset-2 rounded-lg ${className}`}>
      {label && (
        <span className="absolute -top-3 left-3 z-10 text-xs bg-amber-400 text-amber-900 font-bold px-2 py-0.5 rounded select-none">
          ✏ {label}
        </span>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-3 right-3 z-10 text-xs bg-red-500 hover:bg-red-600 text-white font-bold px-2 py-0.5 rounded transition-colors"
          title="Delete this block"
        >
          ✕ Delete
        </button>
      )}
      {children}
    </div>
  );
}
