"use client";

import { Tooltip, HelpIcon } from "@/components/admin/Tooltip";

type ToolbarPos = "bottom" | "top";

export interface AdminToolbarProps {
  currentUser: string | null;
  isDirty: boolean;
  saved: boolean;
  showEnglish: Record<string, boolean>;
  updateShowEnglish: (section: string, show: boolean) => void;
  remainingSeconds: number;
  totalSeconds: number;
  toolbarPosition: ToolbarPos;
  setToolbarPosition: (pos: ToolbarPos) => void;
  handleSave: () => void;
  handleDiscard: () => void;
  logout: () => void;
  /* Undo / Redo */
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export default function AdminToolbar({
  currentUser,
  isDirty,
  saved,
  showEnglish,
  updateShowEnglish,
  remainingSeconds,
  totalSeconds,
  toolbarPosition,
  setToolbarPosition,
  handleSave,
  handleDiscard,
  logout,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: AdminToolbarProps) {
  return (
    <div className={`fixed left-0 right-0 z-[60] bg-[var(--school-dark)]/95 backdrop-blur-sm text-white py-3 px-4 flex items-center justify-between gap-3 flex-wrap shadow-2xl ${
      toolbarPosition === "top"
        ? "top-0 border-b-2 border-amber-400"
        : "bottom-0 border-t-2 border-amber-400"
    }`}>
      <div className="flex items-center gap-3">
        <span className="text-amber-400 text-lg">✏</span>
        <div>
          <span className="text-sm font-bold">Edit Mode</span>
          <span className="text-xs text-gray-400 ml-2">· {currentUser}</span>
        </div>
        {isDirty && (
          <span className="text-xs bg-amber-500 text-amber-900 font-bold px-2 py-0.5 rounded animate-pulse">
            ● Unsaved changes
          </span>
        )}
        {saved && (
          <span className="text-xs bg-green-500 text-white font-bold px-2 py-0.5 rounded">
            ✓ Saved!
          </span>
        )}
        {/* Global English toggle */}
        <Tooltip text="Toggle English translations on the public site / 切换英文显示 / Englisch ein-/ausschalten" position="bottom">
          <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer select-none ml-2">
            <input
              type="checkbox"
              checked={showEnglish._global !== false}
              onChange={(e) => updateShowEnglish("_global", e.target.checked)}
              className="accent-amber-500 w-3.5 h-3.5"
            />
            <span className="text-amber-400 font-semibold">🌐 English</span>
          </label>
        </Tooltip>
        {/* Auto-logout countdown */}
        <Tooltip text="Session auto-expires for security. Click ⏱ to see time remaining / 会话超时倒计时" position="bottom">
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded ${
              remainingSeconds <= 60
                ? "bg-red-600 text-white animate-pulse"
                : remainingSeconds <= 180
                ? "bg-yellow-500 text-black"
                : "bg-white/10 text-gray-300"
            }`}
            title="自动登出倒计时 / Auto-logout countdown / Automatische Abmeldung"
          >
            ⏱ {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:
            {String(remainingSeconds % 60).padStart(2, "0")}
            {" / "}
            {String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:
            {String(totalSeconds % 60).padStart(2, "0")}
          </span>
        </Tooltip>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Undo / Redo */}
        {onUndo && (
          <Tooltip text="Undo last change / 撤销 / Rückgängig" position="bottom">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-sm font-semibold rounded transition-colors"
              aria-label="Undo"
            >
              ↩ Undo
            </button>
          </Tooltip>
        )}
        {onRedo && (
          <Tooltip text="Redo undone change / 重做 / Wiederholen" position="bottom">
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-sm font-semibold rounded transition-colors"
              aria-label="Redo"
            >
              ↪ Redo
            </button>
          </Tooltip>
        )}
        {/* Move toolbar position toggle */}
        <button
          onClick={() => setToolbarPosition(toolbarPosition === "bottom" ? "top" : "bottom")}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
          title={toolbarPosition === "bottom"
            ? "Move toolbar to top / 移到顶部 / Nach oben verschieben"
            : "Move toolbar to bottom / 移到底部 / Nach unten verschieben"}
        >
          {toolbarPosition === "bottom" ? "⬆" : "⬇"}
        </button>
        <Tooltip text="Save all changes to the cloud / 保存所有更改 / Änderungen speichern" position="bottom">
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors"
          >
            💾 Save / Speichern / 保存
          </button>
        </Tooltip>
        <Tooltip text="Discard unsaved changes / 放弃更改 / Änderungen verwerfen" position="bottom">
          <button
            onClick={handleDiscard}
            className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded transition-colors"
          >
            ↺ Discard / Verwerfen
          </button>
        </Tooltip>
        <Tooltip text="Open the admin dashboard / 打开管理面板 / Admin-Bereich öffnen" position="bottom">
          <a
            href="/admin"
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
          >
            ⚙ Admin Panel
          </a>
        </Tooltip>
        <HelpIcon text="Admin Panel: manage accounts, content for each language, pages / 管理面板：管理账户、各语言内容和页面" position="bottom" />
        <button
          onClick={logout}
          className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded transition-colors"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
