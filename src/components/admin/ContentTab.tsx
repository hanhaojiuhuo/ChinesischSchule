"use client";

import Image from "next/image";
import { Field, SectionCard, ExpandModal, ExpandButton } from "@/components/admin/AdminHelpers";
import { getNewsBodyBlocks } from "@/i18n/translations";
import type { SiteContent, NewsBodyBlock, CourseItem } from "@/i18n/translations";
import {
  countWords,
  MAX_WORDS_NEWS,
  MAX_WORDS_DEFAULT,
  validateImageFile,
  IMAGE_ACCEPT,
} from "@/lib/validation";

export interface ContentTabProps {
  draft: SiteContent;
  setDraft: React.Dispatch<React.SetStateAction<SiteContent>>;
  handleSectionSave: (sectionKey: string) => void;
  sectionStatus: Record<string, "idle" | "saving" | "saved">;

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
}

export default function ContentTab({
  draft,
  setDraft,
  handleSectionSave,
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
}: ContentTabProps) {
  return (
    <>
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
          className="px-4 py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-school-red hover:text-school-red w-full transition-colors"
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
          className="mb-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-school-red hover:text-school-red w-full transition-colors"
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
                          className={`w-full border rounded px-3 py-2 text-sm focus:outline-none resize-y min-h-[60px] ${countWords(block.content) > MAX_WORDS_NEWS ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-school-red"}`}
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
                          className="border-2 border-dashed border-gray-300 hover:border-school-red rounded-lg p-3 text-center cursor-pointer transition-colors mb-1"
                        >
                          {newsUploadingIdx?.newsIdx === idx && newsUploadingIdx?.blockIdx === bIdx ? (
                            <p className="text-sm text-gray-500">⏳ Uploading… / 上传中…</p>
                          ) : block.url ? (
                            <div>
                              <Image src={block.url} alt={block.caption || `News image ${bIdx + 1}`} width={400} height={128} unoptimized className="mx-auto max-h-32 object-cover rounded border border-gray-200 mb-1" />
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
                          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-school-red"
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
                  className="text-xs px-3 py-1 border border-dashed border-gray-300 rounded hover:border-school-red hover:text-school-red transition-colors"
                >
                  + Text / 添加文本
                </button>
                <button
                  type="button"
                  onClick={() => updateNewsBlocks(idx, [...blocks, { type: "image", url: "" }])}
                  className="text-xs px-3 py-1 border border-dashed border-gray-300 rounded hover:border-school-red hover:text-school-red transition-colors"
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
            className={`w-full border rounded px-3 py-2 text-sm focus:outline-none min-h-[60px] ${countWords(draft.contact.addressLines.join("\n")) > MAX_WORDS_DEFAULT ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-school-red"}`}
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
    </>
  );
}
