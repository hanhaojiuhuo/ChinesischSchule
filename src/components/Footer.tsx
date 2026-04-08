"use client";

import SchoolLogo from "./SchoolLogo";
import { useContent } from "@/contexts/ContentContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Footer() {
  const { getContent, isEnglishVisible } = useContent();
  const { isAdmin } = useAuth();
  const de = getContent("de");
  const zh = getContent("zh");

  const en = getContent("en");
  const showEn = isEnglishVisible("footer");

  const navLinks: [string, string, string, string][] = [
    [de.nav.home, zh.nav.home, en.nav.home, "/#home"],
    [de.nav.courses, zh.nav.courses, en.nav.courses, "/#courses"],
    [de.nav.news, zh.nav.news, en.nav.news, "/#news"],
    [de.nav.about, zh.nav.about, en.nav.about, "/#about"],
    [de.nav.contact, zh.nav.contact, en.nav.contact, "/#contact"],
  ];

  return (
    <footer className={`bg-[var(--school-dark)] text-white mt-auto${isAdmin ? " pb-28" : ""}`}>
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
            <span className="font-cn">{zh.footer.navigationTitle}</span> · {de.footer.navigationTitle}{showEn && ` · ${en.footer.navigationTitle}`}
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            {navLinks.map(([deLabel, zhLabel, enLabel, href]) => (
              <li key={href}>
                <a href={href} className="hover:text-[var(--school-red)] transition-colors">
                  <span className="font-cn">{zhLabel}</span> · {deLabel}{showEn && ` · ${enLabel}`}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-bold text-[var(--school-red)] mb-3 tracking-wide uppercase text-sm">
            <span className="font-cn">{zh.footer.contactTitle}</span> · {de.footer.contactTitle}{showEn && ` · ${en.footer.contactTitle}`}
          </h3>
          <address className="not-italic text-sm text-gray-300 space-y-1">
            {de.contact.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="mt-2">
              <a
                href={`mailto:${de.contact.email}`}
                className="hover:text-[var(--school-red)] transition-colors"
              >
                {de.contact.email}
              </a>
            </p>
            {de.contact.phone && (
              <p>
                <a
                  href={`tel:${de.contact.phone.replace(/\s/g, "")}`}
                  className="hover:text-[var(--school-red)] transition-colors"
                >
                  {de.contact.phone}
                </a>
              </p>
            )}
          </address>
        </div>
      </div>

      <div className="border-t border-gray-700 text-center py-4 text-xs text-gray-500">
        © {new Date().getFullYear()} 海尔布隆一心中文学校 · Yi Xin Chinesische Sprachschule
        Heilbronn{showEn && " · Yi Xin Chinese Language School"}
        <span className="mx-2">·</span>
        <a href="/impressum" className="hover:text-[var(--school-red)] transition-colors underline">
          法律声明 · Impressum{showEn && " · Legal Notice"}
        </a>
        <span className="mx-2">·</span>
        <a href="/privacy" className="hover:text-[var(--school-red)] transition-colors underline">
          隐私政策 · Datenschutz{showEn && " · Privacy Policy"}
        </a>
      </div>
    </footer>
  );
}
