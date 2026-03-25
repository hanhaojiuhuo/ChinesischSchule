"use client";

import SchoolLogo from "./SchoolLogo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContent } from "@/contexts/ContentContext";

export default function Footer() {
  const { language } = useLanguage();
  const { getContent } = useContent();
  const t = getContent(language);

  const navLinks: [string, string][] = [
    [t.nav.home, "#home"],
    [t.nav.about, "#about"],
    [t.nav.courses, "#courses"],
    [t.nav.news, "#news"],
    [t.nav.contact, "#contact"],
  ];

  return (
    <footer className="bg-[var(--school-dark)] text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-8">
        {/* Brand */}
        <div className="flex flex-col items-start gap-3">
          <SchoolLogo size={80} className="[filter:invert(1)_brightness(0.85)]" />
          <p className="font-cn font-bold text-lg leading-tight">海尔布隆一心中文学校</p>
          <p className="text-xs text-gray-400">{t.schoolName}</p>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="font-bold text-[var(--school-red)] mb-3 tracking-wide uppercase text-sm">
            {t.footer.navigationTitle}
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            {navLinks.map(([label, href]) => (
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
            {t.footer.contactTitle}
          </h3>
          <address className="not-italic text-sm text-gray-300 space-y-1">
            {t.contact.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="mt-2">
              <a
                href={`mailto:${t.contact.email}`}
                className="hover:text-[var(--school-red)] transition-colors"
              >
                {t.contact.email}
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
