"use client";

import { useState } from "react";
import SchoolLogo from "./SchoolLogo";

const navLinks = [
  { label: "首页 Home", href: "#home" },
  { label: "关于 Über uns", href: "#about" },
  { label: "课程 Kurse", href: "#courses" },
  { label: "新闻 Aktuelles", href: "#news" },
  { label: "联系 Kontakt", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-[var(--school-red)] shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo + school name */}
        <a href="#home" className="flex items-center gap-3 group" aria-label="Yi Xin Schulhomepage">
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
              className="px-3 py-2 text-sm font-medium text-[var(--school-dark)] rounded hover:bg-[var(--school-red-light)] hover:text-[var(--school-red)] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

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
              className="block px-6 py-3 text-sm font-medium text-[var(--school-dark)] hover:bg-[var(--school-red-light)] hover:text-[var(--school-red)] border-b border-[var(--school-border)] last:border-b-0 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
