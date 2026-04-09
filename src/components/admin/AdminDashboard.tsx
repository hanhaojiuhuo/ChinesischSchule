"use client";

import Image from "next/image";
import { Field, SectionCard, ExpandModal, ExpandButton } from "@/components/admin/AdminHelpers";
import { HelpIcon } from "@/components/admin/Tooltip";
import SessionTimeoutWarning from "@/components/SessionTimeoutWarning";
import { getNewsBodyBlocks } from "@/i18n/translations";
import type { Language, SiteContent, NewsBodyBlock, CourseItem } from "@/i18n/translations";
import type { AdminUser } from "@/contexts/AuthContext";
import {
  countWords,
  MAX_WORDS_NEWS,
  MAX_WORDS_DEFAULT,
  validateImageFile,
  IMAGE_ACCEPT,
} from "@/lib/validation";

export interface AdminDashboardProps {
  // Auth / session
  currentUser: string | null;
  isRecoverySession: boolean;
  logout: () => void;
  remainingSeconds: number;
  totalSeconds: number;
  showWarning: boolean;
  extendSession: () => void;

  // Language
  editLang: Language;
  setEditLang: (lang: Language) => void;
  setLanguage: (lang: Language) => void;

  // Content draft
  draft: SiteContent;
  setDraft: React.Dispatch<React.SetStateAction<SiteContent>>;
  handleSave: () => void;
  handleReset: () => void;
  handleSectionSave: (sectionKey: string) => void;
  saving: boolean;
  saved: boolean;
  sectionStatus: Record<string, "idle" | "saving" | "saved">;

  // Field updaters
  setField: (field: string, value: string) => void;
  updateAbout: (key: string, value: string) => void;
  updateHero: (key: string, value: string) => void;
  updateNav: (key: string, value: string) => void;
  updateContact: (key: string, value: string | string[]) => void;
  updateCourse: (idx: number, key: keyof CourseItem, val: string) => void;
  addCourse: () => void;
  removeCourse: (idx: number) => void;
  updateNews: (idx: number, key: string, val: string) => void;
  updateNewsBlocks: (idx: number, blocks: NewsBodyBlock[]) => void;
  handleNewsImageUpload: (file: File, newsIdx: number, blockIdx: number) => void;
  addNews: () => void;
  removeNews: (idx: number) => void;
  newsUploadingIdx: { newsIdx: number; blockIdx: number } | null;
  setNewsUploadingIdx: React.Dispatch<React.SetStateAction<{ newsIdx: number; blockIdx: number } | null>>;
  newsUploadError: string;
  setNewsUploadError: React.Dispatch<React.SetStateAction<string>>;
  newsFileInputRef: React.RefObject<HTMLInputElement | null>;
  newsExpandedBlock: { newsIdx: number; blockIdx: number } | null;
  setNewsExpandedBlock: React.Dispatch<React.SetStateAction<{ newsIdx: number; blockIdx: number } | null>>;

  // Password change
  showChangePw: boolean;
  setShowChangePw: (v: boolean) => void;
  oldPw: string;
  setOldPw: (v: string) => void;
  newPw: string;
  setNewPw: (v: string) => void;
  newPwConfirm: string;
  setNewPwConfirm: (v: string) => void;
  pwChangeMsg: string;
  setPwChangeMsg: (v: string) => void;
  pwChangeMsgType: "success" | "info" | "error";
  showChangePwOld: boolean;
  setShowChangePwOld: React.Dispatch<React.SetStateAction<boolean>>;
  showChangePwNew: boolean;
  setShowChangePwNew: React.Dispatch<React.SetStateAction<boolean>>;
  showChangePwConfirm: boolean;
  setShowChangePwConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  pwChangeStep: "form" | "verify";
  setPwChangeStep: (v: "form" | "verify") => void;
  pwChangeCode: string;
  setPwChangeCode: (v: string) => void;
  pwChangeMaskedEmail: string;
  pwChangeLoading: boolean;
  handleChangePw: (e: React.FormEvent) => void;

  // Admin management
  adminList: AdminUser[];
  adminListKey: number;
  editingEmailUser: string | null;
  setEditingEmailUser: (v: string | null) => void;
  editEmailValue: string;
  setEditEmailValue: (v: string) => void;
  emailUpdateMsg: string;
  setEmailUpdateMsg: (v: string) => void;
  handleUpdateEmail: (username: string) => void;
  adminResetUser: string | null;
  setAdminResetUser: (v: string | null) => void;
  adminResetLoading: boolean;
  adminResetMsg: string;
  setAdminResetMsg: (v: string) => void;
  handleAdminResetPassword: (username: string) => void;
  handleRemoveAdmin: (username: string) => void;
  removeAdminMsg: string;

