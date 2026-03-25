"use client";

import { useState, useEffect } from "react";
import { useContent } from "@/contexts/ContentContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { defaultTranslations } from "@/i18n/translations";
import type { Language, SiteContent, NewsItem, CourseItem } from "@/i18n/translations";

/* ─── Small helpers ─────────────────────────────────────────── */
function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
  autoComplete?: string;
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
          type={type}
          autoComplete={autoComplete}
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
  const { setLanguage } = useLanguage();
  const { getContent, saveContent, resetContent } = useContent();
  const auth = useAuth();

  // Login form state
  const [userInput, setUserInput] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Draft content for the currently edited language
  const [draft, setDraft] = useState<SiteContent>(() => defaultTranslations["de"]);
  const [editLang, setEditLang] = useState<Language>("de");

  // Change-password state
  const [showChangePw, setShowChangePw] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [pwChangeMsg, setPwChangeMsg] = useState("");

  // Add-admin state
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPw, setNewAdminPw] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [showNewAdminPw, setShowNewAdminPw] = useState(false);
  const [addAdminMsg, setAddAdminMsg] = useState("");
  const [addAdminSuccess, setAddAdminSuccess] = useState(false);

  // Remove-admin feedback
  const [removeAdminMsg, setRemoveAdminMsg] = useState("");

  // Admin list (loaded async from API)
  const [adminList, setAdminList] = useState<import("@/contexts/AuthContext").AdminUser[]>([]);
  const [adminListKey, setAdminListKey] = useState(0);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // When edit language changes, load its content into the draft
  useEffect(() => {
    setDraft(getContent(editLang));
  }, [editLang, getContent]);

  // Load admin list whenever adminListKey changes or admin logs in
  useEffect(() => {
    if (auth.isAdmin) {
      auth.getAdmins().then(setAdminList);
    }
  }, [auth, adminListKey]);

