"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useContentDraft } from "@/hooks/useContentDraft";
import SessionTimeoutWarning from "@/components/SessionTimeoutWarning";
import AdminToolbar from "@/components/admin/AdminToolbar";
import { EditArea } from "@/components/admin/EditHelpers";
import { ExpandButton, ExpandModal } from "@/components/admin/AdminHelpers";

export default function ImpressumPage() {
  const { isAdmin, currentUser, logout } = useAuth();

  const { remainingSeconds, totalSeconds, showWarning, extendSession } =
    useAutoLogout(isAdmin, logout);

  const draft = useContentDraft();

  // Toolbar position
  type ToolbarPos = "bottom" | "top";
  const TOOLBAR_POS_KEY = "yixin-toolbar-position";
  const [toolbarPosition, setToolbarPositionState] = useState<ToolbarPos>("bottom");

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

  useEffect(() => {
    if (!isAdmin) {
      draft.resetToSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const showEn = (section: string) => draft.isEnglishVisible(section);

  // Expand modal state
  const [expandedField, setExpandedField] = useState<{ lang: "de" | "zh" | "en"; field: "pageTitle" | "content" } | null>(null);

  return (
    <>
      {showWarning && (
        <SessionTimeoutWarning
          remainingSeconds={remainingSeconds}
          onExtend={extendSession}
          onLogout={logout}
        />
      )}

      {expandedField && (
        <ExpandModal
          label={`Impressum – ${expandedField.lang.toUpperCase()} ${expandedField.field}`}
          value={
            expandedField.lang === "de"
              ? draft.de.impressum[expandedField.field]
              : expandedField.lang === "zh"
              ? draft.zh.impressum[expandedField.field]
              : draft.en.impressum[expandedField.field]
          }
          onChange={(v) => {
            if (expandedField.lang === "de") draft.updDe("impressum", { [expandedField.field]: v });
            else if (expandedField.lang === "zh") draft.updZh("impressum", { [expandedField.field]: v });
          }}
          onClose={() => setExpandedField(null)}
        />
      )}

      <Navbar />

      <main className={`min-h-screen bg-school-gray${isAdmin && toolbarPosition === "bottom" ? " pb-28" : ""}${isAdmin && toolbarPosition === "top" ? " pt-20" : ""}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          {/* Page heading */}
          <div className="text-center mb-12">
            <div className="flex justify-center gap-1.5 mb-4">
              <span className="block w-8 h-1 bg-school-red rounded" />
              <span className="block w-3 h-1 bg-school-red rounded opacity-50" />
            </div>
            <h1 className="font-cn text-3xl font-bold text-school-dark mb-2">
              {isAdmin ? (
                <input
                  type="text"
                  value={draft.zh.impressum.pageTitle}
                  onChange={(e) => draft.updZh("impressum", { pageTitle: e.target.value })}
                  className="w-full text-center bg-amber-50/30 border-b-2 border-dashed border-amber-400 focus:outline-none focus:border-amber-500 focus:bg-amber-50/60 transition-colors font-cn text-3xl font-bold text-school-dark"
                />
              ) : (
                draft.zh.impressum.pageTitle
              )}
            </h1>
            <p className="text-lg text-gray-500">
              {isAdmin ? (
                <input
                  type="text"
                  value={draft.de.impressum.pageTitle}
                  onChange={(e) => draft.updDe("impressum", { pageTitle: e.target.value })}
                  className="w-full text-center bg-amber-50/30 border-b-2 border-dashed border-amber-400 focus:outline-none focus:border-amber-500 focus:bg-amber-50/60 transition-colors text-lg text-gray-500"
                />
              ) : (
                <>
                  {draft.de.impressum.pageTitle}{showEn("impressum") && ` · ${draft.en.impressum.pageTitle}`}
                </>
              )}
            </p>
          </div>

          <div className={`bg-white rounded-xl shadow-sm border p-8 space-y-10 text-sm text-gray-700 leading-relaxed ${isAdmin ? "border-amber-400 ring-2 ring-amber-400 ring-offset-2" : "border-school-border"}`}>
            {isAdmin && (
              <div className="flex items-center gap-2 text-amber-600 text-xs font-bold mb-2">
                <span className="text-lg">✏</span>
                <span>Edit Mode Active · 编辑模式 · Bearbeitungsmodus</span>
              </div>
            )}

            {/* DE content */}
            <section>
              <h2 className="text-base font-bold text-school-dark mb-3 pb-1 border-b border-gray-100">
                {draft.de.impressum.pageTitle}
              </h2>
              {isAdmin ? (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="text-xs font-semibold text-gray-500">DE Content</span>
                    <ExpandButton onClick={() => setExpandedField({ lang: "de", field: "content" })} />
                  </div>
                  <EditArea
                    value={draft.de.impressum.content}
                    onChange={(v) => draft.updDe("impressum", { content: v })}
                    className="min-h-[200px]"
                  />
                </div>
              ) : (
                <div className="whitespace-pre-line">{draft.de.impressum.content}</div>
              )}
            </section>

            {/* ZH content */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="font-cn text-base font-bold text-school-dark mb-3 pb-1 border-b border-gray-100">
                {draft.zh.impressum.pageTitle}
              </h2>
              {isAdmin ? (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="text-xs font-semibold text-gray-500">ZH Content</span>
                    <ExpandButton onClick={() => setExpandedField({ lang: "zh", field: "content" })} />
                  </div>
                  <EditArea
                    value={draft.zh.impressum.content}
                    onChange={(v) => draft.updZh("impressum", { content: v })}
                    className="font-cn min-h-[200px]"
                  />
                </div>
              ) : (
                <div className="font-cn whitespace-pre-line text-gray-600 leading-loose">
                  {draft.zh.impressum.content}
                </div>
              )}
            </section>

            {/* EN content */}
            {showEn("impressum") && (
              <section className="border-t border-gray-100 pt-8">
                <h2 className="text-base font-bold text-school-dark mb-3 pb-1 border-b border-gray-100">
                  {draft.en.impressum.pageTitle}
                </h2>
                <div className="whitespace-pre-line">{draft.en.impressum.content}</div>
              </section>
            )}
          </div>

          <p className="text-center mt-8 text-xs text-gray-400">
            <Link href="/" className="hover:text-school-red underline transition-colors">
              ← 返回网站 / Zurück zur Website / Back to site
            </Link>
          </p>
        </div>
      </main>

      <Footer />

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
