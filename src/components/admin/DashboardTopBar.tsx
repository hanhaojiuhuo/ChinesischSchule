"use client";

import type { Language } from "@/i18n/translations";
import { formatTimer } from "@/lib/text-utils";

const langLabels: Record<Language, string> = { de: "Deutsch", zh: "中文", en: "English" };

export interface DashboardTopBarProps {
  currentUser: string | null;
  remainingSeconds: number;
  totalSeconds: number;
  editLang: Language;
  setEditLang: (lang: Language) => void;
  setLanguage: (lang: Language) => void;
  handleSave: () => void;
  handleReset: () => void;
  saving: boolean;
  saved: boolean;
  logout: () => void;
}

export default function DashboardTopBar({
  currentUser,
  remainingSeconds,
  totalSeconds,
  editLang,
  setEditLang,
  setLanguage,
  handleSave,
  handleReset,
  saving,
  saved,
  logout,
}: DashboardTopBarProps) {
  return (
    <div className="sticky top-0 z-40 bg-school-dark text-white px-4 py-3 flex items-center justify-between gap-4 flex-wrap shadow-md">
      <div className="flex items-center gap-3">
        <span className="font-cn font-bold text-lg">管理面板</span>
        <span className="text-gray-400 text-sm hidden sm:inline">
          Admin Panel · {currentUser}
        </span>
        {/* Auto-logout countdown + total limit */}
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
          ⏱ {formatTimer(remainingSeconds)}
          {" / "}
          {formatTimer(totalSeconds)}
        </span>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 text-xs font-semibold">
          {(["de", "zh", "en"] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setEditLang(l)}
              className={`px-2 py-1 rounded transition-colors ${
                editLang === l
                  ? "bg-school-red text-white"
                  : "bg-white/10 hover:bg-white/20 text-gray-200"
              }`}
            >
              {langLabels[l]}
            </button>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded transition-colors"
        >
          {saving ? "⏳ Speichern…" : saved ? "✓ Gespeichert!" : "Speichern / Save / 保存"}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded transition-colors"
        >
          Zurücksetzen / Reset
        </button>
        <button
          onClick={() => { setLanguage(editLang); window.location.href = "/"; }}
          className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
        >
          ← Zur Website
        </button>
        <button
          onClick={logout}
          className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded transition-colors"
        >
          Abmelden / Logout
        </button>
      </div>
    </div>
  );
}
