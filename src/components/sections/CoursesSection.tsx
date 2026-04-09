"use client";

import React from "react";
import type { SiteContent, CourseItem } from "@/i18n/translations";
import { EditField, EditArea, EditBlock } from "@/components/admin/EditHelpers";

interface CoursesSectionProps {
  isAdmin: boolean;
  de: SiteContent;
  zh: SiteContent;
  en: SiteContent;
  showEn: (section: string) => boolean;
  courseOffset: number;
  setCourseOffset: React.Dispatch<React.SetStateAction<number>>;
  setDraftDe: React.Dispatch<React.SetStateAction<SiteContent>>;
  setDraftZh: React.Dispatch<React.SetStateAction<SiteContent>>;
  updDeCourse: (idx: number, key: keyof CourseItem, val: string) => void;
  updZhCourse: (idx: number, key: keyof CourseItem, val: string) => void;
  addCourse: () => void;
  removeCourse: (idx: number) => void;
}

export default function CoursesSection({
  isAdmin,
  de,
  zh,
  en,
  showEn,
  courseOffset,
  setCourseOffset,
  setDraftDe,
  setDraftZh,
  updDeCourse,
  updZhCourse,
  addCourse,
  removeCourse,
}: CoursesSectionProps) {
  return (
        <section id="courses" className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-8 h-1 bg-school-red rounded" />
              <h2 className="font-cn text-2xl font-bold text-school-dark flex items-center gap-2 flex-wrap">
                {isAdmin ? (
                  <>
                    <EditField
                      value={de.courses.sectionTitle}
                      onChange={(v) =>
                        setDraftDe((d) => ({ ...d, courses: { ...d.courses, sectionTitle: v } }))
                      }
                      className="text-2xl font-bold text-school-dark"
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
                    <span className="text-lg font-normal text-gray-400 ml-2">· {de.courses.sectionTitle}{showEn("courses") && en.courses.sectionTitle.trim() && ` · ${en.courses.sectionTitle}`}</span>
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
                      className="border-t-4 border-school-red bg-school-gray rounded-lg p-6"
                    >
                      <div className="space-y-2 pt-2">
                        <div>
                          <label className="text-xs text-amber-600 font-semibold block mb-0.5">级别名称（中文）/ Level name (Chinese)</label>
                          <EditField
                            value={c.level}
                            onChange={(v) => { updDeCourse(i, "level", v); updZhCourse(i, "level", v); }}
                            className="font-cn text-xl font-bold text-school-dark w-full"
                            placeholder="初级班…"
                          />
                        </div>
                        {zhCourse && (
                          <div>
                            <label className="text-xs text-amber-600 font-semibold block mb-0.5">中文级别标签 / ZH level label</label>
                            <EditField
                              value={zhCourse.levelLabel}
                              onChange={(v) => updZhCourse(i, "levelLabel", v)}
                              className="font-cn text-xs font-semibold text-school-red uppercase tracking-wide w-full"
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
                              className="font-cn text-xs text-school-red font-semibold w-full"
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
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center shadow hover:bg-school-gray transition-colors"
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
                          className="border-t-4 border-school-red bg-school-gray rounded-lg p-6 hover:shadow-lg transition-shadow"
                        >
                          <div className="font-cn text-xl font-bold text-school-dark mb-1">
                            {c.level}
                          </div>
                          {zhCourse && (
                            <div className="font-cn text-xs font-semibold text-school-red uppercase tracking-wide mb-0.5">
                              {zhCourse.levelLabel}
                            </div>
                          )}
                          {c.levelLabel.trim() && (
                            <div className="text-xs text-gray-400 mb-0.5">
                              {c.levelLabel}
                            </div>
                          )}
                          {showEn("courses") && enCourse && enCourse.levelLabel.trim() && (
                            <div className="text-xs text-gray-400 mb-3">
                              {enCourse.levelLabel}
                            </div>
                          )}
                          <div className="border-t border-gray-200 pt-3 mt-1">
                            {(c.time || (zhCourse && zhCourse.time)) && (
                              <div className="text-xs text-school-red font-semibold mb-2 flex items-center gap-1 flex-wrap">
                                <span>🕐</span>
                                {zhCourse?.time && <span className="font-cn">{zhCourse.time}</span>}
                                {zhCourse?.time && c.time && <span className="text-gray-400">·</span>}
                                {c.time && <span>{c.time}</span>}
                                {showEn("courses") && enCourse?.time && <span className="text-gray-400">·</span>}
                                {showEn("courses") && enCourse?.time && <span>{enCourse.time}</span>}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1 flex-wrap">
                              <span>👤</span>
                              {zhCourse && <span className="font-cn">{zhCourse.ages}</span>}
                              {zhCourse && <span className="text-gray-400">·</span>}
                              <span>{c.ages}</span>
                              {showEn("courses") && enCourse && <span className="text-gray-400">·</span>}
                              {showEn("courses") && enCourse && <span>{enCourse.ages}</span>}
                            </div>
                            {zhCourse && (
                              <p className="font-cn text-sm text-gray-600 leading-relaxed">{zhCourse.desc}</p>
                            )}
                            {c.desc.trim() && <p className="text-xs text-gray-500 leading-relaxed mt-1">{c.desc}</p>}
                            {showEn("courses") && enCourse && enCourse.desc.trim() && (
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
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center shadow hover:bg-school-gray transition-colors"
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
                        className={`w-2 h-2 rounded-full transition-colors ${i === courseOffset ? "bg-school-red" : "bg-gray-300 hover:bg-gray-400"}`}
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
  );
}
