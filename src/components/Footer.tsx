import SchoolLogo from "./SchoolLogo";

export default function Footer() {
  return (
    <footer className="bg-[var(--school-dark)] text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-8">
        {/* Brand */}
        <div className="flex flex-col items-start gap-3">
          <SchoolLogo size={80} className="[filter:invert(1)_brightness(0.85)]" />
          <p className="font-cn font-bold text-lg leading-tight">海尔布隆一心中文学校</p>
          <p className="text-xs text-gray-400">Yi Xin Chinesische Sprachschule Heilbronn</p>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="font-bold text-[var(--school-red)] mb-3 tracking-wide uppercase text-sm">
            Navigation
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            {[
              ["首页 Home", "#home"],
              ["关于 Über uns", "#about"],
              ["课程 Kurse", "#courses"],
              ["新闻 Aktuelles", "#news"],
              ["联系 Kontakt", "#contact"],
            ].map(([label, href]) => (
              <li key={href}>
                <a href={href} className="hover:text-[var(--school-red)] transition-colors">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-bold text-[var(--school-red)] mb-3 tracking-wide uppercase text-sm">
            Kontakt / 联系
          </h3>
          <address className="not-italic text-sm text-gray-300 space-y-1">
            <p>Heilbronn, Baden-Württemberg</p>
            <p>Deutschland</p>
            <p className="mt-2">
              <a
                href="mailto:info@yixin-heilbronn.de"
                className="hover:text-[var(--school-red)] transition-colors"
              >
                info@yixin-heilbronn.de
              </a>
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-gray-700 text-center py-4 text-xs text-gray-500">
        © {new Date().getFullYear()} 海尔布隆一心中文学校 · Yi Xin Chinesische Sprachschule
        Heilbronn
      </div>
    </footer>
  );
}
