"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/i18n/translations";

const LANGS: { code: Language; label: string }[] = [
  { code: "de", label: "DE" },
  { code: "zh", label: "中文" },
  { code: "en", label: "EN" },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="flex items-center gap-1 rounded border border-[var(--school-border)] overflow-hidden text-xs font-semibold"
      aria-label="Sprache wählen / 选择语言 / Select language"
    >
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          aria-pressed={language === code}
          className={`px-2 py-1 transition-colors ${
            language === code
              ? "bg-[var(--school-red)] text-white"
              : "bg-white text-[var(--school-dark)] hover:bg-[var(--school-red-light)] hover:text-[var(--school-red)]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
