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
  const POISON_KEYS = new Set(["__proto__", "constructor", "prototype"]);
  for (const rawKey of Object.keys(override)) {
    // Prevent prototype pollution via __proto__, constructor, or prototype keys
    if (POISON_KEYS.has(rawKey)) continue;
    const key = rawKey as keyof SiteContent;
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

/** English visibility flags. Only the `_global` key is used (site-wide toggle).
 *  Per-section keys are legacy and ignored. */
export type EnglishVisibility = Record<string, boolean>;

/** Raw shape stored in Vercel Blob (language overrides + English visibility metadata). */
type RawOverrides = ContentOverrides & { _showEnglish?: EnglishVisibility };

interface ContentContextValue {
  getContent: (lang: Language) => SiteContent;
  saveContent: (lang: Language, content: SiteContent) => Promise<void>;
  saveAllContent: (de: SiteContent, zh: SiteContent, en: SiteContent) => Promise<void>;
  resetContent: (lang: Language) => Promise<void>;
  contentLoading: boolean;
  /** Global English visibility flags. */
  showEnglish: EnglishVisibility;
  /** Toggle English visibility globally and persist immediately. */
  updateShowEnglish: (section: string, show: boolean) => void;
  /** Check if English is visible (uses only the global `_global` flag). */
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
  isEnglishVisible: () => false,
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

const SHOW_ENGLISH_STORAGE_KEY = "yixin-show-english";

/** Read cached English visibility flags from localStorage. */
function loadShowEnglishCache(): EnglishVisibility | null {
  try {
    const raw = localStorage.getItem(SHOW_ENGLISH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as EnglishVisibility;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

/** Persist English visibility flags to localStorage as a fast local cache. */
function saveShowEnglishCache(flags: EnglishVisibility): void {
  try {
    localStorage.setItem(SHOW_ENGLISH_STORAGE_KEY, JSON.stringify(flags));
  } catch { /* ignore */ }
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
  // Initialise showEnglish from localStorage so the admin's last-known
  // preference is available immediately (before the async Blob fetch).
  const [showEnglish, setShowEnglishState] = useState<EnglishVisibility>(
    () => loadShowEnglishCache() ?? {}
  );
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
        // Only keep the _global key; discard legacy per-section keys
        const globalOnly: EnglishVisibility = { _global: _showEnglish._global === true };
        showEnglishRef.current = globalOnly;
        setShowEnglishState(globalOnly);
        saveShowEnglishCache(globalOnly);
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

  const updateShowEnglish = useCallback(async (_: string, show: boolean) => {
    // Always update the _global flag only (per-section toggles are no longer used).
    const next: EnglishVisibility = { _global: show };
    showEnglishRef.current = next;
    setShowEnglishState(next);
    // Cache in localStorage so the preference is available immediately on next load.
    saveShowEnglishCache(next);
    await persistData({ ...overridesRef.current, _showEnglish: next });
  }, []);

  /** Check if English is visible. Only the global `_global` flag is used. */
  const isEnglishVisible = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_section: string): boolean => {
      return showEnglish._global === true;
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
