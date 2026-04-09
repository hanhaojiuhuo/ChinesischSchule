"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useContentDraft } from "@/hooks/useContentDraft";
import SessionTimeoutWarning from "@/components/SessionTimeoutWarning";
import AdminToolbar from "@/components/admin/AdminToolbar";
import HeroSection from "@/components/sections/HeroSection";
import CoursesSection from "@/components/sections/CoursesSection";
import NewsSection from "@/components/sections/NewsSection";
import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";

const NEWS_PER_PAGE = 4;

/* ─── Page ─────────────────────────────────────────────────── */
export default function Home() {
  const { isAdmin, currentUser, logout } = useAuth();

  // Auto-logout – shares the same persisted deadline as the admin panel
  const { remainingSeconds, totalSeconds, showWarning, extendSession } =
    useAutoLogout(isAdmin, logout);

  // All draft content state + updaters extracted into a hook
  const draft = useContentDraft();

  const [courseOffset, setCourseOffset] = useState(0);
  const [newsPage, setNewsPage] = useState(0);

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
    window.dispatchEvent(new CustomEvent("toolbar-position-change", { detail: pos }));
  }, []);

  // When admin logs out, reset drafts to saved content
  useEffect(() => {
    if (!isAdmin) {
      draft.resetToSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Reset news page when content changes
  useEffect(() => {
    setNewsPage(0);
  }, [draft.de, draft.zh]);

  const showEn = (section: string) => draft.isEnglishVisible(section);

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

      <main id="main-content" className={`flex-1${isAdmin && toolbarPosition === "bottom" ? " pb-28" : ""}${isAdmin && toolbarPosition === "top" ? " pt-20" : ""}`}>
        <HeroSection
          isAdmin={isAdmin}
          de={draft.de}
          zh={draft.zh}
          en={draft.en}
          showEn={showEn}
          setDraftDe={draft.setDraftDe}
          setDraftZh={draft.setDraftZh}
          setIsDirty={draft.setIsDirty}
          updDe={draft.updDe}
          updZh={draft.updZh}
        />
        <CoursesSection
          isAdmin={isAdmin}
          de={draft.de}
          zh={draft.zh}
          en={draft.en}
          showEn={showEn}
          courseOffset={courseOffset}
          setCourseOffset={setCourseOffset}
          setDraftDe={draft.setDraftDe}
          setDraftZh={draft.setDraftZh}
          updDeCourse={draft.updDeCourse}
          updZhCourse={draft.updZhCourse}
          addCourse={draft.addCourse}
          removeCourse={draft.removeCourse}
        />
        <NewsSection
          isAdmin={isAdmin}
          de={draft.de}
          zh={draft.zh}
          en={draft.en}
          showEn={showEn}
          newsPage={newsPage}
          setNewsPage={setNewsPage}
          NEWS_PER_PAGE={NEWS_PER_PAGE}
          setDraftDe={draft.setDraftDe}
          setDraftZh={draft.setDraftZh}
          updDeNews={draft.updDeNews}
          updZhNews={draft.updZhNews}
          updDeNewsBlocks={draft.updDeNewsBlocks}
          updZhNewsBlocks={draft.updZhNewsBlocks}
          addNews={draft.addNews}
          removeNews={draft.removeNews}
          handleNewsImageUpload={draft.handleNewsImageUpload}
          newsUploadingIdx={draft.newsUploadingIdx}
          setNewsUploadingIdx={draft.setNewsUploadingIdx}
          newsUploadError={draft.newsUploadError}
          setNewsUploadError={draft.setNewsUploadError}
          newsFileInputRef={draft.newsFileInputRef}
        />
        <AboutSection
          isAdmin={isAdmin}
          de={draft.de}
          zh={draft.zh}
          en={draft.en}
          showEn={showEn}
          updDe={draft.updDe}
          updZh={draft.updZh}
        />
        <ContactSection
          isAdmin={isAdmin}
          de={draft.de}
          zh={draft.zh}
          en={draft.en}
          showEn={showEn}
          updDe={draft.updDe}
          updZh={draft.updZh}
          updDeAddrLine={draft.updDeAddrLine}
          updZhAddrLine={draft.updZhAddrLine}
        />
      </main>

      <Footer />

      {/* ── Admin toolbar ─────────────────────────────────────── */}
      {isAdmin && (
        <AdminToolbar
          currentUser={currentUser}
          isDirty={draft.isDirty}
          saved={draft.saved}
          showEnglish={draft.showEnglish}
          updateShowEnglish={draft.updateShowEnglish}
          remainingSeconds={remainingSeconds}
          totalSeconds={totalSeconds}
          toolbarPosition={toolbarPosition}
          setToolbarPosition={setToolbarPosition}
          handleSave={draft.handleSave}
          handleDiscard={draft.handleDiscard}
          logout={logout}
          canUndo={draft.canUndo}
          canRedo={draft.canRedo}
          onUndo={draft.handleUndo}
          onRedo={draft.handleRedo}
        />
      )}
    </>
  );
}
