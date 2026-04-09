"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContent } from "@/contexts/ContentContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useContentHistory } from "@/hooks/useContentHistory";
import SessionTimeoutWarning from "@/components/SessionTimeoutWarning";
import AdminToolbar from "@/components/admin/AdminToolbar";
import HeroSection from "@/components/sections/HeroSection";
import CoursesSection from "@/components/sections/CoursesSection";
import NewsSection from "@/components/sections/NewsSection";
import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";
import type { SiteContent, CourseItem, NewsItem, NewsTextBlock, NewsBodyBlock } from "@/i18n/translations";
import { defaultTranslations } from "@/i18n/translations";

/* ─── Page ─────────────────────────────────────────────────── */
export default function Home() {
  const { getContent, saveAllContent, showEnglish, updateShowEnglish, isEnglishVisible } = useContent();
  const { isAdmin, currentUser, logout } = useAuth();

  // Auto-logout – shares the same persisted deadline as the admin panel
  const { remainingSeconds, totalSeconds, showWarning, extendSession } =
    useAutoLogout(isAdmin, logout);

  const [draftDe, setDraftDe] = useState<SiteContent>(() => defaultTranslations["de"]);
  const [draftZh, setDraftZh] = useState<SiteContent>(() => defaultTranslations["zh"]);
  const [draftEn, setDraftEn] = useState<SiteContent>(() => defaultTranslations["en"]);
  const [isDirty, setIsDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [courseOffset, setCourseOffset] = useState(0);
  const [newsPage, setNewsPage] = useState(0);
  const NEWS_PER_PAGE = 4;

  // Content history for undo/redo
  const history = useContentHistory({
    de: defaultTranslations["de"],
    zh: defaultTranslations["zh"],
    en: defaultTranslations["en"],
  });

  // News block editor state
  const [newsUploadingIdx, setNewsUploadingIdx] = useState<{ lang: "de" | "zh"; newsIdx: number; blockIdx: number } | null>(null);
  const [newsUploadError, setNewsUploadError] = useState("");
  const newsFileInputRef = useRef<HTMLInputElement>(null);

  // Admin toolbar position — stored in sessionStorage so it resets on next login
  type ToolbarPos = "bottom" | "top";
  const TOOLBAR_POS_KEY = "yixin-toolbar-position";
  const [toolbarPosition, setToolbarPositionState] = useState<ToolbarPos>("bottom");

  // Read toolbar position from sessionStorage on mount (only when admin)
  useEffect(() => {
    if (!isAdmin) return;
    try {
      const stored = sessionStorage.getItem(TOOLBAR_POS_KEY) as ToolbarPos | null;
      if (stored === "top" || stored === "bottom") {
        setToolbarPositionState(stored);
      }
    } catch { /* ignore */ }
  }, [isAdmin]);

  const setToolbarPosition = useCallback((pos: ToolbarPos) => {
    setToolbarPositionState(pos);
    try { sessionStorage.setItem(TOOLBAR_POS_KEY, pos); } catch { /* ignore */ }
    // Notify other components (e.g. Footer) about the position change
    window.dispatchEvent(new CustomEvent("toolbar-position-change", { detail: pos }));
  }, []);

  // Sync drafts when ContentContext loads saved data from localStorage
  useEffect(() => {
    if (!isDirty) {
      setDraftDe(getContent("de"));
      setDraftZh(getContent("zh"));
      setDraftEn(getContent("en"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getContent]);

  // When admin logs out, reset drafts to saved content
  useEffect(() => {
    if (!isAdmin) {
      setDraftDe(getContent("de"));
      setDraftZh(getContent("zh"));
      setDraftEn(getContent("en"));
      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Reset news page when content changes
  useEffect(() => {
    setNewsPage(0);
  }, [getContent]);

  const de = draftDe;
  const zh = draftZh;
  const en = draftEn;

  /* ── Draft updaters ──────────────────────────────────────── */
  function updDe<K extends keyof SiteContent>(
    section: K,
    patch: Partial<SiteContent[K]> & object
  ) {
    setDraftDe((d) => ({ ...d, [section]: { ...(d[section] as object), ...(patch as object) } }));
    setIsDirty(true);
  }

  function updZh<K extends keyof SiteContent>(
    section: K,
    patch: Partial<SiteContent[K]> & object
  ) {
    setDraftZh((d) => ({ ...d, [section]: { ...(d[section] as object), ...(patch as object) } }));
    setIsDirty(true);
  }

  /* ── Course management ───────────────────────────────────── */
  function addCourse() {
    const blank: CourseItem = { level: "", levelLabel: "", ages: "", time: "", desc: "" };
    setDraftDe((d) => ({ ...d, courses: { ...d.courses, items: [...d.courses.items, blank] } }));
    setDraftZh((d) => ({ ...d, courses: { ...d.courses, items: [...d.courses.items, blank] } }));
    setIsDirty(true);
  }

  function removeCourse(idx: number) {
    setDraftDe((d) => ({
      ...d,
      courses: { ...d.courses, items: d.courses.items.filter((_, i) => i !== idx) },
    }));
    setDraftZh((d) => ({
      ...d,
      courses: { ...d.courses, items: d.courses.items.filter((_, i) => i !== idx) },
    }));
    setIsDirty(true);
  }

  function updDeCourse(idx: number, key: keyof CourseItem, val: string) {
    setDraftDe((d) => ({
      ...d,
      courses: {
        ...d.courses,
        items: d.courses.items.map((c, i) => (i === idx ? { ...c, [key]: val } : c)),
      },
    }));
    setIsDirty(true);
  }

  function updZhCourse(idx: number, key: keyof CourseItem, val: string) {
    setDraftZh((d) => ({
      ...d,
      courses: {
        ...d.courses,
        items: d.courses.items.map((c, i) => (i === idx ? { ...c, [key]: val } : c)),
      },
    }));
    setIsDirty(true);
  }

  /* ── News management ─────────────────────────────────────── */
  function addNews() {
    const blank: NewsItem = { date: "", title: "", body: "", bodyBlocks: [{ type: "text", content: "" }] };
    setDraftDe((d) => ({ ...d, news: { ...d.news, items: [blank, ...d.news.items] } }));
    setDraftZh((d) => ({ ...d, news: { ...d.news, items: [blank, ...d.news.items] } }));
    setIsDirty(true);
  }

  function removeNews(idx: number) {
    setDraftDe((d) => ({
      ...d,
      news: { ...d.news, items: d.news.items.filter((_, i) => i !== idx) },
    }));
    setDraftZh((d) => ({
      ...d,
      news: { ...d.news, items: d.news.items.filter((_, i) => i !== idx) },
    }));
    setIsDirty(true);
  }

  function updDeNews(idx: number, key: keyof NewsItem, val: string) {
    setDraftDe((d) => ({
      ...d,
      news: {
        ...d.news,
        items: d.news.items.map((n, i) => (i === idx ? { ...n, [key]: val } : n)),
      },
    }));
    setIsDirty(true);
  }

  function updZhNews(idx: number, key: keyof NewsItem, val: string) {
    setDraftZh((d) => ({
      ...d,
      news: {
        ...d.news,
        items: d.news.items.map((n, i) => (i === idx ? { ...n, [key]: val } : n)),
      },
    }));
    setIsDirty(true);
  }

  function blocksToBody(blocks: NewsBodyBlock[]): string {
    return blocks.filter((b): b is NewsTextBlock => b.type === "text").map((b) => b.content).join("\n\n");
  }

  function updDeNewsBlocks(idx: number, blocks: NewsBodyBlock[]) {
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
  }

  function updZhNewsBlocks(idx: number, blocks: NewsBodyBlock[]) {
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
  }

  async function handleNewsImageUpload(file: File, lang: "de" | "zh", newsIdx: number, blockIdx: number) {
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
  }

  /* ── Save / Discard ──────────────────────────────────────── */
  async function handleSave() {
    // Push current state into history before saving
    history.pushSnapshot({ de: draftDe, zh: draftZh, en: draftEn });
    await saveAllContent(draftDe, draftZh, draftEn);
    setIsDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleDiscard() {
    if (confirm("Discard all unsaved changes?\nAlle Änderungen verwerfen?\n放弃所有未保存的更改？")) {
      // Push current state into history so discard is undoable
      history.pushSnapshot({ de: draftDe, zh: draftZh, en: draftEn });
      setDraftDe(getContent("de"));
      setDraftZh(getContent("zh"));
      setDraftEn(getContent("en"));
      setIsDirty(false);
    }
  }

  function handleUndo() {
    const snapshot = history.undo();
    if (snapshot) {
      setDraftDe(snapshot.de);
      setDraftZh(snapshot.zh);
      setDraftEn(snapshot.en);
      setIsDirty(true);
    }
  }

  function handleRedo() {
    const snapshot = history.redo();
    if (snapshot) {
      setDraftDe(snapshot.de);
      setDraftZh(snapshot.zh);
      setDraftEn(snapshot.en);
      setIsDirty(true);
    }
  }

  /* ── Contact line helpers ────────────────────────────────── */
  function updDeAddrLine(idx: number, val: string) {
    setDraftDe((d) => ({
      ...d,
      contact: { ...d.contact, addressLines: d.contact.addressLines.map((l, i) => (i === idx ? val : l)) },
    }));
    setIsDirty(true);
  }

  function updZhAddrLine(idx: number, val: string) {
    setDraftZh((d) => ({
      ...d,
      contact: { ...d.contact, addressLines: d.contact.addressLines.map((l, i) => (i === idx ? val : l)) },
    }));
    setIsDirty(true);
  }

  const showEn = (section: string) => isEnglishVisible(section);

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <>
      {/* Session timeout warning popup – visible in edit mode */}
      {showWarning && (
        <SessionTimeoutWarning
          remainingSeconds={remainingSeconds}
          onExtend={extendSession}
          onLogout={logout}
        />
      )}

      <Navbar />


      <main className={`flex-1${isAdmin && toolbarPosition === "bottom" ? " pb-28" : ""}${isAdmin && toolbarPosition === "top" ? " pt-20" : ""}`}>
        <HeroSection
          isAdmin={isAdmin}
          de={de}
          zh={zh}
          en={en}
          showEn={showEn}
          setDraftDe={setDraftDe}
          setDraftZh={setDraftZh}
          setIsDirty={setIsDirty}
          updDe={updDe}
          updZh={updZh}
        />
        <CoursesSection
          isAdmin={isAdmin}
          de={de}
          zh={zh}
          en={en}
          showEn={showEn}
          courseOffset={courseOffset}
          setCourseOffset={setCourseOffset}
          setDraftDe={setDraftDe}
          setDraftZh={setDraftZh}
          updDeCourse={updDeCourse}
          updZhCourse={updZhCourse}
          addCourse={addCourse}
          removeCourse={removeCourse}
        />
        <NewsSection
          isAdmin={isAdmin}
          de={de}
          zh={zh}
          en={en}
          showEn={showEn}
          newsPage={newsPage}
          setNewsPage={setNewsPage}
          NEWS_PER_PAGE={NEWS_PER_PAGE}
          setDraftDe={setDraftDe}
          setDraftZh={setDraftZh}
          updDeNews={updDeNews}
          updZhNews={updZhNews}
          updDeNewsBlocks={updDeNewsBlocks}
          updZhNewsBlocks={updZhNewsBlocks}
          addNews={addNews}
          removeNews={removeNews}
          handleNewsImageUpload={handleNewsImageUpload}
          newsUploadingIdx={newsUploadingIdx}
          setNewsUploadingIdx={setNewsUploadingIdx}
          newsUploadError={newsUploadError}
          setNewsUploadError={setNewsUploadError}
          newsFileInputRef={newsFileInputRef}
        />
        <AboutSection
          isAdmin={isAdmin}
          de={de}
          zh={zh}
          en={en}
          showEn={showEn}
          updDe={updDe}
          updZh={updZh}
        />
        <ContactSection
          isAdmin={isAdmin}
          de={de}
          zh={zh}
          en={en}
          showEn={showEn}
          updDe={updDe}
          updZh={updZh}
          updDeAddrLine={updDeAddrLine}
          updZhAddrLine={updZhAddrLine}
        />
      </main>

      <Footer />

      {/* ── Admin toolbar ─────────────────────────────────────── */}
      {isAdmin && (
        <AdminToolbar
          currentUser={currentUser}
          isDirty={isDirty}
          saved={saved}
          showEnglish={showEnglish}
          updateShowEnglish={updateShowEnglish}
          remainingSeconds={remainingSeconds}
          totalSeconds={totalSeconds}
          toolbarPosition={toolbarPosition}
          setToolbarPosition={setToolbarPosition}
          handleSave={handleSave}
          handleDiscard={handleDiscard}
          logout={logout}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      )}
    </>
  );
}
