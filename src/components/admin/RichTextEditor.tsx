"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { stripHtml } from "@/lib/sanitize-html";

/* ─── Types ────────────────────────────────────────────────── */

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** Extra classes for the editable area only */
  editorClassName?: string;
  maxWords?: number;
  /** Minimum height of the editable area (CSS value) */
  minHeight?: string;
}

/* ─── Constants ────────────────────────────────────────────── */

const TEXT_SIZES: { label: string; value: string; css: string }[] = [
  { label: "XS",  value: "1", css: "12px" },
  { label: "S",   value: "2", css: "14px" },
  { label: "M",   value: "3", css: "16px" },
  { label: "L",   value: "4", css: "18px" },
  { label: "XL",  value: "5", css: "24px" },
];

const PRESET_COLORS = [
  "#000000", "#e53e3e", "#dd6b20", "#d69e2e", "#38a169",
  "#3182ce", "#805ad5", "#d53f8c", "#718096", "#ffffff",
];

/* ─── Toolbar button ───────────────────────────────────────── */

function TBtn({
  onClick,
  title,
  active,
  children,
  className = "",
}: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // keep selection in contentEditable
        onClick(e);
      }}
      title={title}
      className={`px-1.5 py-1 text-xs rounded transition-colors select-none ${
        active
          ? "bg-school-red text-white"
          : "text-gray-600 hover:bg-gray-200"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/* ─── Component ────────────────────────────────────────────── */

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className = "",
  editorClassName = "",
  maxWords,
  minHeight = "80px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#000000");
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const savedSelection = useRef<Range | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Sync external value → DOM only when the change didn't originate here
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const el = editorRef.current;
    if (el && el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  // Close color picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    }
    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showColorPicker]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalChange.current = true;
    onChange(el.innerHTML);
  }, [onChange]);

  /* ── execCommand helpers ─────────────────────────────────── */

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    handleInput();
  }, [handleInput]);

  const toggleBold = useCallback(() => exec("bold"), [exec]);
  const toggleItalic = useCallback(() => exec("italic"), [exec]);

  const applySize = useCallback(
    (size: string) => exec("fontSize", size),
    [exec],
  );

  const applyColor = useCallback(
    (color: string) => {
      exec("foreColor", color);
      setShowColorPicker(false);
    },
    [exec],
  );

  /* ── Link handling ───────────────────────────────────────── */

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelection.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedSelection.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelection.current);
    }
  }, []);

  const openLinkDialog = useCallback(() => {
    saveSelection();
    setLinkUrl("https://");
    setShowLinkDialog(true);
  }, [saveSelection]);

  const insertLink = useCallback(() => {
    setShowLinkDialog(false);
    if (!linkUrl.trim()) return;
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand("createLink", false, linkUrl.trim());
    // Ensure links open in new tab
    const el = editorRef.current;
    if (el) {
      el.querySelectorAll("a").forEach((a) => {
        if (!a.getAttribute("target")) {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        }
      });
    }
    handleInput();
  }, [linkUrl, restoreSelection, handleInput]);

  const removeLink = useCallback(() => {
    exec("unlink");
    setShowLinkDialog(false);
  }, [exec]);

  /* ── Word count ──────────────────────────────────────────── */

  function countWordsInHtml(html: string): number {
    const text = stripHtml(html);
    if (!text.trim()) return 0;
    const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}]/gu);
    const stripped = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}]/gu, " ");
    const latin = stripped.trim().split(/\s+/).filter(Boolean);
    return (cjk?.length ?? 0) + latin.length;
  }

  const wordCount = maxWords != null ? countWordsInHtml(value) : 0;
  const overLimit = maxWords != null && wordCount > maxWords;

  /* ── Handle paste — strip external formatting ────────────── */

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
      handleInput();
    },
    [handleInput],
  );

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className={`border rounded overflow-hidden ${overLimit ? "border-red-400" : "border-gray-300 focus-within:border-school-red"} ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200 text-gray-600">
        {/* Bold / Italic */}
        <TBtn onClick={toggleBold} title="Bold / Fett / 粗体">
          <strong>B</strong>
        </TBtn>
        <TBtn onClick={toggleItalic} title="Italic / Kursiv / 斜体">
          <em>I</em>
        </TBtn>

        <span className="w-px h-4 bg-gray-300 mx-1" />

        {/* Text sizes */}
        {TEXT_SIZES.map((s) => (
          <TBtn
            key={s.value}
            onClick={() => applySize(s.value)}
            title={`Size ${s.label} (${s.css})`}
          >
            <span style={{ fontSize: s.value === "1" ? "9px" : s.value === "5" ? "13px" : undefined }}>
              {s.label}
            </span>
          </TBtn>
        ))}

        <span className="w-px h-4 bg-gray-300 mx-1" />

        {/* Color picker */}
        <div className="relative" ref={colorPickerRef}>
          <TBtn
            onClick={() => setShowColorPicker((v) => !v)}
            title="Text Color / Textfarbe / 文字颜色"
          >
            <span className="flex items-center gap-0.5">
              <span>A</span>
              <span
                className="inline-block w-3 h-1.5 rounded-sm border border-gray-300"
                style={{ backgroundColor: customColor }}
              />
            </span>
          </TBtn>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50 w-[180px]">
              <div className="grid grid-cols-5 gap-1 mb-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setCustomColor(c);
                      applyColor(c);
                    }}
                    className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-6 h-6 p-0 border-0 cursor-pointer"
                  title="Custom color"
                />
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyColor(customColor);
                  }}
                  className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="w-px h-4 bg-gray-300 mx-1" />

        {/* Link */}
        <TBtn onClick={openLinkDialog} title="Add Link / Link hinzufügen / 添加链接">
          🔗
        </TBtn>
      </div>

      {/* Link dialog */}
      {showLinkDialog && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-200 text-sm">
          <span className="text-xs text-gray-500">URL:</span>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertLink(); } }}
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
            placeholder="https://example.com"
            autoFocus
          />
          <button
            type="button"
            onClick={insertLink}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={removeLink}
            className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300 transition-colors"
            title="Remove link"
          >
            Unlink
          </button>
          <button
            type="button"
            onClick={() => setShowLinkDialog(false)}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        className={`px-3 py-2 text-sm focus:outline-none min-h-[${minHeight}] overflow-auto ${editorClassName}`}
        style={{ minHeight }}
        data-placeholder={placeholder}
      />

      {/* Word count */}
      {maxWords != null && (
        <div className={`px-3 py-1 text-xs text-right border-t border-gray-100 ${overLimit ? "text-red-600 font-semibold bg-red-50" : "text-gray-400"}`}>
          {wordCount} / {maxWords} words
        </div>
      )}

      {/* Placeholder styling */}
      <style>{`
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
