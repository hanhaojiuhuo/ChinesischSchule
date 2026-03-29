"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import type { Language } from "@/i18n/translations";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "de",
  setLanguage: () => {},
});

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "de";
  try {
    const stored = localStorage.getItem("yixin-language") as Language | null;
    if (stored && ["de", "zh", "en"].includes(stored)) return stored;
  } catch {
    // localStorage not available
  }
  return "de";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("yixin-language", lang);
    } catch {
      // localStorage not available
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
