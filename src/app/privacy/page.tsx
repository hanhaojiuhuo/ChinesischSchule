"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContent } from "@/contexts/ContentContext";

export default function PrivacyPage() {
  const { getContent, isEnglishVisible } = useContent();
  const de = getContent("de");
  const zh = getContent("zh");
  const en = getContent("en");
  const showEn = isEnglishVisible("privacy");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-school-gray">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          {/* Page heading */}
          <div className="text-center mb-12">
            <div className="flex justify-center gap-1.5 mb-4">
              <span className="block w-8 h-1 bg-school-red rounded" />
              <span className="block w-3 h-1 bg-school-red rounded opacity-50" />
            </div>
            <h1 className="font-cn text-3xl font-bold text-school-dark mb-2">
              {zh.privacy.pageTitle}
            </h1>
            <p className="text-lg text-gray-500">
              {de.privacy.pageTitle}{showEn && ` · ${en.privacy.pageTitle}`}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-school-border p-8 space-y-10 text-sm text-gray-700 leading-relaxed">
            {/* DE content */}
            <section>
              <h2 className="text-base font-bold text-school-dark mb-3 pb-1 border-b border-gray-100">
                {de.privacy.pageTitle}
              </h2>
              <div className="whitespace-pre-line">{de.privacy.content}</div>
            </section>

            {/* ZH content */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="font-cn text-base font-bold text-school-dark mb-3 pb-1 border-b border-gray-100">
                {zh.privacy.pageTitle}
              </h2>
              <div className="font-cn whitespace-pre-line text-gray-600 leading-loose">
                {zh.privacy.content}
              </div>
            </section>

            {/* EN content */}
            {showEn && (
              <section className="border-t border-gray-100 pt-8">
                <h2 className="text-base font-bold text-school-dark mb-3 pb-1 border-b border-gray-100">
                  {en.privacy.pageTitle}
                </h2>
                <div className="whitespace-pre-line">{en.privacy.content}</div>
              </section>
            )}
          </div>

          <p className="text-center mt-8 text-xs text-gray-400">
            <Link href="/" className="hover:text-school-red underline transition-colors">
              ← 返回网站 / Zurück zur Website / Back to site
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
