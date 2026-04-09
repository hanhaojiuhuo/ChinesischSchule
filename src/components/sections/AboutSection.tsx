"use client";

import React from "react";
import type { SiteContent } from "@/i18n/translations";
import { EditField, EditArea, EditBlock } from "@/components/admin/EditHelpers";

interface AboutSectionProps {
  isAdmin: boolean;
  de: SiteContent;
  zh: SiteContent;
  en: SiteContent;
  showEn: (section: string) => boolean;
  updDe: <K extends keyof SiteContent>(section: K, patch: Partial<SiteContent[K]> & object) => void;
  updZh: <K extends keyof SiteContent>(section: K, patch: Partial<SiteContent[K]> & object) => void;
}

export default function AboutSection({
  isAdmin,
  de,
  zh,
  en,
  showEn,
  updDe,
  updZh,
}: AboutSectionProps) {
  return (
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
                    <span className="text-lg font-normal text-gray-400 ml-2">· {de.about.sectionTitle}{showEn("about") && en.about.sectionTitle.trim() && ` · ${en.about.sectionTitle}`}</span>
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
                  {de.about.desc1.trim() && <p className="leading-relaxed text-sm text-gray-600">{de.about.desc1}</p>}
                  {showEn("about") && en.about.desc1.trim() && <p className="leading-relaxed text-xs text-gray-400">{en.about.desc1}</p>}
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
                        {showEn("about") && (en.about[deLabelKey] as string).trim() && <div className="text-xs text-gray-400">{en.about[deLabelKey] as string}</div>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
  );
}
