"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Language, SiteContent } from "@/i18n/translations";
import { defaultTranslations } from "@/i18n/translations";

type ContentOverrides = Partial<Record<Language, SiteContent>>;

interface ContentContextValue {
  getContent: (lang: Language) => SiteContent;
  saveContent: (lang: Language, content: SiteContent) => void;
  resetContent: (lang: Language) => void;
}

const ContentContext = createContext<ContentContextValue>({
  getContent: (lang) => defaultTranslations[lang],
  saveContent: () => {},
  resetContent: () => {},
});

const STORAGE_KEY = "yixin-content-overrides";

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<ContentOverrides>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setOverrides(JSON.parse(stored));
      }
    } catch {
      // localStorage not available or invalid JSON
    }
  }, []);

  const getContent = useCallback(
    (lang: Language): SiteContent => {
      return overrides[lang] ?? defaultTranslations[lang];
    },
    [overrides]
  );

  const saveContent = useCallback(
    (lang: Language, content: SiteContent) => {
      setOverrides((prev) => {
        const next = { ...prev, [lang]: content };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // localStorage not available
        }
        return next;
      });
    },
    []
  );

  const resetContent = useCallback((lang: Language) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[lang];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage not available
      }
      return next;
    });
  }, []);

  return (
    <ContentContext.Provider value={{ getContent, saveContent, resetContent }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  return useContext(ContentContext);
}
