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

/**
 * Shallow-merge each top-level section of the override with the default so
 * that sections added after the override was saved (e.g. impressum, privacy)
 * still fall back to defaults instead of being undefined.
 */
function mergeWithDefaults(override: SiteContent, defaults: SiteContent): SiteContent {
  const merged = { ...defaults };
  for (const key of Object.keys(override) as (keyof SiteContent)[]) {
    const overrideVal = override[key];
    const defaultVal = defaults[key];
    if (
      overrideVal != null &&
      typeof overrideVal === "object" &&
      !Array.isArray(overrideVal) &&
      defaultVal != null &&
      typeof defaultVal === "object" &&
      !Array.isArray(defaultVal)
    ) {
      // Merge object sections (nav, hero, about, impressum, …)
      (merged as Record<string, unknown>)[key] = { ...defaultVal, ...overrideVal };
    } else {
      // Primitives and arrays are replaced outright
      (merged as Record<string, unknown>)[key] = overrideVal;
    }
  }
  return merged;
}

/** Per-section English visibility flags. Absent key = true (show English by default).
 *  The special `_global` key controls site-wide English visibility. */
export type EnglishVisibility = Record<string, boolean>;

/** Raw shape stored in Vercel Blob (language overrides + English visibility metadata). */
type RawOverrides = ContentOverrides & { _showEnglish?: EnglishVisibility };

interface ContentContextValue {
  getContent: (lang: Language) => SiteContent;
  saveContent: (lang: Language, content: SiteContent) => Promise<void>;
  saveAllContent: (de: SiteContent, zh: SiteContent, en: SiteContent) => Promise<void>;
  resetContent: (lang: Language) => Promise<void>;
  contentLoading: boolean;
  /** Per-section English visibility. Missing key means English IS shown. */
  showEnglish: EnglishVisibility;
  /** Toggle English visibility for a section and persist immediately. */
  updateShowEnglish: (section: string, show: boolean) => void;
  /** Check if English is visible for a given section (respects global + per-section flags). */
  isEnglishVisible: (section: string) => boolean;
}

const ContentContext = createContext<ContentContextValue>({
  getContent: (lang) => defaultTranslations[lang],
  saveContent: async () => {},
  saveAllContent: async () => {},
  resetContent: async () => {},
  contentLoading: true,
  showEnglish: {},
  updateShowEnglish: () => {},
  isEnglishVisible: () => true,
});

async function fetchRawOverrides(): Promise<RawOverrides> {
  try {
    const res = await fetch("/api/content");
    if (res.ok) {
      return (await res.json()) as RawOverrides;
    }
  } catch {
    // ignore
  }
  return {};
}

async function persistData(data: RawOverrides): Promise<boolean> {
  try {
    const res = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      console.warn("[ContentContext] persistData failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[ContentContext] persistData error:", err);
    return false;
  }
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<ContentOverrides>({});
  const [showEnglish, setShowEnglishState] = useState<EnglishVisibility>({});
  const [contentLoading, setContentLoading] = useState(true);

  // Mutable refs keep the latest state in sync so concurrent saves
  // always build on top of the most recent in-memory state.
  const overridesRef = useRef<ContentOverrides>(overrides);
  const showEnglishRef = useRef<EnglishVisibility>(showEnglish);

  useEffect(() => {
    fetchRawOverrides().then((raw) => {
      const { _showEnglish, ...langOverrides } = raw;
      overridesRef.current = langOverrides;
      setOverrides(langOverrides);
      if (_showEnglish) {
        showEnglishRef.current = _showEnglish;
        setShowEnglishState(_showEnglish);
      }
      setContentLoading(false);
    });
  }, []);

  const getContent = useCallback(
    (lang: Language): SiteContent => {
      const override = overrides[lang];
      if (!override) return defaultTranslations[lang];
      return mergeWithDefaults(override, defaultTranslations[lang]);
    },
    [overrides]
  );

  const saveContent = useCallback(async (lang: Language, content: SiteContent) => {
    const next = { ...overridesRef.current, [lang]: content };
    overridesRef.current = next;
    setOverrides(next);
    await persistData({ ...next, _showEnglish: showEnglishRef.current });
  }, []);

  /** Save all three languages in a single API call to avoid race conditions. */
  const saveAllContent = useCallback(async (de: SiteContent, zh: SiteContent, en: SiteContent) => {
    const next = { ...overridesRef.current, de, zh, en };
    overridesRef.current = next;
    setOverrides(next);
    await persistData({ ...next, _showEnglish: showEnglishRef.current });
  }, []);

  const resetContent = useCallback(async (lang: Language) => {
    const next = { ...overridesRef.current };
    delete next[lang];
    overridesRef.current = next;
    setOverrides(next);
    await persistData({ ...next, _showEnglish: showEnglishRef.current });
  }, []);

  const updateShowEnglish = useCallback(async (section: string, show: boolean) => {
    const next = { ...showEnglishRef.current, [section]: show };
    showEnglishRef.current = next;
    setShowEnglishState(next);
    await persistData({ ...overridesRef.current, _showEnglish: next });
  }, []);

  /** Check if English is visible for a given section, respecting global + per-section flags. */
  const isEnglishVisible = useCallback(
    (section: string): boolean => {
      // If global English is disabled, all sections are hidden
      if (showEnglish._global === false) return false;
      // Otherwise check per-section flag (default: visible)
      return showEnglish[section] !== false;
    },
    [showEnglish]
  );

  return (
    <ContentContext.Provider
      value={{ getContent, saveContent, saveAllContent, resetContent, contentLoading, showEnglish, updateShowEnglish, isEnglishVisible }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  return useContext(ContentContext);
}
