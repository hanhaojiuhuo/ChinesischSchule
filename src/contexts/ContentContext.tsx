"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { Language, SiteContent } from "@/i18n/translations";
import { defaultTranslations } from "@/i18n/translations";

type ContentOverrides = Partial<Record<Language, SiteContent>>;

interface ContentContextValue {
  getContent: (lang: Language) => SiteContent;
  saveContent: (lang: Language, content: SiteContent) => Promise<void>;
  resetContent: (lang: Language) => Promise<void>;
  contentLoading: boolean;
}

const ContentContext = createContext<ContentContextValue>({
  getContent: (lang) => defaultTranslations[lang],
  saveContent: async () => {},
  resetContent: async () => {},
  contentLoading: true,
});

async function fetchOverrides(): Promise<ContentOverrides> {
  try {
    const res = await fetch("/api/content");
    if (res.ok) {
      return (await res.json()) as ContentOverrides;
    }
  } catch {
    // ignore
  }
  return {};
}

async function persistOverrides(overrides: ContentOverrides): Promise<boolean> {
  try {
    const res = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(overrides),
    });
    if (!res.ok) {
      console.warn("[ContentContext] persistOverrides failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[ContentContext] persistOverrides error:", err);
    return false;
  }
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<ContentOverrides>({});
  const [contentLoading, setContentLoading] = useState(true);
  // Mutable ref keeps the latest overrides in sync so concurrent saves
  // always build on top of the most recent in-memory state.
  const overridesRef = useRef<ContentOverrides>(overrides);

  useEffect(() => {
    fetchOverrides().then((data) => {
      overridesRef.current = data;
      setOverrides(data);
      setContentLoading(false);
    });
  }, []);

  const getContent = useCallback(
    (lang: Language): SiteContent => {
      return overrides[lang] ?? defaultTranslations[lang];
    },
    [overrides]
  );

  const saveContent = useCallback(async (lang: Language, content: SiteContent) => {
    const next = { ...overridesRef.current, [lang]: content };
    overridesRef.current = next;
    setOverrides(next);
    await persistOverrides(next);
  }, []);

  const resetContent = useCallback(async (lang: Language) => {
    const next = { ...overridesRef.current };
    delete next[lang];
    overridesRef.current = next;
    setOverrides(next);
    await persistOverrides(next);
  }, []);

  return (
    <ContentContext.Provider
      value={{ getContent, saveContent, resetContent, contentLoading }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  return useContext(ContentContext);
}
