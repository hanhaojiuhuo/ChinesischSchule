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
      className="flex items-center gap-1 rounded border border-school-border overflow-hidden text-xs font-semibold"
      aria-label="Sprache wählen / 选择语言 / Select language"
    >
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          aria-pressed={language === code}
          className={`px-2 py-1 transition-colors ${
            language === code
              ? "bg-school-red text-white"
              : "bg-white text-school-dark hover:bg-school-red-light hover:text-school-red"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
