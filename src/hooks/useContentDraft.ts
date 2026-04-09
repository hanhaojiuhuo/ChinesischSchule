"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SiteContent, CourseItem, NewsItem, NewsTextBlock, NewsBodyBlock } from "@/i18n/translations";
import { defaultTranslations } from "@/i18n/translations";
import { useContent } from "@/contexts/ContentContext";
import { useContentHistory } from "@/hooks/useContentHistory";

function blocksToBody(blocks: NewsBodyBlock[]): string {
  return blocks
    .filter((b): b is NewsTextBlock => b.type === "text")
    .map((b) => b.content)
    .join("\n\n");
}

export function useContentDraft() {
  const { getContent, saveAllContent, showEnglish, updateShowEnglish, isEnglishVisible } =
    useContent();

  const [draftDe, setDraftDe] = useState<SiteContent>(() => defaultTranslations["de"]);
  const [draftZh, setDraftZh] = useState<SiteContent>(() => defaultTranslations["zh"]);
  const [draftEn, setDraftEn] = useState<SiteContent>(() => defaultTranslations["en"]);
  const [isDirty, setIsDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  // Content history for undo/redo
  const history = useContentHistory({
    de: defaultTranslations["de"],
    zh: defaultTranslations["zh"],
    en: defaultTranslations["en"],
  });

  // News block editor state
  const [newsUploadingIdx, setNewsUploadingIdx] = useState<{
    lang: "de" | "zh";
    newsIdx: number;
    blockIdx: number;
  } | null>(null);
  const [newsUploadError, setNewsUploadError] = useState("");
  const newsFileInputRef = useRef<HTMLInputElement>(null);

  // Sync drafts when ContentContext loads saved data from localStorage
  useEffect(() => {
    if (!isDirty) {
      setDraftDe(getContent("de"));
      setDraftZh(getContent("zh"));
      setDraftEn(getContent("en"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getContent]);

  /* ── Generic section updaters ────────────────────────────── */
  const updDe = useCallback(
    <K extends keyof SiteContent>(section: K, patch: Partial<SiteContent[K]> & object) => {
      setDraftDe((d) => ({ ...d, [section]: { ...(d[section] as object), ...(patch as object) } }));
      setIsDirty(true);
    },
    []
  );

  const updZh = useCallback(
    <K extends keyof SiteContent>(section: K, patch: Partial<SiteContent[K]> & object) => {
      setDraftZh((d) => ({ ...d, [section]: { ...(d[section] as object), ...(patch as object) } }));
      setIsDirty(true);
    },
    []
  );

  /* ── Course management ───────────────────────────────────── */
  const addCourse = useCallback(() => {
    const blank: CourseItem = { level: "", levelLabel: "", ages: "", time: "", desc: "" };
    setDraftDe((d) => ({ ...d, courses: { ...d.courses, items: [...d.courses.items, blank] } }));
    setDraftZh((d) => ({ ...d, courses: { ...d.courses, items: [...d.courses.items, blank] } }));
    setIsDirty(true);
  }, []);

  const removeCourse = useCallback((idx: number) => {
    setDraftDe((d) => ({
      ...d,
      courses: { ...d.courses, items: d.courses.items.filter((_, i) => i !== idx) },
    }));
    setDraftZh((d) => ({
      ...d,
      courses: { ...d.courses, items: d.courses.items.filter((_, i) => i !== idx) },
    }));
    setIsDirty(true);
  }, []);

  const updDeCourse = useCallback((idx: number, key: keyof CourseItem, val: string) => {
    setDraftDe((d) => ({
      ...d,
      courses: {
        ...d.courses,
        items: d.courses.items.map((c, i) => (i === idx ? { ...c, [key]: val } : c)),
      },
    }));
    setIsDirty(true);
  }, []);

  const updZhCourse = useCallback((idx: number, key: keyof CourseItem, val: string) => {
    setDraftZh((d) => ({
      ...d,
      courses: {
        ...d.courses,
        items: d.courses.items.map((c, i) => (i === idx ? { ...c, [key]: val } : c)),
      },
    }));
    setIsDirty(true);
  }, []);

  /* ── News management ─────────────────────────────────────── */
  const addNews = useCallback(() => {
    const blank: NewsItem = {
      date: "",
      title: "",
      body: "",
      bodyBlocks: [{ type: "text", content: "" }],
    };
    setDraftDe((d) => ({ ...d, news: { ...d.news, items: [blank, ...d.news.items] } }));
    setDraftZh((d) => ({ ...d, news: { ...d.news, items: [blank, ...d.news.items] } }));
    setIsDirty(true);
  }, []);

  const removeNews = useCallback((idx: number) => {
    setDraftDe((d) => ({
      ...d,
      news: { ...d.news, items: d.news.items.filter((_, i) => i !== idx) },
    }));
    setDraftZh((d) => ({
      ...d,
      news: { ...d.news, items: d.news.items.filter((_, i) => i !== idx) },
    }));
    setIsDirty(true);
  }, []);

  const updDeNews = useCallback((idx: number, key: keyof NewsItem, val: string) => {
    setDraftDe((d) => ({
      ...d,
      news: {
        ...d.news,
        items: d.news.items.map((n, i) => (i === idx ? { ...n, [key]: val } : n)),
      },
    }));
    setIsDirty(true);
  }, []);

  const updZhNews = useCallback((idx: number, key: keyof NewsItem, val: string) => {
    setDraftZh((d) => ({
      ...d,
      news: {
        ...d.news,
        items: d.news.items.map((n, i) => (i === idx ? { ...n, [key]: val } : n)),
      },
    }));
    setIsDirty(true);
  }, []);

  const updDeNewsBlocks = useCallback((idx: number, blocks: NewsBodyBlock[]) => {
    setDraftDe((d) => ({
      ...d,
      news: {
        ...d.news,
        items: d.news.items.map((n, i) =>
          i === idx ? { ...n, bodyBlocks: blocks, body: blocksToBody(blocks) } : n
        ),
      },
    }));
    setIsDirty(true);
  }, []);

  const updZhNewsBlocks = useCallback((idx: number, blocks: NewsBodyBlock[]) => {
    setDraftZh((d) => ({
      ...d,
      news: {
        ...d.news,
        items: d.news.items.map((n, i) =>
          i === idx ? { ...n, bodyBlocks: blocks, body: blocksToBody(blocks) } : n
        ),
      },
    }));
    setIsDirty(true);
  }, []);

  const handleNewsImageUpload = useCallback(
    async (file: File, lang: "de" | "zh", newsIdx: number, blockIdx: number) => {
      setNewsUploadingIdx({ lang, newsIdx, blockIdx });
      setNewsUploadError("");
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) {
          const setter = lang === "de" ? setDraftDe : setDraftZh;
          setter((d) => ({
            ...d,
            news: {
              ...d.news,
              items: d.news.items.map((item, i) => {
                if (i !== newsIdx) return item;
                const blocks = (item.bodyBlocks ?? []).map((b, bi) =>
                  bi === blockIdx && b.type === "image" ? { ...b, url: data.url } : b
                );
                return { ...item, bodyBlocks: blocks };
              }),
            },
          }));
          setIsDirty(true);
        } else {
          setNewsUploadError(data.error ?? "Upload failed");
        }
      } catch {
        setNewsUploadError("Upload failed / 上传失败");
      } finally {
        setNewsUploadingIdx(null);
      }
    },
    []
  );

  /* ── Contact line helpers ────────────────────────────────── */
  const updDeAddrLine = useCallback((idx: number, val: string) => {
    setDraftDe((d) => ({
      ...d,
      contact: {
        ...d.contact,
        addressLines: d.contact.addressLines.map((l, i) => (i === idx ? val : l)),
      },
    }));
    setIsDirty(true);
  }, []);

  const updZhAddrLine = useCallback((idx: number, val: string) => {
    setDraftZh((d) => ({
      ...d,
      contact: {
        ...d.contact,
        addressLines: d.contact.addressLines.map((l, i) => (i === idx ? val : l)),
      },
    }));
    setIsDirty(true);
  }, []);

  /* ── Save / Discard / Undo / Redo ──────────────────────── */
  const handleSave = useCallback(async () => {
    history.pushSnapshot({ de: draftDe, zh: draftZh, en: draftEn });
    await saveAllContent(draftDe, draftZh, draftEn);
    setIsDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [draftDe, draftZh, draftEn, history, saveAllContent]);

  const handleDiscard = useCallback(() => {
    if (
      confirm(
        "Discard all unsaved changes?\nAlle Änderungen verwerfen?\n放弃所有未保存的更改？"
      )
    ) {
      history.pushSnapshot({ de: draftDe, zh: draftZh, en: draftEn });
      setDraftDe(getContent("de"));
      setDraftZh(getContent("zh"));
      setDraftEn(getContent("en"));
      setIsDirty(false);
    }
  }, [draftDe, draftZh, draftEn, getContent, history]);

  const handleUndo = useCallback(() => {
    const snapshot = history.undo();
    if (snapshot) {
      setDraftDe(snapshot.de);
      setDraftZh(snapshot.zh);
      setDraftEn(snapshot.en);
      setIsDirty(true);
    }
  }, [history]);

  const handleRedo = useCallback(() => {
    const snapshot = history.redo();
    if (snapshot) {
      setDraftDe(snapshot.de);
      setDraftZh(snapshot.zh);
      setDraftEn(snapshot.en);
      setIsDirty(true);
    }
  }, [history]);

  /** Reset drafts to saved content (e.g. when admin logs out) */
  const resetToSaved = useCallback(() => {
    setDraftDe(getContent("de"));
    setDraftZh(getContent("zh"));
    setDraftEn(getContent("en"));
    setIsDirty(false);
  }, [getContent]);

  return {
    de: draftDe,
    zh: draftZh,
    en: draftEn,
    setDraftDe,
    setDraftZh,
    isDirty,
    setIsDirty,
    saved,
    showEnglish,
    updateShowEnglish,
    isEnglishVisible,

    updDe,
    updZh,

    addCourse,
    removeCourse,
    updDeCourse,
    updZhCourse,

    addNews,
    removeNews,
    updDeNews,
    updZhNews,
    updDeNewsBlocks,
    updZhNewsBlocks,
    handleNewsImageUpload,
    newsUploadingIdx,
    setNewsUploadingIdx,
    newsUploadError,
    setNewsUploadError,
    newsFileInputRef,

    updDeAddrLine,
    updZhAddrLine,

    handleSave,
    handleDiscard,
    handleUndo,
    handleRedo,
    resetToSaved,

    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
