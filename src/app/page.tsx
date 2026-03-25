"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SchoolLogo from "@/components/SchoolLogo";
import { useContent } from "@/contexts/ContentContext";

/* ─── Page ─────────────────────────────────────────────────── */
export default function Home() {
  const { getContent } = useContent();
  const de = getContent("de");
  const zh = getContent("zh");

  return (
    <>
      <Navbar />

      <main className="flex-1">
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
              <p className="text-[var(--school-red)] font-semibold tracking-widest uppercase text-sm mb-2">
                Yi Xin Chinesische Sprachschule Heilbronn
              </p>
              <h1 className="font-cn text-4xl sm:text-5xl font-bold leading-tight mb-4">
                海尔布隆<br />
                <span className="text-[var(--school-red)]">一心</span>中文学校
              </h1>
              <p className="text-gray-300 text-lg mb-2 max-w-md">
                {de.hero.tagline}
              </p>
              <p className="font-cn text-gray-400 text-base mb-6 max-w-md">
                {zh.hero.tagline}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#courses"
                  className="px-6 py-3 bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] text-white font-semibold rounded transition-colors"
                >
                  {de.hero.discoverCourses} · {zh.hero.discoverCourses}
                </a>
                <a
                  href="#contact"
                  className="px-6 py-3 border border-white/30 hover:border-white text-white font-semibold rounded transition-colors"
                >
                  {de.hero.contactUs} · {zh.hero.contactUs}
                </a>
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="logo-circle bg-white p-4 shadow-2xl">
                <SchoolLogo size={200} />
              </div>
            </div>
          </div>
        </section>

        {/* ── About ──────────────────────────────────────────── */}
        <section id="about" className="py-16 px-4 bg-[var(--school-gray)]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-8 h-1 bg-[var(--school-red)] rounded" />
              <h2 className="font-cn text-2xl font-bold text-[var(--school-dark)]">
                {de.about.sectionTitle}
                <span className="text-lg font-normal text-gray-400 ml-2">· {zh.about.sectionTitle}</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4 text-[var(--school-dark)]">
                <p className="leading-relaxed">{de.about.desc1}</p>
                <p className="font-cn leading-relaxed text-sm text-gray-600">{zh.about.desc1}</p>
                <p className="leading-relaxed text-sm text-gray-500">{zh.about.desc2}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "📚", stat: de.about.years, deLabel: de.about.yearsLabel, zhLabel: zh.about.yearsLabel },
                  { icon: "👩‍🎓", stat: de.about.students, deLabel: de.about.studentsLabel, zhLabel: zh.about.studentsLabel },
                  { icon: "👨‍🏫", stat: de.about.teachers, deLabel: de.about.teachersLabel, zhLabel: zh.about.teachersLabel },
                  { icon: "🏅", stat: de.about.coursesCount, deLabel: de.about.coursesLabel, zhLabel: zh.about.coursesLabel },
                ].map(({ icon, stat, deLabel, zhLabel }) => (
                  <div
                    key={deLabel}
                    className="bg-white rounded-lg p-5 border border-[var(--school-border)] text-center shadow-sm"
                  >
                    <div className="text-3xl mb-1">{icon}</div>
                    <div className="text-2xl font-bold text-[var(--school-red)]">{stat}</div>
                    <div className="text-xs text-gray-500 mt-1">{deLabel}</div>
                    <div className="font-cn text-xs text-gray-400">{zhLabel}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Courses ────────────────────────────────────────── */}
        <section id="courses" className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-8 h-1 bg-[var(--school-red)] rounded" />
              <h2 className="font-cn text-2xl font-bold text-[var(--school-dark)]">
                {de.courses.sectionTitle}
                <span className="text-lg font-normal text-gray-400 ml-2">· {zh.courses.sectionTitle}</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {de.courses.items.map((c, i) => {
                const zhCourse = zh.courses.items[i];
                return (
                  <div
                    key={c.level}
                    className="border-t-4 border-[var(--school-red)] bg-[var(--school-gray)] rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="font-cn text-xl font-bold text-[var(--school-dark)] mb-1">
                      {c.level}
                    </div>
                    <div className="text-xs font-semibold text-[var(--school-red)] uppercase tracking-wide mb-1">
                      {c.levelLabel}
                    </div>
                    {zhCourse && (
                      <div className="font-cn text-xs text-gray-400 mb-3">
                        {zhCourse.levelLabel}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                      <span>🕐</span> {c.ages}{zhCourse ? ` · ${zhCourse.ages}` : ""}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{c.desc}</p>
                    {zhCourse && (
                      <p className="font-cn text-xs text-gray-400 leading-relaxed mt-2">{zhCourse.desc}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── News ───────────────────────────────────────────── */}
        <section id="news" className="py-16 px-4 bg-[var(--school-gray)]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-8 h-1 bg-[var(--school-red)] rounded" />
              <h2 className="font-cn text-2xl font-bold text-[var(--school-dark)]">
                {de.news.sectionTitle}
                <span className="text-lg font-normal text-gray-400 ml-2">· {zh.news.sectionTitle}</span>
              </h2>
            </div>
            <div className="space-y-6">
              {de.news.items.map((n, i) => {
                const zhNews = zh.news.items[i];
                return (
                  <article
                    key={n.date + n.title}
                    className="bg-white rounded-lg p-6 border-l-4 border-[var(--school-red)] shadow-sm"
                  >
                    <time className="text-xs font-semibold text-[var(--school-red)] tracking-widest">
                      {n.date}
                    </time>
                    <h3 className="font-bold text-[var(--school-dark)] mt-1">{n.title}</h3>
                    {zhNews && <p className="font-cn text-sm text-gray-500 mt-0.5">{zhNews.title}</p>}
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{n.body}</p>
                    {zhNews && <p className="font-cn mt-1 text-xs text-gray-400 leading-relaxed">{zhNews.body}</p>}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Contact ────────────────────────────────────────── */}
        <section id="contact" className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <span className="block w-8 h-1 bg-[var(--school-red)] rounded" />
            </div>
            <h2 className="font-cn text-2xl font-bold text-[var(--school-dark)] mb-1">
              {de.contact.sectionTitle}
              <span className="text-lg font-normal text-gray-400 ml-2">· {zh.contact.sectionTitle}</span>
            </h2>
            <p className="text-gray-500 mb-1">{de.contact.subtitle}</p>
            <p className="font-cn text-gray-400 text-sm mb-8">{zh.contact.subtitle}</p>
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              {[
                {
                  icon: "📍",
                  deTitle: de.contact.addressTitle,
                  zhTitle: zh.contact.addressTitle,
                  lines: de.contact.addressLines,
                },
                {
                  icon: "✉️",
                  deTitle: de.contact.emailTitle,
                  zhTitle: zh.contact.emailTitle,
                  lines: [de.contact.email],
                },
                {
                  icon: "🕐",
                  deTitle: de.contact.hoursTitle,
                  zhTitle: zh.contact.hoursTitle,
                  lines: de.contact.hoursLines,
                },
              ].map(({ icon, deTitle, zhTitle, lines }) => (
                <div
                  key={deTitle}
                  className="bg-[var(--school-gray)] rounded-lg p-6 border border-[var(--school-border)]"
                >
                  <div className="text-3xl mb-3">{icon}</div>
                  <h3 className="font-semibold text-[var(--school-dark)] mb-0.5 text-sm">{deTitle}</h3>
                  <p className="font-cn text-xs text-gray-400 mb-2">{zhTitle}</p>
                  {lines.map((l) => (
                    <p key={l} className="text-sm text-gray-600">
                      {l}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
