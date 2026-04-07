"use client";

import { useState } from "react";
import SchoolLogo from "./SchoolLogo";
import { useContent } from "@/contexts/ContentContext";

const navLinks = [
  { de: "Home", zh: "首页", en: "Home", href: "/#home" },
  { de: "Kursangebot", zh: "课程", en: "Courses", href: "/#courses" },
  { de: "Aktuelles", zh: "新闻", en: "News", href: "/#news" },
  { de: "Über uns", zh: "关于我们", en: "About", href: "/#about" },
  { de: "Kontakt", zh: "联系", en: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { showEnglish } = useContent();
  const showEn = showEnglish.nav !== false;

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-[var(--school-red)] shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo + school name */}
        <a href="/" className="flex items-center gap-3 group" aria-label="Yi Xin Schulhomepage">
          <SchoolLogo size={44} />
          <div className="leading-tight">
            <p className="font-cn font-bold text-[var(--school-dark)] text-base sm:text-lg leading-none tracking-wide">
              一心中文学校
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 tracking-tight">
              Yi Xin Sprachschule Heilbronn
            </p>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Hauptnavigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-2.5 py-2 text-sm font-medium text-[var(--school-dark)] rounded hover:bg-[var(--school-red-light)] hover:text-[var(--school-red)] transition-colors"
            >
              <span className="font-cn">{link.zh}</span>
              <span className="text-xs text-gray-400 ml-1">· {link.de}{showEn && ` · ${link.en}`}</span>
            </a>
          ))}
        </nav>

        {/* Right side: admin button + mobile hamburger */}
        <div className="flex items-center gap-3">
          <a
            href="/admin"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[var(--school-red)] text-[var(--school-red)] rounded hover:bg-[var(--school-red)] hover:text-white transition-colors"
            aria-label="Admin Login"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Admin
          </a>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded text-[var(--school-dark)] hover:bg-[var(--school-red-light)] transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menü öffnen"
            aria-expanded={open}
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          className="md:hidden border-t border-[var(--school-border)] bg-white"
          aria-label="Mobile Navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-6 py-3 text-sm font-medium text-[var(--school-dark)] hover:bg-[var(--school-red-light)] hover:text-[var(--school-red)] border-b border-[var(--school-border)] transition-colors"
            >
              <span className="font-cn">{link.zh}</span> · {link.de}{showEn && ` · ${link.en}`}
            </a>
          ))}
          <a
            href="/admin"
            onClick={() => setOpen(false)}
            aria-label="Admin Login"
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-[var(--school-red)] hover:bg-[var(--school-red-light)] transition-colors"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Admin Login
          </a>
        </nav>
      )}
    </header>
  );
}
