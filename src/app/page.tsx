import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SchoolLogo from "@/components/SchoolLogo";

/* ─── Section data ─────────────────────────────────────────── */
const courses = [
  {
    level: "初级班",
    levelDe: "Anfänger",
    ages: "6–10 Jahre",
    desc: "Pinyin, Grundvokabular, einfache Sätze / 拼音、基础词汇、简单句子",
  },
  {
    level: "中级班",
    levelDe: "Mittelstufe",
    ages: "10–14 Jahre",
    desc: "HSK 2–3, lesen und schreiben / 读写能力进阶",
  },
  {
    level: "高级班",
    levelDe: "Fortgeschrittene",
    ages: "14+ Jahre",
    desc: "HSK 4–6, Konversation, Kultur / 高阶汉语、文化与文学",
  },
  {
    level: "成人班",
    levelDe: "Erwachsene",
    ages: "18+ Jahre",
    desc: "Alltagskommunikation, Reise & Geschäft / 日常交流、旅行与商务",
  },
];

const news = [
  {
    date: "2025-09",
    title: "Neues Schuljahr 2025/26 beginnt",
    cn: "2025/26学年开始招生",
    body: "Die Anmeldung für das neue Schuljahr ist ab sofort möglich. 新学年报名现已开放。",
  },
  {
    date: "2025-02",
    title: "Laternenfest-Feier",
    cn: "元宵节庆典",
    body: "Gemeinsam haben wir das chinesische Laternenfest gefeiert. 我们共同庆祝了中国元宵节。",
  },
  {
    date: "2024-12",
    title: "Jahresabschlussfeier",
    cn: "年终表彰典礼",
    body: "Unsere Schüler haben ihr Können beim Jahresabschluss eindrucksvoll bewiesen. 学生们在年终典礼上展示了他们的才能。",
  },
];

/* ─── Page ─────────────────────────────────────────────────── */
export default function Home() {
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
              <p className="text-gray-300 text-lg mb-6 max-w-md">
                Lernen Sie Chinesisch mit Herz und Leidenschaft — in Heilbronn.
                <br />
                <span className="text-sm text-gray-400">用心学习，传承文化。</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#courses"
                  className="px-6 py-3 bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] text-white font-semibold rounded transition-colors"
                >
                  Kurse entdecken 查看课程
                </a>
                <a
                  href="#contact"
                  className="px-6 py-3 border border-white/30 hover:border-white text-white font-semibold rounded transition-colors"
                >
                  Kontakt aufnehmen
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
                关于我们 <span className="text-base font-normal text-gray-500 ml-1">Über uns</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4 text-[var(--school-dark)]">
                <p className="leading-relaxed">
                  Die <strong>Yi Xin Chinesische Sprachschule Heilbronn</strong> wurde gegründet,
                  um chinesische Sprache und Kultur in der Region zu fördern und chinesisch-deutschen
                  Familien eine qualitativ hochwertige Bildung in der Muttersprache zu bieten.
                </p>
                <p className="leading-relaxed text-sm text-gray-600">
                  海尔布隆一心中文学校致力于弘扬中华语言文化，为当地华人家庭提供高质量的中文教育。
                  学校以&ldquo;一心&rdquo;为名，寓意全心全意投入教育事业。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "📚", stat: "10+", label: "Jahre Erfahrung / 年办学经验" },
                  { icon: "👩‍🎓", stat: "200+", label: "Schüler / 在校学生" },
                  { icon: "👨‍🏫", stat: "15+", label: "Lehrkräfte / 专业教师" },
                  { icon: "🏅", stat: "4", label: "Kursgruppen / 课程班级" },
                ].map(({ icon, stat, label }) => (
                  <div
                    key={label}
                    className="bg-white rounded-lg p-5 border border-[var(--school-border)] text-center shadow-sm"
                  >
                    <div className="text-3xl mb-1">{icon}</div>
                    <div className="text-2xl font-bold text-[var(--school-red)]">{stat}</div>
                    <div className="text-xs text-gray-500 mt-1">{label}</div>
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
                课程设置{" "}
                <span className="text-base font-normal text-gray-500 ml-1">Kursangebot</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses.map((c) => (
                <div
                  key={c.level}
                  className="border-t-4 border-[var(--school-red)] bg-[var(--school-gray)] rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="font-cn text-xl font-bold text-[var(--school-dark)] mb-1">
                    {c.level}
                  </div>
                  <div className="text-xs font-semibold text-[var(--school-red)] uppercase tracking-wide mb-3">
                    {c.levelDe}
                  </div>
                  <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                    <span>🕐</span> {c.ages}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── News ───────────────────────────────────────────── */}
        <section id="news" className="py-16 px-4 bg-[var(--school-gray)]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-8 h-1 bg-[var(--school-red)] rounded" />
              <h2 className="font-cn text-2xl font-bold text-[var(--school-dark)]">
                学校新闻{" "}
                <span className="text-base font-normal text-gray-500 ml-1">Aktuelles</span>
              </h2>
            </div>
            <div className="space-y-6">
              {news.map((n) => (
                <article
                  key={n.date + n.title}
                  className="bg-white rounded-lg p-6 border-l-4 border-[var(--school-red)] shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <time className="text-xs font-semibold text-[var(--school-red)] tracking-widest">
                        {n.date}
                      </time>
                      <h3 className="font-bold text-[var(--school-dark)] mt-1">
                        {n.title}{" "}
                        <span className="font-cn text-sm font-medium text-gray-500">
                          {n.cn}
                        </span>
                      </h3>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{n.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact ────────────────────────────────────────── */}
        <section id="contact" className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <span className="block w-8 h-1 bg-[var(--school-red)] rounded" />
            </div>
            <h2 className="font-cn text-2xl font-bold text-[var(--school-dark)] mb-2">
              联系我们
            </h2>
            <p className="text-gray-500 mb-8">Kontaktieren Sie uns / 请与我们联系</p>
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              {[
                {
                  icon: "📍",
                  title: "Adresse / 地址",
                  lines: ["Heilbronn", "Baden-Württemberg, Deutschland"],
                },
                {
                  icon: "✉️",
                  title: "E-Mail / 邮箱",
                  lines: ["info@yixin-heilbronn.de"],
                },
                {
                  icon: "🕐",
                  title: "Unterrichtszeiten / 上课时间",
                  lines: ["Samstags / 每周六", "09:00 – 13:00 Uhr"],
                },
              ].map(({ icon, title, lines }) => (
                <div
                  key={title}
                  className="bg-[var(--school-gray)] rounded-lg p-6 border border-[var(--school-border)]"
                >
                  <div className="text-3xl mb-3">{icon}</div>
                  <h3 className="font-semibold text-[var(--school-dark)] mb-2 text-sm">{title}</h3>
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