  // Add admin
  showAddAdmin: boolean;
  setShowAddAdmin: (v: boolean) => void;
  newAdminUser: string;
  setNewAdminUser: (v: string) => void;
  newAdminPw: string;
  setNewAdminPw: (v: string) => void;
  newAdminPwConfirm: string;
  setNewAdminPwConfirm: (v: string) => void;
  newAdminEmail: string;
  setNewAdminEmail: (v: string) => void;
  showNewAdminPw: boolean;
  setShowNewAdminPw: React.Dispatch<React.SetStateAction<boolean>>;
  addAdminMsg: string;
  addAdminSuccess: boolean;
  handleAddAdmin: (e: React.FormEvent) => void;
  setAddAdminMsg: (v: string) => void;
}

const langLabels: Record<Language, string> = { de: "Deutsch", zh: "中文", en: "English" };

export default function AdminDashboard(props: AdminDashboardProps) {
  const {
    currentUser,
    isRecoverySession,
    logout,
    remainingSeconds,
    totalSeconds,
    showWarning,
    extendSession,
    editLang,
    setEditLang,
    setLanguage,
    draft,
    setDraft,
    handleSave,
    handleReset,
    handleSectionSave,
    saving,
    saved,
    sectionStatus,
    setField,
    updateAbout,
    updateHero,
    updateNav,
    updateContact,
    updateCourse,
    addCourse,
    removeCourse,
    updateNews,
    updateNewsBlocks,
    handleNewsImageUpload,
    addNews,
    removeNews,
    newsUploadingIdx,
    setNewsUploadingIdx,
    newsUploadError,
    setNewsUploadError,
    newsFileInputRef,
    newsExpandedBlock,
    setNewsExpandedBlock,
    showChangePw,
    setShowChangePw,
    oldPw,
    setOldPw,
    newPw,
    setNewPw,
    newPwConfirm,
    setNewPwConfirm,
    pwChangeMsg,
    setPwChangeMsg,
    pwChangeMsgType,
    showChangePwOld,
    setShowChangePwOld,
    showChangePwNew,
    setShowChangePwNew,
    showChangePwConfirm,
    setShowChangePwConfirm,
    pwChangeStep,
    setPwChangeStep,
    pwChangeCode,
    setPwChangeCode,
    pwChangeMaskedEmail,
    pwChangeLoading,
    handleChangePw,
    adminList,
    adminListKey,
    editingEmailUser,
    setEditingEmailUser,
    editEmailValue,
    setEditEmailValue,
    emailUpdateMsg,
    setEmailUpdateMsg,
    handleUpdateEmail,
    adminResetUser,
    setAdminResetUser,
    adminResetLoading,
    adminResetMsg,
    setAdminResetMsg,
    handleAdminResetPassword,
    handleRemoveAdmin,
    removeAdminMsg,
    showAddAdmin,
    setShowAddAdmin,
    newAdminUser,
    setNewAdminUser,
    newAdminPw,
    setNewAdminPw,
    newAdminPwConfirm,
    setNewAdminPwConfirm,
    newAdminEmail,
    setNewAdminEmail,
    showNewAdminPw,
    setShowNewAdminPw,
    addAdminMsg,
    addAdminSuccess,
    handleAddAdmin,
    setAddAdminMsg,
  } = props;

  return (
    <div className="min-h-screen bg-[var(--school-gray)]">
      {/* Session timeout warning popup */}
      {showWarning && (
        <SessionTimeoutWarning
          remainingSeconds={remainingSeconds}
          onExtend={extendSession}
          onLogout={logout}
        />
      )}
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-[var(--school-dark)] text-white px-4 py-3 flex items-center justify-between gap-4 flex-wrap shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-cn font-bold text-lg">管理面板</span>
          <span className="text-gray-400 text-sm hidden sm:inline">
            Admin Panel · {currentUser}
          </span>
          {/* Auto-logout countdown + total limit */}
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded ${
              remainingSeconds <= 60
                ? "bg-red-600 text-white animate-pulse"
                : remainingSeconds <= 180
                ? "bg-yellow-500 text-black"
                : "bg-white/10 text-gray-300"
            }`}
            title="自动登出倒计时 / Auto-logout countdown / Automatische Abmeldung"
          >
            ⏱ {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:
            {String(remainingSeconds % 60).padStart(2, "0")}
            {" / "}
            {String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:
            {String(totalSeconds % 60).padStart(2, "0")}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs font-semibold">
            {(["de", "zh", "en"] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setEditLang(l)}
                className={`px-2 py-1 rounded transition-colors ${
                  editLang === l
                    ? "bg-[var(--school-red)] text-white"
                    : "bg-white/10 hover:bg-white/20 text-gray-200"
                }`}
              >
                {langLabels[l]}
              </button>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded transition-colors"
          >
            {saving ? "⏳ Speichern…" : saved ? "✓ Gespeichert!" : "Speichern / Save / 保存"}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded transition-colors"
          >
            Zurücksetzen / Reset
          </button>
          <button
            onClick={() => { setLanguage(editLang); window.location.href = "/"; }}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
          >
            ← Zur Website
          </button>
          <button
            onClick={logout}
            className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded transition-colors"
          >
            Abmelden / Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isRecoverySession && (
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-400 rounded-lg text-sm text-amber-900">
            <strong>⚠️ 恢复模式已激活 / Recovery Mode Active / Wiederherstellungsmodus aktiv</strong>
            <p className="mt-1">
              您正在通过恢复模式访问管理面板。请立即在下方【管理员管理】部分创建一个新管理员账户，然后在 Vercel 环境变量中删除 <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code> 并重新部署。
            </p>
            <p className="mt-1 text-xs opacity-80">
              You are logged in via recovery mode. Create a new admin account below, then remove <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code> from your Vercel environment variables and redeploy. ·
              Sie sind im Wiederherstellungsmodus angemeldet. Erstellen Sie unten ein neues Admin-Konto und entfernen Sie anschließend <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code> aus den Vercel-Umgebungsvariablen.
            </p>
          </div>
        )}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Sprache bearbeiten / Editing language:</strong> {langLabels[editLang]} &nbsp;|&nbsp;
          Änderungen werden in der Vercel-Cloud gespeichert.
          Changes are saved in Vercel cloud.
          更改保存在 Vercel 云端。
          <HelpIcon text="Switch between DE / ZH / EN tabs to edit content for each language independently. Each tab edits only that language's content. / 切换语言标签以分别编辑各语言的内容。" />
        </div>

        {/* ── School identity ─────────────────────────────── */}
        <SectionCard title="🏫 Schulinfo / School Info / 学校信息" onSave={() => handleSectionSave("schoolInfo")} saveStatus={sectionStatus["schoolInfo"]}>
          <Field label="School Name (full)" value={draft.schoolName} onChange={(v) => setField("schoolName", v)} maxWords={MAX_WORDS_DEFAULT} />
          <Field label="School Name (short)" value={draft.schoolNameShort} onChange={(v) => setField("schoolNameShort", v)} maxWords={MAX_WORDS_DEFAULT} />
          <Field label="School Subtitle" value={draft.schoolSubtitle} onChange={(v) => setField("schoolSubtitle", v)} maxWords={MAX_WORDS_DEFAULT} />
        </SectionCard>

        {/* ── Navigation ──────────────────────────────────── */}
        <SectionCard title="🔗 Navigation" onSave={() => handleSectionSave("nav")} saveStatus={sectionStatus["nav"]}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(draft.nav) as (keyof SiteContent["nav"])[]).map((key) => (
              <Field key={key} label={key} value={draft.nav[key]} onChange={(v) => updateNav(key, v)} maxWords={MAX_WORDS_DEFAULT} />
            ))}
          </div>
        </SectionCard>

        {/* ── Hero ────────────────────────────────────────── */}
        <SectionCard title="🌟 Hero Section" onSave={() => handleSectionSave("hero")} saveStatus={sectionStatus["hero"]}>
          <Field label="Tagline (main)" value={draft.hero.tagline} onChange={(v) => updateHero("tagline", v)} maxWords={MAX_WORDS_DEFAULT} />
          <Field label="Tagline 2 (sub)" value={draft.hero.tagline2} onChange={(v) => updateHero("tagline2", v)} maxWords={MAX_WORDS_DEFAULT} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button: Discover Courses" value={draft.hero.discoverCourses} onChange={(v) => updateHero("discoverCourses", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Button: Contact Us" value={draft.hero.contactUs} onChange={(v) => updateHero("contactUs", v)} maxWords={MAX_WORDS_DEFAULT} />
          </div>
        </SectionCard>

        {/* ── About ───────────────────────────────────────── */}
        <SectionCard title="ℹ️ About Section / Über uns / 关于我们" onSave={() => handleSectionSave("about")} saveStatus={sectionStatus["about"]}>
          <Field label="Section title" value={draft.about.sectionTitle} onChange={(v) => updateAbout("sectionTitle", v)} maxWords={MAX_WORDS_DEFAULT} />
          <Field label="Description paragraph 1" value={draft.about.desc1} onChange={(v) => updateAbout("desc1", v)} multiline maxWords={MAX_WORDS_DEFAULT} />
          <Field label="Description paragraph 2" value={draft.about.desc2} onChange={(v) => updateAbout("desc2", v)} multiline maxWords={MAX_WORDS_DEFAULT} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Years" value={draft.about.years} onChange={(v) => updateAbout("years", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Students" value={draft.about.students} onChange={(v) => updateAbout("students", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Teachers" value={draft.about.teachers} onChange={(v) => updateAbout("teachers", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Courses count" value={draft.about.coursesCount} onChange={(v) => updateAbout("coursesCount", v)} maxWords={MAX_WORDS_DEFAULT} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
            <Field label="Years label" value={draft.about.yearsLabel} onChange={(v) => updateAbout("yearsLabel", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Students label" value={draft.about.studentsLabel} onChange={(v) => updateAbout("studentsLabel", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Teachers label" value={draft.about.teachersLabel} onChange={(v) => updateAbout("teachersLabel", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Courses label" value={draft.about.coursesLabel} onChange={(v) => updateAbout("coursesLabel", v)} maxWords={MAX_WORDS_DEFAULT} />
          </div>
        </SectionCard>

        {/* ── Courses ─────────────────────────────────────── */}
        <SectionCard title="📚 Courses / Kurse / 课程" onSave={() => handleSectionSave("courses")} saveStatus={sectionStatus["courses"]}>
          <Field
            label="Section title"
            value={draft.courses.sectionTitle}
            onChange={(v) => setDraft((d) => ({ ...d, courses: { ...d.courses, sectionTitle: v } }))}
            maxWords={MAX_WORDS_DEFAULT}
          />
          {draft.courses.items.map((course, idx) => (
            <div key={idx} className="border border-gray-200 rounded p-4 mb-3 bg-gray-50 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Course {idx + 1}</span>
                <button onClick={() => removeCourse(idx)} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                  ✕ Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="课程 / Kurs" value={course.level} onChange={(v) => updateCourse(idx, "level", v)} maxWords={MAX_WORDS_DEFAULT} />
                <Field label="级别标签 / Level label" value={course.levelLabel} onChange={(v) => updateCourse(idx, "levelLabel", v)} maxWords={MAX_WORDS_DEFAULT} />
                <Field label="年龄 / Age range" value={course.ages} onChange={(v) => updateCourse(idx, "ages", v)} maxWords={MAX_WORDS_DEFAULT} />
                <Field label="上课时间 / Class time / Unterrichtszeit" value={course.time ?? ""} onChange={(v) => updateCourse(idx, "time", v)} maxWords={MAX_WORDS_DEFAULT} />
                <Field label="描述 / Description" value={course.desc} onChange={(v) => updateCourse(idx, "desc", v)} maxWords={MAX_WORDS_DEFAULT} />
              </div>
            </div>
          ))}
          <button
            onClick={addCourse}
            className="px-4 py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-[var(--school-red)] hover:text-[var(--school-red)] w-full transition-colors"
          >
            + Kurs hinzufügen / Add course / 添加课程
          </button>
        </SectionCard>

        {/* ── News ────────────────────────────────────────── */}
        {/* Hidden file input for news image uploads */}
        <input
          ref={newsFileInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && newsUploadingIdx) {
              const err = validateImageFile(file);
              if (err) {
                setNewsUploadError(err);
              } else {
                handleNewsImageUpload(file, newsUploadingIdx.newsIdx, newsUploadingIdx.blockIdx);
              }
            } else {
              setNewsUploadingIdx(null);
            }
            e.target.value = "";
          }}
        />
        <SectionCard title="📰 News / Aktuelles / 学校新闻" onSave={() => handleSectionSave("news")} saveStatus={sectionStatus["news"]}>
          <Field
            label="Section title"
            value={draft.news.sectionTitle}
            onChange={(v) => setDraft((d) => ({ ...d, news: { ...d.news, sectionTitle: v } }))}
            maxWords={MAX_WORDS_DEFAULT}
          />
          <button
            onClick={addNews}
            className="mb-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-[var(--school-red)] hover:text-[var(--school-red)] w-full transition-colors"
          >
            + Neuigkeit hinzufügen / Add news / 添加新闻
          </button>
          {draft.news.items.map((item, idx) => {
            const blocks = getNewsBodyBlocks(item).length > 0 ? getNewsBodyBlocks(item) : [{ type: "text" as const, content: "" }];
            return (
            <div key={idx} className="border border-gray-200 rounded p-4 mb-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">News {idx + 1}</span>
                <button onClick={() => removeNews(idx)} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                  ✕ Remove
                </button>
              </div>
              <Field label="Date (e.g. 2025-09)" value={item.date} onChange={(v) => updateNews(idx, "date", v)} />
              <Field label="Title" value={item.title} onChange={(v) => updateNews(idx, "title", v)} maxWords={MAX_WORDS_DEFAULT} />

              {/* Body blocks */}
              <div className="mt-3 mb-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2">Body Blocks / Inhaltsblöcke / 内容块</label>
                {blocks.map((block, bIdx) => (
                  <div key={bIdx} className="flex gap-2 mb-2 items-start">
                    <div className="flex flex-col gap-1 mt-1">
                      {bIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newBlocks = [...blocks];
                            [newBlocks[bIdx - 1], newBlocks[bIdx]] = [newBlocks[bIdx], newBlocks[bIdx - 1]];
                            updateNewsBlocks(idx, newBlocks);
                          }}
                          className="text-xs text-gray-400 hover:text-gray-700"
                          title="Move up"
                        >▲</button>
                      )}
                      {bIdx < blocks.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newBlocks = [...blocks];
                            [newBlocks[bIdx], newBlocks[bIdx + 1]] = [newBlocks[bIdx + 1], newBlocks[bIdx]];
                            updateNewsBlocks(idx, newBlocks);
                          }}
                          className="text-xs text-gray-400 hover:text-gray-700"
                          title="Move down"
                        >▼</button>
                      )}
                    </div>
                    <div className="flex-1">
                      {block.type === "text" ? (
                        <div>
                          <div className="flex items-center mb-1">
                            <span className="text-xs text-gray-500">Text</span>
                            <ExpandButton onClick={() => setNewsExpandedBlock({ newsIdx: idx, blockIdx: bIdx })} />
                          </div>
                          {newsExpandedBlock?.newsIdx === idx && newsExpandedBlock?.blockIdx === bIdx && (
                            <ExpandModal
                              label={`News ${idx + 1} – Text block ${bIdx + 1}`}
                              value={block.content}
                              onChange={(v) => {
                                const newBlocks = blocks.map((b, i) =>
                                  i === bIdx ? { ...b, content: v } : b
                                ) as typeof blocks;
                                updateNewsBlocks(idx, newBlocks);
                              }}
                              onClose={() => setNewsExpandedBlock(null)}
                              maxWords={MAX_WORDS_NEWS}
                            />
                          )}
                          <textarea
                            className={`w-full border rounded px-3 py-2 text-sm focus:outline-none resize-y min-h-[60px] ${countWords(block.content) > MAX_WORDS_NEWS ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[var(--school-red)]"}`}
                            value={block.content}
                            placeholder="Text…"
                            onChange={(e) => {
                              const newBlocks = blocks.map((b, i) =>
                                i === bIdx ? { ...b, content: e.target.value } : b
                              ) as typeof blocks;
                              updateNewsBlocks(idx, newBlocks);
                            }}
                          />
                          <p className={`text-xs mt-0.5 text-right ${countWords(block.content) > MAX_WORDS_NEWS ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                            {countWords(block.content)} / {MAX_WORDS_NEWS} words
                          </p>
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded p-2 bg-white">
                          <div
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const file = e.dataTransfer.files?.[0];
                              if (file) {
                                const err = validateImageFile(file);
                                if (err) {
                                  setNewsUploadError(err);
                                } else {
                                  handleNewsImageUpload(file, idx, bIdx);
                                }
                              }
                            }}
                            onClick={() => {
                              setNewsUploadingIdx({ newsIdx: idx, blockIdx: bIdx });
                              newsFileInputRef.current?.click();
                            }}
                            className="border-2 border-dashed border-gray-300 hover:border-[var(--school-red)] rounded-lg p-3 text-center cursor-pointer transition-colors mb-1"
                          >
                            {newsUploadingIdx?.newsIdx === idx && newsUploadingIdx?.blockIdx === bIdx ? (
                              <p className="text-sm text-gray-500">⏳ Uploading… / 上传中…</p>
                            ) : block.url ? (
                              <div>
                                <Image src={block.url} alt={block.caption ?? ""} width={400} height={128} unoptimized className="mx-auto max-h-32 object-cover rounded border border-gray-200 mb-1" />
                                <p className="text-xs text-gray-400">Click or drop to replace / 点击或拖拽替换图片</p>
                                <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, GIF, TIFF, SVG, RAW · max 3 MB</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xl mb-1">📎</p>
                                <p className="text-sm text-gray-500">Drop image here or click to upload</p>
                                <p className="text-xs text-gray-400">Bild hierher ziehen oder klicken / 拖拽图片到此处或点击上传</p>
                                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, TIFF, SVG, RAW · max 3 MB</p>
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--school-red)]"
                            value={block.caption ?? ""}
                            placeholder="Caption (optional) / Bildunterschrift"
                            onChange={(e) => {
                              const newBlocks = blocks.map((b, i) =>
                                i === bIdx ? { ...b, caption: e.target.value || undefined } : b
                              ) as typeof blocks;
                              updateNewsBlocks(idx, newBlocks);
                            }}
                          />
                          {newsUploadError && newsUploadingIdx?.newsIdx === idx && (
                            <p className="text-xs text-red-600 mt-1">{newsUploadError}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newBlocks = blocks.filter((_, i) => i !== bIdx);
                        updateNewsBlocks(idx, newBlocks.length > 0 ? newBlocks : [{ type: "text", content: "" }]);
                      }}
                      className="text-xs text-red-400 hover:text-red-600 mt-2"
                      title="Remove block"
                    >✕</button>
                  </div>
                ))}
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => updateNewsBlocks(idx, [...blocks, { type: "text", content: "" }])}
                    className="text-xs px-3 py-1 border border-dashed border-gray-300 rounded hover:border-[var(--school-red)] hover:text-[var(--school-red)] transition-colors"
                  >
                    + Text / 添加文本
                  </button>
                  <button
                    type="button"
                    onClick={() => updateNewsBlocks(idx, [...blocks, { type: "image", url: "" }])}
                    className="text-xs px-3 py-1 border border-dashed border-gray-300 rounded hover:border-[var(--school-red)] hover:text-[var(--school-red)] transition-colors"
                  >
                    + Image / 添加图片
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </SectionCard>

        {/* ── Contact ─────────────────────────────────────── */}
        <SectionCard title="📍 Contact / Kontakt / 联系我们" onSave={() => handleSectionSave("contact")} saveStatus={sectionStatus["contact"]}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Section title" value={draft.contact.sectionTitle} onChange={(v) => updateContact("sectionTitle", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Address title" value={draft.contact.addressTitle} onChange={(v) => updateContact("addressTitle", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Email title" value={draft.contact.emailTitle} onChange={(v) => updateContact("emailTitle", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Email address" value={draft.contact.email} onChange={(v) => updateContact("email", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Phone title" value={draft.contact.phoneTitle} onChange={(v) => updateContact("phoneTitle", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Phone number" value={draft.contact.phone} onChange={(v) => updateContact("phone", v)} maxWords={MAX_WORDS_DEFAULT} />
          </div>
          <div className="mt-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Address lines (one per line)</label>
            <textarea
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none min-h-[60px] ${countWords(draft.contact.addressLines.join("\n")) > MAX_WORDS_DEFAULT ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[var(--school-red)]"}`}
              value={draft.contact.addressLines.join("\n")}
              onChange={(e) => updateContact("addressLines", e.target.value.split("\n"))}
            />
            <p className={`text-xs mt-0.5 text-right ${countWords(draft.contact.addressLines.join("\n")) > MAX_WORDS_DEFAULT ? "text-red-600 font-semibold" : "text-gray-400"}`}>
              {countWords(draft.contact.addressLines.join("\n"))} / {MAX_WORDS_DEFAULT} words
            </p>
          </div>
        </SectionCard>

        {/* ── Footer labels ────────────────────────────────── */}
        <SectionCard title="🔻 Footer" onSave={() => handleSectionSave("footer")} saveStatus={sectionStatus["footer"]}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Navigation section title" value={draft.footer.navigationTitle} onChange={(v) => setDraft((d) => ({ ...d, footer: { ...d.footer, navigationTitle: v } }))} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Contact section title" value={draft.footer.contactTitle} onChange={(v) => setDraft((d) => ({ ...d, footer: { ...d.footer, contactTitle: v } }))} maxWords={MAX_WORDS_DEFAULT} />
          </div>
        </SectionCard>

        {/* ── Impressum ───────────────────────────────────── */}
        <SectionCard title="📋 Impressum / Legal Notice / 法律声明" onSave={() => handleSectionSave("impressum")} saveStatus={sectionStatus["impressum"]}>
          <Field label="Page title" value={draft.impressum.pageTitle} onChange={(v) => setDraft((d) => ({ ...d, impressum: { ...d.impressum, pageTitle: v } }))} maxWords={MAX_WORDS_DEFAULT} />
          <Field label="Content" value={draft.impressum.content} onChange={(v) => setDraft((d) => ({ ...d, impressum: { ...d.impressum, content: v } }))} multiline expandable />
        </SectionCard>

        {/* ── Privacy / Datenschutz ───────────────────────── */}
        <SectionCard title="🔒 Datenschutz / Privacy / 隐私政策" onSave={() => handleSectionSave("privacy")} saveStatus={sectionStatus["privacy"]}>
          <Field label="Page title" value={draft.privacy.pageTitle} onChange={(v) => setDraft((d) => ({ ...d, privacy: { ...d.privacy, pageTitle: v } }))} maxWords={MAX_WORDS_DEFAULT} />
          <Field label="Content" value={draft.privacy.content} onChange={(v) => setDraft((d) => ({ ...d, privacy: { ...d.privacy, content: v } }))} multiline expandable />
        </SectionCard>

        {/* ── Change password ──────────────────────────────── */}
        <SectionCard title={<span className="flex items-center gap-2">🔐 修改密码 / Change Password / Passwort ändern <HelpIcon text="Change your admin login password / 修改管理员密码" /></span>}>
          {!showChangePw ? (
            <button onClick={() => setShowChangePw(true)} className="text-sm text-[var(--school-red)] underline">
              修改密码 / Change password / Passwort ändern
            </button>
          ) : (
            <form onSubmit={handleChangePw} className="max-w-sm space-y-3">
              {pwChangeStep === "form" && (
                <>
                  <Field label="当前密码 / Current password / Aktuelles Passwort" value={oldPw} onChange={setOldPw} type="password" autoComplete="current-password" showPassword={showChangePwOld} onTogglePassword={() => setShowChangePwOld((v) => !v)} />
                  <Field label="新密码（至少6位）/ New password (min 6 chars) / Neues Passwort" value={newPw} onChange={setNewPw} type="password" autoComplete="new-password" showPassword={showChangePwNew} onTogglePassword={() => setShowChangePwNew((v) => !v)} />
                  <Field label="确认新密码 / Confirm new password / Neues Passwort bestätigen" value={newPwConfirm} onChange={setNewPwConfirm} type="password" autoComplete="new-password" showPassword={showChangePwConfirm} onTogglePassword={() => setShowChangePwConfirm((v) => !v)} />
                </>
              )}
              {pwChangeStep === "verify" && (
                <>
                  <p className="text-xs text-gray-500">
                    验证码已发送至 {pwChangeMaskedEmail} / Code sent to {pwChangeMaskedEmail} / Code gesendet an {pwChangeMaskedEmail}
                  </p>
                  <Field
                    label="验证码 / Verification code / Verifizierungscode"
                    value={pwChangeCode}
                    onChange={setPwChangeCode}
                  />
                </>
              )}
              {pwChangeMsg && (
                <p className={`text-xs whitespace-pre-line ${pwChangeMsgType === "success" ? "text-green-600" : pwChangeMsgType === "info" ? "text-blue-600" : "text-red-600"}`}>
                  {pwChangeMsg}
                </p>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={pwChangeLoading} className="px-4 py-2 bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] disabled:opacity-60 text-white text-sm font-semibold rounded transition-colors">
                  {pwChangeLoading ? "⏳" : pwChangeStep === "verify" ? "✓ 验证并保存 / Verify & Save / Verifizieren & Speichern" : "保存 / Save / Speichern"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowChangePw(false); setPwChangeMsg(""); setOldPw(""); setNewPw(""); setNewPwConfirm(""); setPwChangeStep("form"); setPwChangeCode(""); }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded transition-colors"
                >
                  取消 / Cancel / Abbrechen
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        {/* ── Admin management ─────────────────────────────── */}
        <SectionCard title={<span className="flex items-center gap-2">👥 管理员管理 / Administrators / Administratoren <HelpIcon text="Manage admin accounts, reset passwords / 管理管理员账户" /></span>}>
          {/* Current admin list */}
          <div className="mb-4" key={adminListKey}>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              当前管理员 / Current Admins / Aktuelle Admins
            </h4>
            <div className="space-y-2">
              {adminList.map((a) => (
                <div
                  key={a.username}
                  className="bg-gray-50 border border-gray-200 rounded px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--school-dark)]">
                          {a.username}
                        </span>
                        {a.username === currentUser && (
                          <span className="text-xs bg-[var(--school-red)] text-white px-1.5 py-0.5 rounded">
                            当前 / you
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {a.email ? (
                          <span className="text-xs text-gray-400">✉ {a.email}</span>
                        ) : (
                          <span className="text-xs text-gray-300 italic">No email / 无邮箱</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEmailUser(a.username);
                            setEditEmailValue(a.email ?? "");
                            setEmailUpdateMsg("");
                          }}
                          className="text-xs text-[var(--school-red)] hover:opacity-80 underline"
                        >
                          ✏ Edit
                        </button>
                      </div>
                    </div>
                    {a.username !== currentUser && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAdminResetUser(adminResetUser === a.username ? null : a.username);
                            setAdminResetMsg("");
                          }}
                          disabled={adminResetLoading}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                        >
                          🔑 重置密码 / Reset PW
                        </button>
                        <button
                          onClick={() => handleRemoveAdmin(a.username)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                        >
                          ✕ 删除 / Remove
                        </button>
                      </div>
                    )}
                  </div>
                  {editingEmailUser === a.username && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="email"
                        value={editEmailValue}
                        onChange={(e) => setEditEmailValue(e.target.value)}
                        placeholder="email@example.com"
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[var(--school-red)]"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateEmail(a.username)}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingEmailUser(null); setEditEmailValue(""); setEmailUpdateMsg(""); }}
                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-semibold rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {adminResetUser === a.username && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded space-y-2">
                      <p className="text-xs text-gray-600">
                        DE: Verifizierungscode an die E-Mail von <strong>{a.username}</strong> senden, damit dieser Admin sein Passwort zurücksetzen kann.<br />
                        EN: Send a verification code to <strong>{a.username}</strong>&apos;s email so they can reset their password.<br />
                        ZH: 向 <strong>{a.username}</strong> 的邮箱发送验证码，以便其重置密码。
                      </p>
                      {adminResetMsg && (
                        <p className={`text-xs ${adminResetMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                          {adminResetMsg}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={adminResetLoading}
                          onClick={() => handleAdminResetPassword(a.username)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded transition-colors"
                        >
                          {adminResetLoading ? "⏳ …" : "发送验证码 / Send Code / Code senden"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAdminResetUser(null); setAdminResetMsg(""); }}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-semibold rounded transition-colors"
                        >
                          取消 / Cancel / Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {removeAdminMsg && (
              <p className={`mt-2 text-xs ${removeAdminMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{removeAdminMsg}</p>
            )}
            {emailUpdateMsg && (
              <p className={`mt-2 text-xs ${emailUpdateMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{emailUpdateMsg}</p>
            )}
          </div>

          {/* Add new admin */}
          {!showAddAdmin ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddAdmin(true)}
                className="text-sm text-[var(--school-red)] underline"
              >
                + 添加管理员 / Add administrator / Administrator hinzufügen
              </button>
              <HelpIcon text="Create a new admin account with username, password, and optional email / 创建新管理员" />
            </div>
          ) : (
            <form onSubmit={handleAddAdmin} className="max-w-sm space-y-3 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-[var(--school-dark)]">
                添加新管理员 / Add New Administrator / Neuen Admin hinzufügen
              </h4>
              <Field
                label="用户名 / Username / Benutzername（至少4个字符 / min 4 chars）"
                value={newAdminUser}
                onChange={setNewAdminUser}
              />
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  密码 / Password / Passwort（至少6位 / min 6 chars）
                </label>
                <div className="relative">
                  <input
                    type={showNewAdminPw ? "text" : "password"}
                    autoComplete="new-password"
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[var(--school-red)]"
                    value={newAdminPw}
                    onChange={(e) => setNewAdminPw(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewAdminPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    title={showNewAdminPw ? "隐藏密码 / Hide password" : "显示密码 / Show password"}
                  >
                    {showNewAdminPw ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <Field
                label="确认密码 / Confirm Password / Passwort bestätigen"
                value={newAdminPwConfirm}
                onChange={setNewAdminPwConfirm}
                type={showNewAdminPw ? "text" : "password"}
                autoComplete="new-password"
              />
              <Field
                label="邮箱（用于密码重置）/ Email (for password reset) / E-Mail (für Passwort-Reset)"
                value={newAdminEmail}
                onChange={setNewAdminEmail}
                type="email"
              />
              {addAdminMsg && (
                <p className={`text-xs ${addAdminSuccess ? "text-green-600" : "text-red-600"}`}>
                  {addAdminMsg}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] text-white text-sm font-semibold rounded transition-colors"
                >
                  添加 / Add / Hinzufügen
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddAdmin(false); setAddAdminMsg(""); setNewAdminUser(""); setNewAdminPw(""); setNewAdminPwConfirm(""); setNewAdminEmail(""); }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded transition-colors"
                >
                  取消 / Cancel / Abbrechen
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        {/* Save button (bottom) */}
        <div className="sticky bottom-6 flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-lg shadow-lg transition-colors text-base"
          >
            {saving ? "⏳ Speichern…" : saved ? "✓ Gespeichert! / Saved! / 已保存！" : "💾 Speichern / Save / 保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
