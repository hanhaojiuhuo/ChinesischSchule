"use client";

import { useState, useEffect } from "react";
import { useContent } from "@/contexts/ContentContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { defaultTranslations } from "@/i18n/translations";
import type { Language, SiteContent, NewsItem, CourseItem } from "@/i18n/translations";

// Default admin password — stored in localStorage so the admin can change it.
const DEFAULT_ADMIN_PASSWORD = "admin123";
const ADMIN_PW_KEY = "yixin-admin-password";

function getStoredPassword(): string {
  try {
    return localStorage.getItem(ADMIN_PW_KEY) ?? DEFAULT_ADMIN_PASSWORD;
  } catch {
    return DEFAULT_ADMIN_PASSWORD;
  }
}

/* ─── Small helpers ─────────────────────────────────────────── */
function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {multiline ? (
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)] resize-y min-h-[80px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 mb-6 bg-white shadow-sm">
      <h3 className="font-bold text-[var(--school-dark)] text-base mb-4 pb-2 border-b border-gray-100">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ─── Admin Page ────────────────────────────────────────────── */
export default function AdminPage() {
  const { language, setLanguage } = useLanguage();
  const { getContent, saveContent, resetContent } = useContent();

  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");

  // Draft content for the currently edited language
  const [draft, setDraft] = useState<SiteContent>(() => defaultTranslations["de"]);
  const [editLang, setEditLang] = useState<Language>("de");

  // Change-password state
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [pwChangeMsg, setPwChangeMsg] = useState("");

  const [saved, setSaved] = useState(false);

  // When edit language changes, load its content into the draft
  useEffect(() => {
    setDraft(getContent(editLang));
  }, [editLang, getContent]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pwInput === getStoredPassword()) {
      setAuthed(true);
      setPwError("");
      setDraft(getContent(editLang));
    } else {
      setPwError("Falsches Passwort / Wrong password / 密码错误");
    }
  }

  function handleSave() {
    saveContent(editLang, draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    if (confirm("Alle Änderungen zurücksetzen? / Reset all changes? / 重置所有更改？")) {
      resetContent(editLang);
      setDraft(defaultTranslations[editLang]);
    }
  }

  function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (!newPw || newPw.length < 6) {
      setPwChangeMsg("Mindestens 6 Zeichen / Min 6 characters / 至少6个字符");
      return;
    }
    if (newPw !== newPwConfirm) {
      setPwChangeMsg("Passwörter stimmen nicht überein / Passwords do not match / 密码不匹配");
      return;
    }
    try {
      localStorage.setItem(ADMIN_PW_KEY, newPw);
      setPwChangeMsg("Passwort geändert! / Password changed! / 密码已修改！");
      setNewPw("");
      setNewPwConfirm("");
      setShowChangePw(false);
    } catch {
      setPwChangeMsg("Fehler / Error / 错误");
    }
  }

  // Helpers to update nested draft fields
  function setField<K extends keyof SiteContent>(section: K, value: SiteContent[K]) {
    setDraft((d) => ({ ...d, [section]: value }));
  }

  function updateAbout(key: keyof SiteContent["about"], val: string) {
    setDraft((d) => ({ ...d, about: { ...d.about, [key]: val } }));
  }

  function updateHero(key: keyof SiteContent["hero"], val: string) {
    setDraft((d) => ({ ...d, hero: { ...d.hero, [key]: val } }));
  }

  function updateNav(key: keyof SiteContent["nav"], val: string) {
    setDraft((d) => ({ ...d, nav: { ...d.nav, [key]: val } }));
  }

  function updateContact(key: keyof SiteContent["contact"], val: string | string[]) {
    setDraft((d) => ({ ...d, contact: { ...d.contact, [key]: val } }));
  }

  function updateCourse(idx: number, key: keyof CourseItem, val: string) {
    setDraft((d) => {
      const items = d.courses.items.map((item, i) =>
        i === idx ? { ...item, [key]: val } : item
      );
      return { ...d, courses: { ...d.courses, items } };
    });
  }

  function addCourse() {
    setDraft((d) => ({
      ...d,
      courses: {
        ...d.courses,
        items: [
          ...d.courses.items,
          { level: "", levelLabel: "", ages: "", desc: "" },
        ],
      },
    }));
  }

  function removeCourse(idx: number) {
    setDraft((d) => ({
      ...d,
      courses: {
        ...d.courses,
        items: d.courses.items.filter((_, i) => i !== idx),
      },
    }));
  }

  function updateNews(idx: number, key: keyof NewsItem, val: string) {
    setDraft((d) => {
      const items = d.news.items.map((item, i) =>
        i === idx ? { ...item, [key]: val } : item
      );
      return { ...d, news: { ...d.news, items } };
    });
  }

  function addNews() {
    setDraft((d) => ({
      ...d,
      news: {
        ...d.news,
        items: [{ date: "", title: "", body: "" }, ...d.news.items],
      },
    }));
  }

  function removeNews(idx: number) {
    setDraft((d) => ({
      ...d,
      news: {
        ...d.news,
        items: d.news.items.filter((_, i) => i !== idx),
      },
    }));
  }

  /* ── Login screen ────────────────────────────────────────── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-[var(--school-gray)] flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
          <h1 className="font-cn text-2xl font-bold text-[var(--school-dark)] mb-1 text-center">
            管理员登录
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            Administrator Login · Admin-Anmeldung
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Passwort / Password / 密码
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={pwInput}
                onChange={(e) => setPwInput(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
                placeholder="••••••••"
              />
            </div>
            {pwError && (
              <p className="text-xs text-red-600 text-center">{pwError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] text-white font-semibold py-2 rounded transition-colors"
            >
              Anmelden / Login / 登录
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">
            <a href="/" className="underline hover:text-[var(--school-red)]">
              ← Zurück zur Website / Back to site / 返回网站
            </a>
          </p>
        </div>
      </div>
    );
  }

  /* ── Admin panel ─────────────────────────────────────────── */
  const langLabels: Record<Language, string> = {
    de: "Deutsch",
    zh: "中文",
    en: "English",
  };

  return (
    <div className="min-h-screen bg-[var(--school-gray)]">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-[var(--school-dark)] text-white px-4 py-3 flex items-center justify-between gap-4 flex-wrap shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-cn font-bold text-lg">管理面板</span>
          <span className="text-gray-400 text-sm hidden sm:inline">Admin Panel · Verwaltung</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Language selector for editing */}
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
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors"
          >
            {saved ? "✓ Gespeichert!" : "Speichern / Save / 保存"}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded transition-colors"
          >
            Zurücksetzen / Reset
          </button>
          <button
            onClick={() => {
              setLanguage(editLang);
              window.location.href = "/";
            }}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
          >
            ← Zur Website / Website
          </button>
          <button
            onClick={() => setAuthed(false)}
            className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded transition-colors"
          >
            Abmelden / Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Sprache bearbeiten / Editing language:</strong> {langLabels[editLang]} &nbsp;|&nbsp;
          Änderungen werden im Browser gespeichert und sofort auf der Website sichtbar.
          Changes are saved in the browser and immediately visible on the website.
          更改保存在浏览器中，立即在网站上可见。
        </div>

        {/* ── School identity ─────────────────────────────── */}
        <SectionCard title="🏫 Schulinfo / School Info / 学校信息">
          <Field
            label="School Name (full) / Schulname / 学校全名"
            value={draft.schoolName}
            onChange={(v) => setField("schoolName", v)}
          />
          <Field
            label="School Name (short) / Kurzname / 学校简称"
            value={draft.schoolNameShort}
            onChange={(v) => setField("schoolNameShort", v)}
          />
          <Field
            label="School Subtitle (secondary name) / Untertitel / 副标题"
            value={draft.schoolSubtitle}
            onChange={(v) => setField("schoolSubtitle", v)}
          />
        </SectionCard>

        {/* ── Navigation ──────────────────────────────────── */}
        <SectionCard title="🔗 Navigation">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(draft.nav) as (keyof SiteContent["nav"])[]).map((key) => (
              <Field
                key={key}
                label={key}
                value={draft.nav[key]}
                onChange={(v) => updateNav(key, v)}
              />
            ))}
          </div>
        </SectionCard>

        {/* ── Hero ────────────────────────────────────────── */}
        <SectionCard title="🌟 Hero Section">
          <Field
            label="Tagline (main)"
            value={draft.hero.tagline}
            onChange={(v) => updateHero("tagline", v)}
          />
          <Field
            label="Tagline 2 (sub)"
            value={draft.hero.tagline2}
            onChange={(v) => updateHero("tagline2", v)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Button: Discover Courses"
              value={draft.hero.discoverCourses}
              onChange={(v) => updateHero("discoverCourses", v)}
            />
            <Field
              label="Button: Contact Us"
              value={draft.hero.contactUs}
              onChange={(v) => updateHero("contactUs", v)}
            />
          </div>
        </SectionCard>

        {/* ── About ───────────────────────────────────────── */}
        <SectionCard title="ℹ️ About Section / Über uns / 关于我们">
          <Field
            label="Section title"
            value={draft.about.sectionTitle}
            onChange={(v) => updateAbout("sectionTitle", v)}
          />
          <Field
            label="Description paragraph 1"
            value={draft.about.desc1}
            onChange={(v) => updateAbout("desc1", v)}
            multiline
          />
          <Field
            label="Description paragraph 2"
            value={draft.about.desc2}
            onChange={(v) => updateAbout("desc2", v)}
            multiline
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field
              label={`Years (${draft.about.yearsLabel})`}
              value={draft.about.years}
              onChange={(v) => updateAbout("years", v)}
            />
            <Field
              label={`Students (${draft.about.studentsLabel})`}
              value={draft.about.students}
              onChange={(v) => updateAbout("students", v)}
            />
            <Field
              label={`Teachers (${draft.about.teachersLabel})`}
              value={draft.about.teachers}
              onChange={(v) => updateAbout("teachers", v)}
            />
            <Field
              label={`Courses (${draft.about.coursesLabel})`}
              value={draft.about.coursesCount}
              onChange={(v) => updateAbout("coursesCount", v)}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
            <Field
              label="Years label"
              value={draft.about.yearsLabel}
              onChange={(v) => updateAbout("yearsLabel", v)}
            />
            <Field
              label="Students label"
              value={draft.about.studentsLabel}
              onChange={(v) => updateAbout("studentsLabel", v)}
            />
            <Field
              label="Teachers label"
              value={draft.about.teachersLabel}
              onChange={(v) => updateAbout("teachersLabel", v)}
            />
            <Field
              label="Courses label"
              value={draft.about.coursesLabel}
              onChange={(v) => updateAbout("coursesLabel", v)}
            />
          </div>
        </SectionCard>

        {/* ── Courses ─────────────────────────────────────── */}
        <SectionCard title="📚 Courses / Kurse / 课程">
          <Field
            label="Section title"
            value={draft.courses.sectionTitle}
            onChange={(v) =>
              setDraft((d) => ({ ...d, courses: { ...d.courses, sectionTitle: v } }))
            }
          />
          {draft.courses.items.map((course, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded p-4 mb-3 bg-gray-50 relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Course {idx + 1}
                </span>
                <button
                  onClick={() => removeCourse(idx)}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
                  title="Remove course"
                >
                  ✕ Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Level (Chinese, e.g. 初级班)"
                  value={course.level}
                  onChange={(v) => updateCourse(idx, "level", v)}
                />
                <Field
                  label="Level label (e.g. Anfänger)"
                  value={course.levelLabel}
                  onChange={(v) => updateCourse(idx, "levelLabel", v)}
                />
                <Field
                  label="Age range"
                  value={course.ages}
                  onChange={(v) => updateCourse(idx, "ages", v)}
                />
                <Field
                  label="Description"
                  value={course.desc}
                  onChange={(v) => updateCourse(idx, "desc", v)}
                />
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
        <SectionCard title="📰 News / Aktuelles / 学校新闻">
          <Field
            label="Section title"
            value={draft.news.sectionTitle}
            onChange={(v) =>
              setDraft((d) => ({ ...d, news: { ...d.news, sectionTitle: v } }))
            }
          />
          <button
            onClick={addNews}
            className="mb-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-[var(--school-red)] hover:text-[var(--school-red)] w-full transition-colors"
          >
            + Neuigkeit hinzufügen / Add news / 添加新闻
          </button>
          {draft.news.items.map((item, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded p-4 mb-3 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  News {idx + 1}
                </span>
                <button
                  onClick={() => removeNews(idx)}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
                >
                  ✕ Remove
                </button>
              </div>
              <Field
                label="Date (e.g. 2025-09)"
                value={item.date}
                onChange={(v) => updateNews(idx, "date", v)}
              />
              <Field
                label="Title"
                value={item.title}
                onChange={(v) => updateNews(idx, "title", v)}
              />
              <Field
                label="Body"
                value={item.body}
                onChange={(v) => updateNews(idx, "body", v)}
                multiline
              />
            </div>
          ))}
        </SectionCard>

        {/* ── Contact ─────────────────────────────────────── */}
        <SectionCard title="📍 Contact / Kontakt / 联系我们">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Section title"
              value={draft.contact.sectionTitle}
              onChange={(v) => updateContact("sectionTitle", v)}
            />
            <Field
              label="Subtitle"
              value={draft.contact.subtitle}
              onChange={(v) => updateContact("subtitle", v)}
            />
            <Field
              label="Address title"
              value={draft.contact.addressTitle}
              onChange={(v) => updateContact("addressTitle", v)}
            />
            <Field
              label="Email title"
              value={draft.contact.emailTitle}
              onChange={(v) => updateContact("emailTitle", v)}
            />
            <Field
              label="Hours title"
              value={draft.contact.hoursTitle}
              onChange={(v) => updateContact("hoursTitle", v)}
            />
            <Field
              label="Email address"
              value={draft.contact.email}
              onChange={(v) => updateContact("email", v)}
            />
          </div>
          <div className="mt-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Address lines (one per line)
            </label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)] min-h-[60px]"
              value={draft.contact.addressLines.join("\n")}
              onChange={(e) =>
                updateContact("addressLines", e.target.value.split("\n"))
              }
            />
          </div>
          <div className="mt-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Hours lines (one per line)
            </label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)] min-h-[60px]"
              value={draft.contact.hoursLines.join("\n")}
              onChange={(e) =>
                updateContact("hoursLines", e.target.value.split("\n"))
              }
            />
          </div>
        </SectionCard>

        {/* ── Footer labels ────────────────────────────────── */}
        <SectionCard title="🔻 Footer">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Navigation section title"
              value={draft.footer.navigationTitle}
              onChange={(v) =>
                setDraft((d) => ({ ...d, footer: { ...d.footer, navigationTitle: v } }))
              }
            />
            <Field
              label="Contact section title"
              value={draft.footer.contactTitle}
              onChange={(v) =>
                setDraft((d) => ({ ...d, footer: { ...d.footer, contactTitle: v } }))
              }
            />
          </div>
        </SectionCard>

        {/* ── Change password ──────────────────────────────── */}
        <SectionCard title="🔐 Passwort ändern / Change Password / 修改密码">
          {!showChangePw ? (
            <button
              onClick={() => setShowChangePw(true)}
              className="text-sm text-[var(--school-red)] underline"
            >
              Passwort ändern / Change password / 修改密码
            </button>
          ) : (
            <form onSubmit={handleChangePw} className="max-w-sm space-y-3">
              <Field
                label="New password (min 6 chars)"
                value={newPw}
                onChange={setNewPw}
              />
              <Field
                label="Confirm new password"
                value={newPwConfirm}
                onChange={setNewPwConfirm}
              />
              {pwChangeMsg && (
                <p className="text-xs text-[var(--school-red)]">{pwChangeMsg}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] text-white text-sm font-semibold rounded transition-colors"
                >
                  Speichern / Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePw(false);
                    setPwChangeMsg("");
                    setNewPw("");
                    setNewPwConfirm("");
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded transition-colors"
                >
                  Abbrechen / Cancel
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        {/* Save button (bottom) */}
        <div className="sticky bottom-6 flex justify-center">
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-colors text-base"
          >
            {saved
              ? "✓ Gespeichert! / Saved! / 已保存！"
              : "💾 Speichern / Save / 保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
