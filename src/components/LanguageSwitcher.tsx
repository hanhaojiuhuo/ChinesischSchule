"use client";

import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

interface LanguageSwitcherProps {
  currentLocale: string;
}

const localeLabels: Record<string, string> = {
  en: "EN",
  de: "DE",
  zh: "中文",
};

const localeFlags: Record<string, string> = {
  en: "🇬🇧",
  de: "🇩🇪",
  zh: "🇨🇳",
};

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/");
    router.push(newPath);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1">
      {routing.locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
            currentLocale === locale
              ? "bg-white text-red-700"
              : "text-white hover:bg-red-600"
          }`}
          title={`Switch to ${locale.toUpperCase()}`}
        >
          <span className="mr-1">{localeFlags[locale]}</span>
          {localeLabels[locale]}
        </button>
      ))}
    </div>
  );
}