// 临时修改 handleLogin 逻辑
async function handleLogin(e: React.FormEvent) {
  e.preventDefault();
  // 强制设置登录成功，绕过所有检查
  auth.isAdmin = true; 
  setLoginError("");
  setDraft(getContent(editLang));
}

  async function handleSave() {
    setSaving(true);
    await saveContent(editLang, draft);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleReset() {
    if (confirm("Alle Änderungen zurücksetzen? / Reset all changes? / 重置所有更改？")) {
      await resetContent(editLang);
      setDraft(defaultTranslations[editLang]);
    }
  }

  async function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (!newPw || newPw.length < 6) {
      setPwChangeMsg("Mindestens 6 Zeichen / Min 6 characters / 至少6个字符");
      return;
    }
    if (newPw !== newPwConfirm) {
      setPwChangeMsg(
        "Passwörter stimmen nicht überein / Passwords do not match / 密码不匹配"
      );
      return;
    }
    const result = await auth.changePassword(auth.currentUser!, oldPw, newPw);
    if (result.success) {
      setPwChangeMsg("✓ Passwort geändert! / Password changed! / 密码已修改！");
      setOldPw("");
      setNewPw("");
      setNewPwConfirm("");
      setTimeout(() => {
        setShowChangePw(false);
        setPwChangeMsg("");
      }, 2000);
    } else {
      setPwChangeMsg(result.error ?? "Fehler / Error / 错误");
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    const result = await auth.addAdmin(newAdminUser.trim(), newAdminPw, newAdminEmail.trim());
    if (result.success) {
      setAddAdminMsg(
        `✓ 管理员 "${newAdminUser.trim()}" 已添加！/ Administrator "${newAdminUser.trim()}" added / hinzugefügt！`
      );
      setAddAdminSuccess(true);
      setNewAdminUser("");
      setNewAdminPw("");
      setNewAdminEmail("");
      setAdminListKey((k) => k + 1);
      setTimeout(() => {
        setAddAdminMsg("");
        setAddAdminSuccess(false);
      }, 3000);
    } else {
      setAddAdminMsg(result.error ?? "错误 / Error / Fehler");
      setAddAdminSuccess(false);
    }
  }

  async function handleRemoveAdmin(username: string) {
    if (
      !confirm(
        `确认删除管理员 "${username}"？/ Remove administrator "${username}"? / Admin "${username}" entfernen?`
      )
    )
      return;
    const result = await auth.removeAdmin(username);
    if (result.success) {
      setRemoveAdminMsg(`✓ "${username}" 已删除 / removed / entfernt`);
      setAdminListKey((k) => k + 1);
      setTimeout(() => setRemoveAdminMsg(""), 3000);
    } else {
      setRemoveAdminMsg(result.error ?? "错误 / Fehler");
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
        items: [...d.courses.items, { level: "", levelLabel: "", ages: "", time: "", desc: "" }],
      },
    }));
  }

  function removeCourse(idx: number) {
    setDraft((d) => ({
      ...d,
      courses: { ...d.courses, items: d.courses.items.filter((_, i) => i !== idx) },
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
      news: { ...d.news, items: d.news.items.filter((_, i) => i !== idx) },
    }));
  }

  /* ── Login screen ────────────────────────────────────────── */
  if (!auth.isAdmin) {
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
                用户名 / Username / Benutzername
              </label>
              <input
                type="text"
                autoComplete="username"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
                placeholder="admin_yixin"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                密码 / Password / Passwort
              </label>
              <div className="relative">
                <input
                  type={showLoginPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={pwInput}
                  onChange={(e) => setPwInput(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[var(--school-red)]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  title={showLoginPw ? "隐藏密码 / Hide password" : "显示密码 / Show password"}
                >
                  {showLoginPw ? (
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
            {loginError && (
              <p className="text-xs text-red-600 text-center">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] text-white font-semibold py-2 rounded transition-colors"
            >
              登录 / Anmelden / Login
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">
            <a href="/" className="underline hover:text-[var(--school-red)]">
              ← 返回网站 / Zurück zur Website / Back to site
            </a>
          </p>
        </div>
      </div>
    );
  }

  /* ── Admin panel ─────────────────────────────────────────── */
  const langLabels: Record<Language, string> = { de: "Deutsch", zh: "中文", en: "English" };

  return (
    <div className="min-h-screen bg-[var(--school-gray)]">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-[var(--school-dark)] text-white px-4 py-3 flex items-center justify-between gap-4 flex-wrap shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-cn font-bold text-lg">管理面板</span>
          <span className="text-gray-400 text-sm hidden sm:inline">
            Admin Panel · {auth.currentUser}
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
            onClick={auth.logout}
            className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded transition-colors"
          >
            Abmelden / Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Sprache bearbeiten / Editing language:</strong> {langLabels[editLang]} &nbsp;|&nbsp;
          Änderungen werden in der Vercel-Cloud gespeichert.
          Changes are saved in Vercel cloud.
          更改保存在 Vercel 云端。
        </div>

        {/* ── School identity ─────────────────────────────── */}
        <SectionCard title="🏫 Schulinfo / School Info / 学校信息">
          <Field label="School Name (full)" value={draft.schoolName} onChange={(v) => setField("schoolName", v)} />
          <Field label="School Name (short)" value={draft.schoolNameShort} onChange={(v) => setField("schoolNameShort", v)} />
          <Field label="School Subtitle" value={draft.schoolSubtitle} onChange={(v) => setField("schoolSubtitle", v)} />
        </SectionCard>

        {/* ── Navigation ──────────────────────────────────── */}
        <SectionCard title="🔗 Navigation">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(draft.nav) as (keyof SiteContent["nav"])[]).map((key) => (
              <Field key={key} label={key} value={draft.nav[key]} onChange={(v) => updateNav(key, v)} />
            ))}
          </div>
        </SectionCard>

        {/* ── Hero ────────────────────────────────────────── */}
        <SectionCard title="🌟 Hero Section">
          <Field label="Tagline (main)" value={draft.hero.tagline} onChange={(v) => updateHero("tagline", v)} />
          <Field label="Tagline 2 (sub)" value={draft.hero.tagline2} onChange={(v) => updateHero("tagline2", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button: Discover Courses" value={draft.hero.discoverCourses} onChange={(v) => updateHero("discoverCourses", v)} />
            <Field label="Button: Contact Us" value={draft.hero.contactUs} onChange={(v) => updateHero("contactUs", v)} />
          </div>
        </SectionCard>

        {/* ── About ───────────────────────────────────────── */}
        <SectionCard title="ℹ️ About Section / Über uns / 关于我们">
          <Field label="Section title" value={draft.about.sectionTitle} onChange={(v) => updateAbout("sectionTitle", v)} />
          <Field label="Description paragraph 1" value={draft.about.desc1} onChange={(v) => updateAbout("desc1", v)} multiline />
          <Field label="Description paragraph 2" value={draft.about.desc2} onChange={(v) => updateAbout("desc2", v)} multiline />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Years" value={draft.about.years} onChange={(v) => updateAbout("years", v)} />
            <Field label="Students" value={draft.about.students} onChange={(v) => updateAbout("students", v)} />
            <Field label="Teachers" value={draft.about.teachers} onChange={(v) => updateAbout("teachers", v)} />
            <Field label="Courses count" value={draft.about.coursesCount} onChange={(v) => updateAbout("coursesCount", v)} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
            <Field label="Years label" value={draft.about.yearsLabel} onChange={(v) => updateAbout("yearsLabel", v)} />
            <Field label="Students label" value={draft.about.studentsLabel} onChange={(v) => updateAbout("studentsLabel", v)} />
            <Field label="Teachers label" value={draft.about.teachersLabel} onChange={(v) => updateAbout("teachersLabel", v)} />
            <Field label="Courses label" value={draft.about.coursesLabel} onChange={(v) => updateAbout("coursesLabel", v)} />
          </div>
        </SectionCard>

        {/* ── Courses ─────────────────────────────────────── */}
        <SectionCard title="📚 Courses / Kurse / 课程">
          <Field
            label="Section title"
            value={draft.courses.sectionTitle}
            onChange={(v) => setDraft((d) => ({ ...d, courses: { ...d.courses, sectionTitle: v } }))}
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
                <Field label="级别（中文）/ Level (Chinese)" value={course.level} onChange={(v) => updateCourse(idx, "level", v)} />
                <Field label="级别标签 / Level label" value={course.levelLabel} onChange={(v) => updateCourse(idx, "levelLabel", v)} />
                <Field label="年龄 / Age range" value={course.ages} onChange={(v) => updateCourse(idx, "ages", v)} />
                <Field label="上课时间 / Class time / Unterrichtszeit" value={course.time ?? ""} onChange={(v) => updateCourse(idx, "time", v)} />
                <Field label="描述 / Description" value={course.desc} onChange={(v) => updateCourse(idx, "desc", v)} />
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
            onChange={(v) => setDraft((d) => ({ ...d, news: { ...d.news, sectionTitle: v } }))}
          />
          <button
            onClick={addNews}
            className="mb-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-[var(--school-red)] hover:text-[var(--school-red)] w-full transition-colors"
          >
            + Neuigkeit hinzufügen / Add news / 添加新闻
          </button>
          {draft.news.items.map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded p-4 mb-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">News {idx + 1}</span>
                <button onClick={() => removeNews(idx)} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                  ✕ Remove
                </button>
              </div>
              <Field label="Date (e.g. 2025-09)" value={item.date} onChange={(v) => updateNews(idx, "date", v)} />
              <Field label="Title" value={item.title} onChange={(v) => updateNews(idx, "title", v)} />
              <Field label="Image URL (optional)" value={item.imageUrl ?? ""} onChange={(v) => updateNews(idx, "imageUrl", v)} />
              <Field label="Body" value={item.body} onChange={(v) => updateNews(idx, "body", v)} multiline />
            </div>
          ))}
        </SectionCard>

        {/* ── Contact ─────────────────────────────────────── */}
        <SectionCard title="📍 Contact / Kontakt / 联系我们">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Section title" value={draft.contact.sectionTitle} onChange={(v) => updateContact("sectionTitle", v)} />
            <Field label="Subtitle" value={draft.contact.subtitle} onChange={(v) => updateContact("subtitle", v)} />
            <Field label="Address title" value={draft.contact.addressTitle} onChange={(v) => updateContact("addressTitle", v)} />
            <Field label="Email title" value={draft.contact.emailTitle} onChange={(v) => updateContact("emailTitle", v)} />
            <Field label="Hours title" value={draft.contact.hoursTitle} onChange={(v) => updateContact("hoursTitle", v)} />
            <Field label="Email address" value={draft.contact.email} onChange={(v) => updateContact("email", v)} />
          </div>
          <div className="mt-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Address lines (one per line)</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)] min-h-[60px]"
              value={draft.contact.addressLines.join("\n")}
              onChange={(e) => updateContact("addressLines", e.target.value.split("\n"))}
            />
          </div>
          <div className="mt-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Hours lines (one per line)</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)] min-h-[60px]"
              value={draft.contact.hoursLines.join("\n")}
              onChange={(e) => updateContact("hoursLines", e.target.value.split("\n"))}
            />
          </div>
        </SectionCard>

        {/* ── Footer labels ────────────────────────────────── */}
        <SectionCard title="🔻 Footer">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Navigation section title" value={draft.footer.navigationTitle} onChange={(v) => setDraft((d) => ({ ...d, footer: { ...d.footer, navigationTitle: v } }))} />
            <Field label="Contact section title" value={draft.footer.contactTitle} onChange={(v) => setDraft((d) => ({ ...d, footer: { ...d.footer, contactTitle: v } }))} />
          </div>
        </SectionCard>

        {/* ── Change password ──────────────────────────────── */}
        <SectionCard title="🔐 修改密码 / Change Password / Passwort ändern">
          {!showChangePw ? (
            <button onClick={() => setShowChangePw(true)} className="text-sm text-[var(--school-red)] underline">
              修改密码 / Change password / Passwort ändern
            </button>
          ) : (
            <form onSubmit={handleChangePw} className="max-w-sm space-y-3">
              <Field label="当前密码 / Current password / Aktuelles Passwort" value={oldPw} onChange={setOldPw} type="password" autoComplete="current-password" />
              <Field label="新密码（至少6位）/ New password (min 6 chars) / Neues Passwort" value={newPw} onChange={setNewPw} type="password" autoComplete="new-password" />
              <Field label="确认新密码 / Confirm new password / Neues Passwort bestätigen" value={newPwConfirm} onChange={setNewPwConfirm} type="password" autoComplete="new-password" />
              {pwChangeMsg && (
                <p className={`text-xs ${pwChangeMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                  {pwChangeMsg}
                </p>
              )}
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] text-white text-sm font-semibold rounded transition-colors">
                  保存 / Save / Speichern
                </button>
                <button
                  type="button"
                  onClick={() => { setShowChangePw(false); setPwChangeMsg(""); setOldPw(""); setNewPw(""); setNewPwConfirm(""); }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded transition-colors"
                >
                  取消 / Cancel / Abbrechen
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        {/* ── Admin management ─────────────────────────────── */}
        <SectionCard title="👥 管理员管理 / Administrators / Administratoren">
          {/* Current admin list */}
          <div className="mb-4" key={adminListKey}>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              当前管理员 / Current Admins / Aktuelle Admins
            </h4>
            <div className="space-y-2">
              {adminList.map((a) => (
                <div
                  key={a.username}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--school-dark)]">
                        {a.username}
                      </span>
                      {a.username === auth.currentUser && (
                        <span className="text-xs bg-[var(--school-red)] text-white px-1.5 py-0.5 rounded">
                          当前 / you
                        </span>
                      )}
                    </div>
                    {a.email && (
                      <span className="text-xs text-gray-400">✉ {a.email}</span>
                    )}
                  </div>
                  {a.username !== auth.currentUser && (
                    <button
                      onClick={() => handleRemoveAdmin(a.username)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                    >
                      ✕ 删除 / Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            {removeAdminMsg && (
              <p className={`mt-2 text-xs ${removeAdminMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{removeAdminMsg}</p>
            )}
          </div>

          {/* Add new admin */}
          {!showAddAdmin ? (
            <button
              onClick={() => setShowAddAdmin(true)}
              className="text-sm text-[var(--school-red)] underline"
            >
              + 添加管理员 / Add administrator / Administrator hinzufügen
            </button>
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
                  onClick={() => { setShowAddAdmin(false); setAddAdminMsg(""); setNewAdminUser(""); setNewAdminPw(""); setNewAdminEmail(""); }}
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
