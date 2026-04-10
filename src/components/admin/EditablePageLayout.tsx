"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useContentDraft } from "@/hooks/useContentDraft";
import { useToolbarPosition } from "@/hooks/useToolbarPosition";
import SessionTimeoutWarning from "@/components/SessionTimeoutWarning";
import AdminToolbar from "@/components/admin/AdminToolbar";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { ExpandButton, ExpandModal } from "@/components/admin/AdminHelpers";

interface EditablePageLayoutProps {
  /** Content section key, e.g. "impressum" or "privacy". */
  section: "impressum" | "privacy";
  /** Human-readable label used in the expand modal header. */
  label: string;
}

/**
 * Shared page shell for the Impressum and Privacy pages.
 *
 * Both pages are structurally identical: trilingual content (DE / ZH / EN),
 * admin-editable via the same draft mechanism, with an expand-modal and
 * the standard AdminToolbar.  Only the content `section` key and the modal
 * label differ.
 */
export default function EditablePageLayout({ section, label }: EditablePageLayoutProps) {
  const { isAdmin, currentUser, logout } = useAuth();

  const { remainingSeconds, totalSeconds, showWarning, extendSession } =
    useAutoLogout(isAdmin, logout);

  const draft = useContentDraft();
  const { toolbarPosition, setToolbarPosition } = useToolbarPosition(isAdmin);

  useEffect(() => {
    if (!isAdmin) {
      draft.resetToSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const showEn = (s: string) => draft.isEnglishVisible(s);

  // Expand modal state (DE/ZH/EN)
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
          label={`${label} – ${expandedField.lang.toUpperCase()} ${expandedField.field}`}
          value={
            expandedField.lang === "de"
              ? draft.de[section][expandedField.field]
              : expandedField.lang === "zh"
              ? draft.zh[section][expandedField.field]
              : draft.en[section][expandedField.field]
          }
          onChange={(v) => {
            if (expandedField.lang === "de") draft.updDe(section, { [expandedField.field]: v });
            else if (expandedField.lang === "zh") draft.updZh(section, { [expandedField.field]: v });
            else draft.updEn(section, { [expandedField.field]: v });
          }}
          onClose={() => setExpandedField(null)}
          richText={expandedField.field === "content"}
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
                  value={draft.zh[section].pageTitle}
                  onChange={(e) => draft.updZh(section, { pageTitle: e.target.value })}
                  className="w-full text-center bg-amber-50/30 border-b-2 border-dashed border-amber-400 focus:outline-none focus:border-amber-500 focus:bg-amber-50/60 transition-colors font-cn text-3xl font-bold text-school-dark"
                />
              ) : (
                draft.zh[section].pageTitle
              )}
            </h1>
            <p className="text-lg text-gray-500">
              {isAdmin ? (
                <input
                  type="text"
                  value={draft.de[section].pageTitle}
                  onChange={(e) => draft.updDe(section, { pageTitle: e.target.value })}
                  className="w-full text-center bg-amber-50/30 border-b-2 border-dashed border-amber-400 focus:outline-none focus:border-amber-500 focus:bg-amber-50/60 transition-colors text-lg text-gray-500"
                />
              ) : (
                <>
                  {draft.de[section].pageTitle}{showEn(section) && ` · ${draft.en[section].pageTitle}`}
                </>
              )}
            </p>
            {isAdmin && (
              <p className="text-lg text-gray-400 mt-1">
                <input
                  type="text"
                  value={draft.en[section].pageTitle}
                  onChange={(e) => draft.updEn(section, { pageTitle: e.target.value })}
                  className="w-full text-center bg-amber-50/30 border-b-2 border-dashed border-amber-400 focus:outline-none focus:border-amber-500 focus:bg-amber-50/60 transition-colors text-lg text-gray-400"
                  placeholder="EN title…"
                />
              </p>
            )}
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
                {draft.de[section].pageTitle}
              </h2>
              {isAdmin ? (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="text-xs font-semibold text-gray-500">DE Content</span>
                    <ExpandButton onClick={() => setExpandedField({ lang: "de", field: "content" })} />
                  </div>
                  <RichTextEditor
                    value={draft.de[section].content}
                    onChange={(v) => draft.updDe(section, { content: v })}
                    placeholder="DE content…"
                    minHeight="200px"
                  />
                </div>
              ) : (
                <div className="whitespace-pre-line">{draft.de[section].content}</div>
              )}
            </section>

            {/* ZH content */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="font-cn text-base font-bold text-school-dark mb-3 pb-1 border-b border-gray-100">
                {draft.zh[section].pageTitle}
              </h2>
              {isAdmin ? (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="text-xs font-semibold text-gray-500">ZH Content</span>
                    <ExpandButton onClick={() => setExpandedField({ lang: "zh", field: "content" })} />
                  </div>
                  <RichTextEditor
                    value={draft.zh[section].content}
                    onChange={(v) => draft.updZh(section, { content: v })}
                    placeholder="ZH 内容…"
                    editorClassName="font-cn"
                    minHeight="200px"
                  />
                </div>
              ) : (
                <div className="font-cn whitespace-pre-line text-gray-600 leading-loose">
                  {draft.zh[section].content}
                </div>
              )}
            </section>

            {/* EN content */}
            {(isAdmin || showEn(section)) && (
              <section className="border-t border-gray-100 pt-8">
                <h2 className="text-base font-bold text-school-dark mb-3 pb-1 border-b border-gray-100">
                  {draft.en[section].pageTitle}
                </h2>
                {isAdmin ? (
                  <div>
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-semibold text-gray-500">EN Content</span>
                      <ExpandButton onClick={() => setExpandedField({ lang: "en", field: "content" })} />
                    </div>
                    <RichTextEditor
                      value={draft.en[section].content}
                      onChange={(v) => draft.updEn(section, { content: v })}
                      placeholder="EN content…"
                      minHeight="200px"
                    />
                  </div>
                ) : (
                  <div className="whitespace-pre-line">{draft.en[section].content}</div>
                )}
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
