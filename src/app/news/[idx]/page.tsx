"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useContent } from "@/contexts/ContentContext";
import { useAuth } from "@/contexts/AuthContext";
import { getNewsBodyBlocks } from "@/i18n/translations";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";
import { sanitizeHtml } from "@/lib/sanitize-html";

export default function NewsDetailPage() {
  const params = useParams();
  const idx = parseInt(params.idx as string, 10);
  const { getContent, isEnglishVisible } = useContent();
  const { isAdmin } = useAuth();
  const showEn = isEnglishVisible("news");

  const de = getContent("de");
  const zh = getContent("zh");
  const en = getContent("en");
  const news = !isNaN(idx) ? de.news.items[idx] : undefined;
  const zhNews = !isNaN(idx) ? zh.news.items[idx] : undefined;
  const enNews = !isNaN(idx) ? en.news.items[idx] : undefined;

  if (isNaN(idx) || idx < 0) {
    notFound();
  }

  if (!news) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-700 mb-4">Artikel nicht gefunden / 文章未找到 / Article not found</h1>
            <Link href="/#news" className="text-school-red underline">← Zurück / 返回 / Back</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const deBlocks = getNewsBodyBlocks(news);
  const zhBlocks = zhNews ? getNewsBodyBlocks(zhNews) : [];
  const enBlocks = enNews ? getNewsBodyBlocks(enNews) : [];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-school-gray py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href="/#news" className="text-sm text-school-red hover:opacity-80 transition-opacity">
              ← {de.news.sectionTitle || "Aktuelles"} / 返回 / Back
            </Link>
            {isAdmin && (
              <Link
                href={`/admin/news/${idx}`}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded transition-colors"
              >
                ✏ Bearbeiten / Edit / 编辑
              </Link>
            )}
          </div>

          <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8">
              <time className="text-xs font-semibold text-school-red tracking-widest">
                {news.date}
              </time>
              {zhNews && <h1 className="font-cn text-2xl font-bold text-school-dark mt-2 mb-1">{zhNews.title}</h1>}
              {news.title.trim() && <h2 className="text-lg text-gray-500 mb-1">{news.title}</h2>}
              {showEn && enNews && enNews.title.trim() && <h2 className="text-base text-gray-400 mb-6">{enNews.title}</h2>}

              {/* Chinese blocks */}
              {zhBlocks.length > 0 && (
                <div className="mb-4">
                  {zhBlocks.map((block, i) =>
                    block.type === "text" ? (
                      <div key={i} className="font-cn text-base text-gray-700 leading-loose mb-4 whitespace-pre-wrap rich-text-content"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
                      />
                    ) : (
                      <figure key={i} className="mb-4">
                        <Image
                          src={block.url}
                          alt={block.caption ?? news.title}
                          width={800}
                          height={400}
                          unoptimized
                          className="w-full h-auto rounded"
                        />
                        {block.caption && (
                          <figcaption className="text-xs text-gray-400 text-center mt-2 italic">{block.caption}</figcaption>
                        )}
                      </figure>
                    )
                  )}
                </div>
              )}

              {/* German blocks */}
              {deBlocks.length > 0 ? (
                deBlocks.map((block, i) =>
                  block.type === "text" ? (
                    <div key={i} className="text-sm text-gray-500 leading-relaxed mb-4 whitespace-pre-wrap rich-text-content"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
                    />
                  ) : (
                    <figure key={i} className="mb-4">
                      <Image
                        src={block.url}
                        alt={block.caption ?? news.title}
                        width={800}
                        height={400}
                        unoptimized
                        className="w-full h-auto rounded"
                      />
                      {block.caption && (
                        <figcaption className="text-xs text-gray-400 text-center mt-2 italic">{block.caption}</figcaption>
                      )}
                    </figure>
                  )
                )
              ) : (
                <div className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">
                  {news.body}
                </div>
              )}

              {/* English blocks */}
              {showEn && enBlocks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {enBlocks.map((block, i) =>
                    block.type === "text" ? (
                      <div key={i} className="text-sm text-gray-400 leading-relaxed mb-4 whitespace-pre-wrap rich-text-content"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
                      />
                    ) : (
                      <figure key={i} className="mb-4">
                        <Image
                          src={block.url}
                          alt={block.caption ?? (enNews?.title || news.title)}
                          width={800}
                          height={400}
                          unoptimized
                          className="w-full h-auto rounded"
                        />
                        {block.caption && (
                          <figcaption className="text-xs text-gray-400 text-center mt-2 italic">{block.caption}</figcaption>
                        )}
                      </figure>
                    )
                  )}
                </div>
              )}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
