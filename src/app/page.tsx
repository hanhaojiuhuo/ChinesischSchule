"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SchoolLogo from "@/components/SchoolLogo";
import { useContent } from "@/contexts/ContentContext";
import { useAuth } from "@/contexts/AuthContext";
import type { SiteContent, CourseItem, NewsItem, NewsTextBlock } from "@/i18n/translations";
import { getNewsBodyBlocks } from "@/i18n/translations";
import { defaultTranslations } from "@/i18n/translations";

/* ─── Inline editable helpers ──────────────────────────────── */
function EditField({
  value,
  onChange,
  className = "",
  placeholder = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${className} bg-amber-50/30 border-b-2 border-dashed border-amber-400 focus:outline-none focus:border-amber-500 focus:bg-amber-50/60 transition-colors`}
      placeholder={placeholder}
    />
  );
}

function EditArea({
  value,
  onChange,
  className = "",
  placeholder = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${className} w-full bg-amber-50/30 border-2 border-dashed border-amber-400 focus:outline-none focus:border-amber-500 focus:bg-amber-50/60 transition-colors resize-y min-h-[3em] rounded-sm`}
      placeholder={placeholder}
    />
  );
}

/* Block wrapper — amber outline in edit mode */
function EditBlock({
  label,
  children,
  onDelete,
  className = "",
}: {
  label?: string;
  children: React.ReactNode;
  onDelete?: () => void;
  className?: string;
}) {
  return (
    <div className={`relative ring-2 ring-amber-400 ring-offset-2 rounded-lg ${className}`}>
      {label && (
        <span className="absolute -top-3 left-3 z-10 text-xs bg-amber-400 text-amber-900 font-bold px-2 py-0.5 rounded select-none">
          ✏ {label}
        </span>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-3 right-3 z-10 text-xs bg-red-500 hover:bg-red-600 text-white font-bold px-2 py-0.5 rounded transition-colors"
          title="Delete this block"
        >
          ✕ Delete
        </button>
      )}
      {children}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function Home() {
  const { getContent, saveContent } = useContent();
  const { isAdmin, currentUser, logout } = useAuth();

  const [draftDe, setDraftDe] = useState<SiteContent>(() => defaultTranslations["de"]);
  const [draftZh, setDraftZh] = useState<SiteContent>(() => defaultTranslations["zh"]);
  const [draftEn, setDraftEn] = useState<SiteContent>(() => defaultTranslations["en"]);
  const [isDirty, setIsDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [courseOffset, setCourseOffset] = useState(0);
  const [newsPage, setNewsPage] = useState(0);
  const NEWS_PER_PAGE = 4;

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

  /* ── Save / Discard ──────────────────────────────────────── */
  async function handleSave() {
    await Promise.all([
      saveContent("de", draftDe),
      saveContent("zh", draftZh),
      saveContent("en", draftEn),
    ]);
    setIsDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleDiscard() {
    if (confirm("Discard all unsaved changes?\nAlle Änderungen verwerfen?\n放弃所有未保存的更改？")) {
      setDraftDe(getContent("de"));
      setDraftZh(getContent("zh"));
      setDraftEn(getContent("en"));
      setIsDirty(false);
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

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <>
      <Navbar />

      <main className={`flex-1${isAdmin ? " pb-20" : ""}`}>
        {/* ── Hero ───────────────────────────────────────────── */}
        <section
          id="home"
          className="relative overflow-hidden bg-[var(--school-dark)] text-white py-20 px-4"
        >
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 w-96 h-96 rounded-full border-4 border-white/5 pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full border-2 border-white/5 pointer-events-none"
          />

          <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center gap-10">
            <div className="flex-1 animate-fade-in-up">
              {isAdmin ? (
                <EditBlock label="School Name" className="p-3 space-y-2 bg-[var(--school-dark)] mb-3">
                  <div>
                    <label className="text-xs text-amber-300 font-semibold block mb-1">DE School Name</label>
                    <EditField
                      value={de.schoolName}
                      onChange={(v) => { setDraftDe((d) => ({ ...d, schoolName: v })); setIsDirty(true); }}
                      className="text-[var(--school-red)] font-semibold tracking-widest uppercase text-sm w-full"
                      placeholder="School name (DE)…"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-amber-300 font-semibold block mb-1">ZH School Name</label>
                    <EditField
                      value={zh.schoolName}
                      onChange={(v) => { setDraftZh((d) => ({ ...d, schoolName: v })); setIsDirty(true); }}
                      className="font-cn text-4xl sm:text-5xl font-bold text-white w-full"
                      placeholder="学校名称（中文）…"
                    />
                  </div>
                </EditBlock>
              ) : (
                <>
                  <p className="text-[var(--school-red)] font-semibold tracking-widest uppercase text-sm mb-2">
                    {de.schoolName}
                  </p>
                  <h1 className="font-cn text-4xl sm:text-5xl font-bold leading-tight mb-1">
                    {zh.schoolName}
                  </h1>
                  <p className="text-gray-400 text-sm mb-4">
                    {en.schoolName}
                  </p>
                </>
              )}

              {isAdmin ? (
                <EditBlock label="Hero Text" className="p-4 space-y-3 bg-[var(--school-dark)]">
                  <div>
                    <label className="text-xs text-amber-300 font-semibold block mb-1">DE Tagline</label>
                    <EditArea
                      value={de.hero.tagline}
                      onChange={(v) => updDe("hero", { tagline: v })}
                      className="text-gray-300 text-lg"
                      placeholder="German tagline…"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-amber-300 font-semibold block mb-1">ZH Tagline</label>
                    <EditArea
                      value={zh.hero.tagline}
                      onChange={(v) => updZh("hero", { tagline: v })}
                      className="font-cn text-gray-400 text-base"
                      placeholder="Chinese tagline…"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-amber-300 font-semibold block mb-1">DE Button: Discover Courses</label>
                      <EditField
                        value={de.hero.discoverCourses}
                        onChange={(v) => updDe("hero", { discoverCourses: v })}
                        className="text-white text-sm font-semibold w-full"
                        placeholder="Button text…"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-amber-300 font-semibold block mb-1">ZH Button: 查看课程</label>
                      <EditField
                        value={zh.hero.discoverCourses}
                        onChange={(v) => updZh("hero", { discoverCourses: v })}
                        className="font-cn text-white text-sm font-semibold w-full"
                        placeholder="按钮文字…"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-amber-300 font-semibold block mb-1">DE Button: Contact Us</label>
                      <EditField
                        value={de.hero.contactUs}
                        onChange={(v) => updDe("hero", { contactUs: v })}
                        className="text-white text-sm font-semibold w-full"
                        placeholder="Button text…"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-amber-300 font-semibold block mb-1">ZH Button: 联系我们</label>
                      <EditField
                        value={zh.hero.contactUs}
                        onChange={(v) => updZh("hero", { contactUs: v })}
                        className="font-cn text-white text-sm font-semibold w-full"
                        placeholder="按钮文字…"
                      />
                    </div>
                  </div>
                </EditBlock>
              ) : (
                <>
                  <p className="font-cn text-gray-300 text-lg mb-1 max-w-md">
                    {zh.hero.tagline}
                  </p>
                  <p className="text-gray-400 text-sm mb-1 max-w-md">
                    {de.hero.tagline}
                  </p>
                  <p className="text-gray-500 text-xs mb-6 max-w-md">
                    {en.hero.tagline}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="#courses"
                      className="px-5 py-3 bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] text-white font-semibold rounded transition-colors text-sm"
                    >
                      <span className="font-cn">{zh.hero.discoverCourses}</span>
                      <span className="mx-1 opacity-70">·</span>{de.hero.discoverCourses}
                      <span className="mx-1 opacity-70">·</span>{en.hero.discoverCourses}
                    </a>
                    <a
                      href="#contact"
                      className="px-5 py-3 border border-white/30 hover:border-white text-white font-semibold rounded transition-colors text-sm"
                    >
                      <span className="font-cn">{zh.hero.contactUs}</span>
                      <span className="mx-1 opacity-70">·</span>{de.hero.contactUs}
                      <span className="mx-1 opacity-70">·</span>{en.hero.contactUs}
                    </a>
                  </div>
                </>
              )}
            </div>

            <div className="flex-shrink-0">
              <div className="logo-circle bg-white p-4 shadow-2xl">
                <SchoolLogo size={200} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Courses ────────────────────────────────────────── */}
        <section id="courses" className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-8 h-1 bg-[var(--school-red)] rounded" />
              <h2 className="font-cn text-2xl font-bold text-[var(--school-dark)] flex items-center gap-2 flex-wrap">
                {isAdmin ? (
                  <>
                    <EditField
                      value={de.courses.sectionTitle}
                      onChange={(v) =>
                        setDraftDe((d) => ({ ...d, courses: { ...d.courses, sectionTitle: v } }))
                      }
                      className="text-2xl font-bold text-[var(--school-dark)]"
                      placeholder="DE title…"
                    />
                    <span className="text-lg font-normal text-gray-400">·</span>
                    <EditField
                      value={zh.courses.sectionTitle}
                      onChange={(v) =>
                        setDraftZh((d) => ({ ...d, courses: { ...d.courses, sectionTitle: v } }))
                      }
                      className="text-lg font-normal text-gray-400"
                      placeholder="ZH 标题…"
                    />
                  </>
                ) : (
                  <>
                    {zh.courses.sectionTitle}
                    <span className="text-lg font-normal text-gray-400 ml-2">· {de.courses.sectionTitle} · {en.courses.sectionTitle}</span>
                  </>
                )}
              </h2>
            </div>

            {isAdmin ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {de.courses.items.map((c, i) => {
                  const zhCourse = zh.courses.items[i];
                  return (
                    <EditBlock
                      key={i}
                      label={`Course ${i + 1}`}
                      onDelete={() => removeCourse(i)}
                      className="border-t-4 border-[var(--school-red)] bg-[var(--school-gray)] rounded-lg p-6"
                    >
                      <div className="space-y-2 pt-2">
                        <div>
                          <label className="text-xs text-amber-600 font-semibold block mb-0.5">级别名称（中文）/ Level name (Chinese)</label>
                          <EditField
                            value={c.level}
                            onChange={(v) => { updDeCourse(i, "level", v); updZhCourse(i, "level", v); }}
                            className="font-cn text-xl font-bold text-[var(--school-dark)] w-full"
                            placeholder="初级班…"
                          />
                        </div>
                        {zhCourse && (
                          <div>
                            <label className="text-xs text-amber-600 font-semibold block mb-0.5">中文级别标签 / ZH level label</label>
                            <EditField
                              value={zhCourse.levelLabel}
                              onChange={(v) => updZhCourse(i, "levelLabel", v)}
                              className="font-cn text-xs font-semibold text-[var(--school-red)] uppercase tracking-wide w-full"
                              placeholder="初级…"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-amber-600 font-semibold block mb-0.5">德文级别标签 / DE level label</label>
                          <EditField
                            value={c.levelLabel}
                            onChange={(v) => updDeCourse(i, "levelLabel", v)}
                            className="text-xs text-gray-400 w-full"
                            placeholder="Anfänger…"
                          />
                        </div>
                        {zhCourse && (
                          <div>
                            <label className="text-xs text-amber-600 font-semibold block mb-0.5">中文上课时间 / ZH class time</label>
                            <EditField
                              value={zhCourse.time ?? ""}
                              onChange={(v) => updZhCourse(i, "time", v)}
                              className="font-cn text-xs text-[var(--school-red)] font-semibold w-full"
                              placeholder="周六 09:00–10:30…"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-amber-600 font-semibold block mb-0.5">德文上课时间 / DE class time</label>
                          <EditField
                            value={c.time ?? ""}
                            onChange={(v) => updDeCourse(i, "time", v)}
                            className="text-xs text-gray-400 w-full"
                            placeholder="Sa. 09:00–10:30 Uhr…"
                          />
                        </div>
                        {zhCourse && (
                          <div>
                            <label className="text-xs text-amber-600 font-semibold block mb-0.5">中文年龄 / ZH ages</label>
                            <EditField
                              value={zhCourse.ages}
                              onChange={(v) => updZhCourse(i, "ages", v)}
                              className="font-cn text-xs text-gray-500 w-full"
                              placeholder="6–10岁…"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-amber-600 font-semibold block mb-0.5">德文年龄 / DE ages</label>
                          <EditField
                            value={c.ages}
                            onChange={(v) => updDeCourse(i, "ages", v)}
                            className="text-xs text-gray-500 w-full"
                            placeholder="6–10 Jahre…"
                          />
                        </div>
                        {zhCourse && (
                          <div>
                            <label className="text-xs text-amber-600 font-semibold block mb-0.5">中文描述 / ZH description</label>
                            <EditArea
                              value={zhCourse.desc}
                              onChange={(v) => updZhCourse(i, "desc", v)}
                              className="font-cn text-sm text-gray-600 leading-relaxed"
                              placeholder="中文描述…"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-amber-600 font-semibold block mb-0.5">德文描述 / DE description</label>
                          <EditArea
                            value={c.desc}
                            onChange={(v) => updDeCourse(i, "desc", v)}
                            className="text-xs text-gray-500 leading-relaxed"
                            placeholder="German description…"
                          />
                        </div>
                      </div>
                    </EditBlock>
                  );
                })}
              </div>
            ) : (
              <>
                {/* Ring-scrolling carousel: show VISIBLE courses, ring-wrap */}
                <div className="relative">
                  {de.courses.items.length > 4 && (
                    <button
                      onClick={() => setCourseOffset((o) => (o - 1 + de.courses.items.length) % de.courses.items.length)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center shadow hover:bg-[var(--school-gray)] transition-colors"
                      aria-label="Previous courses"
                    >
                      ◀
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden">
                    {Array.from({ length: Math.min(4, de.courses.items.length) }, (_, slot) => {
                      const i = (courseOffset + slot) % de.courses.items.length;
                      const c = de.courses.items[i];
                      const zhCourse = zh.courses.items[i];
                      const enCourse = en.courses.items[i];
                      return (
                        <div
                          key={`${courseOffset}-${slot}`}
                          className="border-t-4 border-[var(--school-red)] bg-[var(--school-gray)] rounded-lg p-6 hover:shadow-lg transition-shadow"
                        >
                          <div className="font-cn text-xl font-bold text-[var(--school-dark)] mb-1">
                            {c.level}
                          </div>
                          {zhCourse && (
                            <div className="font-cn text-xs font-semibold text-[var(--school-red)] uppercase tracking-wide mb-0.5">
                              {zhCourse.levelLabel}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mb-0.5">
                            {c.levelLabel}
                          </div>
                          {enCourse && (
                            <div className="text-xs text-gray-400 mb-3">
                              {enCourse.levelLabel}
                            </div>
                          )}
                          <div className="border-t border-gray-200 pt-3 mt-1">
                            {(c.time || (zhCourse && zhCourse.time)) && (
                              <div className="text-xs text-[var(--school-red)] font-semibold mb-2 flex items-center gap-1 flex-wrap">
                                <span>🕐</span>
                                {zhCourse?.time && <span className="font-cn">{zhCourse.time}</span>}
                                {zhCourse?.time && c.time && <span className="text-gray-400">·</span>}
                                {c.time && <span>{c.time}</span>}
                                {enCourse?.time && <span className="text-gray-400">·</span>}
                                {enCourse?.time && <span>{enCourse.time}</span>}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1 flex-wrap">
                              <span>👤</span>
                              {zhCourse && <span className="font-cn">{zhCourse.ages}</span>}
                              {zhCourse && <span className="text-gray-400">·</span>}
                              <span>{c.ages}</span>
                              {enCourse && <span className="text-gray-400">·</span>}
                              {enCourse && <span>{enCourse.ages}</span>}
                            </div>
                            {zhCourse && (
                              <p className="font-cn text-sm text-gray-600 leading-relaxed">{zhCourse.desc}</p>
                            )}
                            <p className="text-xs text-gray-500 leading-relaxed mt-1">{c.desc}</p>
                            {enCourse && (
                              <p className="text-xs text-gray-400 leading-relaxed mt-1">{enCourse.desc}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {de.courses.items.length > 4 && (
                    <button
                      onClick={() => setCourseOffset((o) => (o + 1) % de.courses.items.length)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center shadow hover:bg-[var(--school-gray)] transition-colors"
                      aria-label="Next courses"
                    >
                      ▶
                    </button>
                  )}
                </div>
                {/* Dot indicators */}
                {de.courses.items.length > 4 && (
                  <div className="flex justify-center gap-1.5 mt-4">
                    {Array.from({ length: de.courses.items.length }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCourseOffset(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === courseOffset ? "bg-[var(--school-red)]" : "bg-gray-300 hover:bg-gray-400"}`}
                        aria-label={`Go to course ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {isAdmin && (
              <button
                onClick={addCourse}
                className="mt-6 w-full px-4 py-3 border-2 border-dashed border-amber-400 rounded-lg text-amber-700 hover:border-amber-500 hover:bg-amber-50 font-semibold text-sm transition-colors"
              >
                + Add Course Block / Kurs hinzufügen / 添加课程
              </button>
            )}
          </div>
        </section>
        {/* ── News ───────────────────────────────────────────── */}
        <section id="news" className="py-16 px-4 bg-[var(--school-gray)]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-8 h-1 bg-[var(--school-red)] rounded" />
              <h2 className="font-cn text-2xl font-bold text-[var(--school-dark)] flex items-center gap-2 flex-wrap">
                {isAdmin ? (
                  <>
                    <EditField
                      value={de.news.sectionTitle}
                      onChange={(v) =>
                        setDraftDe((d) => ({ ...d, news: { ...d.news, sectionTitle: v } }))
                      }
                      className="text-2xl font-bold text-[var(--school-dark)]"
                      placeholder="DE title…"
                    />
                    <span className="text-lg font-normal text-gray-400">·</span>
                    <EditField
                      value={zh.news.sectionTitle}
                      onChange={(v) =>
                        setDraftZh((d) => ({ ...d, news: { ...d.news, sectionTitle: v } }))
                      }
                      className="text-lg font-normal text-gray-400"
                      placeholder="ZH 标题…"
                    />
                  </>
                ) : (
                  <>
                    {zh.news.sectionTitle}
                    <span className="text-lg font-normal text-gray-400 ml-2">· {de.news.sectionTitle} · {en.news.sectionTitle}</span>
                  </>
                )}
              </h2>
            </div>

            {isAdmin && (
              <button
                onClick={addNews}
                className="mb-6 w-full px-4 py-3 border-2 border-dashed border-amber-400 rounded-lg text-amber-700 hover:border-amber-500 hover:bg-amber-50 font-semibold text-sm transition-colors"
              >
                + Add News Article / Neuigkeit hinzufügen / 添加新闻
              </button>
            )}

            <div className="space-y-6">
              {isAdmin ? (
                de.news.items.map((n, i) => {
                  const zhNews = zh.news.items[i];
                  return (
                    <EditBlock
                      key={i}
                      label={`News ${i + 1}`}
                      onDelete={() => removeNews(i)}
                      className="bg-white rounded-lg p-6 border-l-4 border-[var(--school-red)] shadow-sm"
                    >
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="text-xs text-amber-600 font-semibold block mb-0.5">Date</label>
                          <EditField
                            value={n.date}
                            onChange={(v) => { updDeNews(i, "date", v); updZhNews(i, "date", v); }}
                            className="text-xs font-semibold text-[var(--school-red)] tracking-widest w-full"
                            placeholder="2025-09"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-amber-600 font-semibold block mb-0.5">DE Title</label>
                          <EditField
                            value={n.title}
                            onChange={(v) => updDeNews(i, "title", v)}
                            className="font-bold text-[var(--school-dark)] w-full"
                            placeholder="German title…"
                          />
                        </div>
                        {zhNews && (
                          <div>
                            <label className="text-xs text-amber-600 font-semibold block mb-0.5">ZH Title</label>
                            <EditField
                              value={zhNews.title}
                              onChange={(v) => updZhNews(i, "title", v)}
                              className="font-cn text-sm text-gray-500 w-full"
                              placeholder="中文标题…"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-amber-600 font-semibold block mb-0.5">DE Body</label>
                          <EditArea
                            value={n.body}
                            onChange={(v) => updDeNews(i, "body", v)}
                            className="text-sm text-gray-600 leading-relaxed"
                            placeholder="German body text…"
                          />
                        </div>
                        {zhNews && (
                          <div>
                            <label className="text-xs text-amber-600 font-semibold block mb-0.5">ZH Body</label>
                            <EditArea
                              value={zhNews.body}
                              onChange={(v) => updZhNews(i, "body", v)}
                              className="font-cn text-xs text-gray-400 leading-relaxed"
                              placeholder="中文内容…"
                            />
                          </div>
                        )}
                        <p className="text-xs text-amber-500 italic">
                          💡 Use the dedicated News Editor (/admin/news/{i}) for images & block editing.
                        </p>
                      </div>
                    </EditBlock>
                  );
                })
              ) : (
                <>
                  {(() => {
                    const totalNewsPages = Math.max(1, Math.ceil(de.news.items.length / NEWS_PER_PAGE));
                    const pageItems = de.news.items.slice(newsPage * NEWS_PER_PAGE, (newsPage + 1) * NEWS_PER_PAGE);
                    return (
                      <>
                        {pageItems.map((n, slot) => {
                          const actualIdx = newsPage * NEWS_PER_PAGE + slot;
                          const zhNews = zh.news.items[actualIdx];
                          const enNews = en.news.items[actualIdx];
                          const blocks = getNewsBodyBlocks(n);
                          const firstText = blocks.find((b): b is NewsTextBlock => b.type === "text");
                          return (
                            <Link
                              key={n.date + n.title + actualIdx}
                              href={`/news/${actualIdx}`}
                              className="block group"
                            >
                              <article className="bg-white rounded-lg p-6 border-l-4 border-[var(--school-red)] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                <time className="text-xs font-semibold text-[var(--school-red)] tracking-widest">
                                  {n.date}
                                </time>
                                {zhNews && <h3 className="font-cn font-bold text-[var(--school-dark)] mt-1 group-hover:text-[var(--school-red)] transition-colors">{zhNews.title}</h3>}
                                <h3 className="text-sm text-gray-500 mt-0.5">{n.title}</h3>
                                {enNews && <h3 className="text-xs text-gray-400 mt-0.5">{enNews.title}</h3>}
                                {zhNews && <p className="font-cn mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">{zhNews.body}</p>}
                                <p className="mt-1 text-xs text-gray-400 leading-relaxed line-clamp-2">{firstText ? firstText.content : n.body}</p>
                                {enNews && <p className="mt-1 text-xs text-gray-400 leading-relaxed line-clamp-2">{enNews.body}</p>}
                              </article>
                            </Link>
                          );
                        })}
                        {totalNewsPages > 1 && (
                          <div className="flex flex-wrap justify-center gap-2 pt-2">
                            {Array.from({ length: totalNewsPages }, (_, p) => (
                                <button
                                  key={p}
                                  onClick={() => setNewsPage(p)}
                                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${p === newsPage ? "bg-[var(--school-red)] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[var(--school-red)] hover:text-[var(--school-red)]"}`}
                                >
                                  {p + 1}
                                </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </section>
        {/* ── About ──────────────────────────────────────────── */}
        <section id="about" className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-8 h-1 bg-[var(--school-red)] rounded" />
              <h2 className="font-cn text-2xl font-bold text-[var(--school-dark)] flex items-center gap-2 flex-wrap">
                {isAdmin ? (
                  <>
                    <EditField
                      value={de.about.sectionTitle}
                      onChange={(v) => updDe("about", { sectionTitle: v })}
                      className="text-2xl font-bold text-[var(--school-dark)]"
                      placeholder="DE title…"
                    />
                    <span className="text-lg font-normal text-gray-400">·</span>
                    <EditField
                      value={zh.about.sectionTitle}
                      onChange={(v) => updZh("about", { sectionTitle: v })}
                      className="text-lg font-normal text-gray-400"
                      placeholder="ZH 标题…"
                    />
                  </>
                ) : (
                  <>
                    {zh.about.sectionTitle}
                    <span className="text-lg font-normal text-gray-400 ml-2">· {de.about.sectionTitle} · {en.about.sectionTitle}</span>
                  </>
                )}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              {isAdmin ? (
                <EditBlock label="About Description" className="space-y-3 p-4 bg-[var(--school-gray)]">
                  <div>
                    <label className="text-xs text-amber-600 font-semibold block mb-1">DE Description</label>
                    <EditArea
                      value={de.about.desc1}
                      onChange={(v) => updDe("about", { desc1: v })}
                      className="text-[var(--school-dark)] leading-relaxed"
                      placeholder="German description…"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-amber-600 font-semibold block mb-1">ZH Description 1</label>
                    <EditArea
                      value={zh.about.desc1}
                      onChange={(v) => updZh("about", { desc1: v })}
                      className="font-cn text-sm text-gray-600 leading-relaxed"
                      placeholder="中文描述…"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-amber-600 font-semibold block mb-1">ZH Description 2</label>
                    <EditArea
                      value={zh.about.desc2}
                      onChange={(v) => updZh("about", { desc2: v })}
                      className="font-cn text-sm text-gray-500 leading-relaxed"
                      placeholder="中文描述 2…"
                    />
                  </div>
                </EditBlock>
              ) : (
                <div className="space-y-3 text-[var(--school-dark)]">
                  <p className="font-cn leading-relaxed text-sm text-gray-600">{zh.about.desc1}</p>
                  <p className="font-cn leading-relaxed text-xs text-gray-500">{zh.about.desc2}</p>
                  <p className="leading-relaxed text-sm text-gray-600">{de.about.desc1}</p>
                  <p className="leading-relaxed text-xs text-gray-400">{en.about.desc1}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { icon: "📚", statKey: "years", deLabelKey: "yearsLabel", zhLabelKey: "yearsLabel" },
                    { icon: "👩‍🎓", statKey: "students", deLabelKey: "studentsLabel", zhLabelKey: "studentsLabel" },
                    { icon: "👨‍🏫", statKey: "teachers", deLabelKey: "teachersLabel", zhLabelKey: "teachersLabel" },
                    { icon: "🏅", statKey: "coursesCount", deLabelKey: "coursesLabel", zhLabelKey: "coursesLabel" },
                  ] as { icon: string; statKey: keyof SiteContent["about"]; deLabelKey: keyof SiteContent["about"]; zhLabelKey: keyof SiteContent["about"] }[]
                ).map(({ icon, statKey, deLabelKey, zhLabelKey }) => (
                  <div
                    key={statKey}
                    className={`bg-white rounded-lg p-5 border border-[var(--school-border)] text-center shadow-sm${isAdmin ? " ring-2 ring-amber-300" : ""}`}
                  >
                    <div className="text-3xl mb-1">{icon}</div>
                    {isAdmin ? (
                      <>
                        <EditField
                          value={de.about[statKey] as string}
                          onChange={(v) => updDe("about", { [statKey]: v })}
                          className="text-2xl font-bold text-[var(--school-red)] text-center w-full"
                          placeholder="Stat…"
                        />
                        <EditField
                          value={de.about[deLabelKey] as string}
                          onChange={(v) => updDe("about", { [deLabelKey]: v })}
                          className="text-xs text-gray-500 mt-1 w-full text-center"
                          placeholder="DE label…"
                        />
                        <EditField
                          value={zh.about[zhLabelKey] as string}
                          onChange={(v) => updZh("about", { [zhLabelKey]: v })}
                          className="font-cn text-xs text-gray-400 w-full text-center"
                          placeholder="ZH 标签…"
                        />
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-[var(--school-red)]">{de.about[statKey] as string}</div>
                        <div className="font-cn text-xs text-gray-500 mt-1">{zh.about[zhLabelKey] as string}</div>
                        <div className="text-xs text-gray-400">{de.about[deLabelKey] as string}</div>
                        <div className="text-xs text-gray-400">{en.about[deLabelKey] as string}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Contact ────────────────────────────────────────── */}
        <section id="contact" className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <span className="block w-8 h-1 bg-[var(--school-red)] rounded" />
            </div>
            <h2 className="font-cn text-2xl font-bold text-[var(--school-dark)] mb-1 flex items-center justify-center gap-2 flex-wrap">
              {isAdmin ? (
                <>
                  <EditField
                    value={de.contact.sectionTitle}
                    onChange={(v) => updDe("contact", { sectionTitle: v })}
                    className="text-2xl font-bold text-[var(--school-dark)]"
                    placeholder="DE title…"
                  />
                  <span className="text-lg font-normal text-gray-400">·</span>
                  <EditField
                    value={zh.contact.sectionTitle}
                    onChange={(v) => updZh("contact", { sectionTitle: v })}
                    className="text-lg font-normal text-gray-400"
                    placeholder="ZH 标题…"
                  />
                </>
              ) : (
                <>
                  {zh.contact.sectionTitle}
                  <span className="text-lg font-normal text-gray-400 ml-2">· {de.contact.sectionTitle} · {en.contact.sectionTitle}</span>
                </>
              )}
            </h2>

            <div className="grid sm:grid-cols-3 gap-6 text-left mt-8">
              <div className={`bg-[var(--school-gray)] rounded-lg p-6 border border-[var(--school-border)]${isAdmin ? " ring-2 ring-amber-300" : ""}`}>
                <div className="text-3xl mb-3">📍</div>
                {isAdmin ? (
                  <div className="space-y-1">
                    <EditField value={de.contact.addressTitle} onChange={(v) => updDe("contact", { addressTitle: v })} className="font-semibold text-[var(--school-dark)] text-sm w-full" placeholder="DE Address title…" />
                    <EditField value={zh.contact.addressTitle} onChange={(v) => updZh("contact", { addressTitle: v })} className="font-cn text-xs text-gray-400 w-full" placeholder="ZH 地址标题…" />
                    {de.contact.addressLines.map((l, i) => (
                      <EditField key={`de-addr-${i}`} value={l} onChange={(v) => updDeAddrLine(i, v)} className="text-sm text-gray-600 w-full" placeholder={`DE address line ${i + 1}…`} />
                    ))}
                    {zh.contact.addressLines.map((l, i) => (
                      <EditField key={`zh-addr-${i}`} value={l} onChange={(v) => updZhAddrLine(i, v)} className="font-cn text-xs text-gray-400 w-full" placeholder={`ZH 地址行 ${i + 1}…`} />
                    ))}
                  </div>
                ) : (
                  <>
                    <h3 className="font-cn font-semibold text-[var(--school-dark)] mb-0.5 text-sm">{zh.contact.addressTitle}</h3>
                    <p className="text-xs text-gray-400 mb-0.5">{de.contact.addressTitle}</p>
                    <p className="text-xs text-gray-400 mb-2">{en.contact.addressTitle}</p>
                    {zh.contact.addressLines.map((l) => (<p key={l} className="font-cn text-sm text-gray-600">{l}</p>))}
                    {de.contact.addressLines.map((l) => (<p key={l} className="text-xs text-gray-400">{l}</p>))}
                    {en.contact.addressLines.map((l) => (<p key={l} className="text-xs text-gray-400">{l}</p>))}
                  </>
                )}
              </div>

              <div className={`bg-[var(--school-gray)] rounded-lg p-6 border border-[var(--school-border)]${isAdmin ? " ring-2 ring-amber-300" : ""}`}>
                <div className="text-3xl mb-3">✉️</div>
                {isAdmin ? (
                  <div className="space-y-1">
                    <EditField value={de.contact.emailTitle} onChange={(v) => updDe("contact", { emailTitle: v })} className="font-semibold text-[var(--school-dark)] text-sm w-full" placeholder="DE Email title…" />
                    <EditField value={zh.contact.emailTitle} onChange={(v) => updZh("contact", { emailTitle: v })} className="font-cn text-xs text-gray-400 w-full" placeholder="ZH 邮箱标题…" />
                    <EditField value={de.contact.email} onChange={(v) => { updDe("contact", { email: v }); updZh("contact", { email: v }); }} className="text-sm text-gray-600 w-full" placeholder="email@example.com" />
                  </div>
                ) : (
                  <>
                    <h3 className="font-cn font-semibold text-[var(--school-dark)] mb-0.5 text-sm">{zh.contact.emailTitle}</h3>
                    <p className="text-xs text-gray-400 mb-0.5">{de.contact.emailTitle}</p>
                    <p className="text-xs text-gray-400 mb-2">{en.contact.emailTitle}</p>
                    <p className="text-sm text-gray-600">{de.contact.email}</p>
                  </>
                )}
              </div>

              <div className={`bg-[var(--school-gray)] rounded-lg p-6 border border-[var(--school-border)]${isAdmin ? " ring-2 ring-amber-300" : ""}`}>
                <div className="text-3xl mb-3">📞</div>
                {isAdmin ? (
                  <div className="space-y-1">
                    <EditField value={de.contact.phoneTitle} onChange={(v) => updDe("contact", { phoneTitle: v })} className="font-semibold text-[var(--school-dark)] text-sm w-full" placeholder="DE Phone title…" />
                    <EditField value={zh.contact.phoneTitle} onChange={(v) => updZh("contact", { phoneTitle: v })} className="font-cn text-xs text-gray-400 w-full" placeholder="ZH 电话标题…" />
                    <EditField value={de.contact.phone} onChange={(v) => { updDe("contact", { phone: v }); updZh("contact", { phone: v }); }} className="text-sm text-gray-600 w-full" placeholder="+49 123 456789" />
                  </div>
                ) : de.contact.phone ? (
                  <>
                    <h3 className="font-cn font-semibold text-[var(--school-dark)] mb-0.5 text-sm">{zh.contact.phoneTitle}</h3>
                    <p className="text-xs text-gray-400 mb-0.5">{de.contact.phoneTitle}</p>
                    <p className="text-xs text-gray-400 mb-2">{en.contact.phoneTitle}</p>
                    <p className="text-sm text-gray-600">{de.contact.phone}</p>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* ── Admin toolbar ─────────────────────────────────────── */}
      {isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--school-dark)]/95 backdrop-blur-sm text-white py-3 px-4 flex items-center justify-between gap-3 flex-wrap shadow-2xl border-t-2 border-amber-400">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 text-lg">✏</span>
            <div>
              <span className="text-sm font-bold">Edit Mode</span>
              <span className="text-xs text-gray-400 ml-2">· {currentUser}</span>
            </div>
            {isDirty && (
              <span className="text-xs bg-amber-500 text-amber-900 font-bold px-2 py-0.5 rounded animate-pulse">
                ● Unsaved changes
              </span>
            )}
            {saved && (
              <span className="text-xs bg-green-500 text-white font-bold px-2 py-0.5 rounded">
                ✓ Saved!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors"
            >
              💾 Save / Speichern / 保存
            </button>
            <button
              onClick={handleDiscard}
              className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded transition-colors"
            >
              ↺ Discard / Verwerfen
            </button>
            <a
              href="/admin"
              className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
            >
              ⚙ Admin Panel
            </a>
            <button
              onClick={logout}
              className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
