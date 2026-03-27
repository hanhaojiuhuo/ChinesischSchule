"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useContent } from "@/contexts/ContentContext";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NewsDetailPage() {
  const params = useParams();
  const idx = parseInt(params.idx as string, 10);
  const { getContent } = useContent();
  const { isAdmin } = useAuth();

  const de = getContent("de");
  const zh = getContent("zh");
  const news = !isNaN(idx) ? de.news.items[idx] : undefined;
  const zhNews = !isNaN(idx) ? zh.news.items[idx] : undefined;

  if (!news) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-700 mb-4">Artikel nicht gefunden / 文章未找到</h1>
            <Link href="/#news" className="text-[var(--school-red)] underline">← Zurück / 返回</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--school-gray)] py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href="/#news" className="text-sm text-[var(--school-red)] hover:opacity-80 transition-opacity">
              ← {de.news.sectionTitle || "Aktuelles"} / 返回
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
            {news.imageUrl && news.imagePosition !== "after" && (
              <figure>
                <img
                  src={news.imageUrl}
                  alt={news.imageCaption ?? news.title}
                  className="w-full max-h-96 object-cover"
                />
                {news.imageCaption && (
                  <figcaption className="text-xs text-gray-400 text-center py-2 px-4 italic">{news.imageCaption}</figcaption>
                )}
              </figure>
            )}

            <div className="p-8">
              <time className="text-xs font-semibold text-[var(--school-red)] tracking-widest">
                {news.date}
              </time>
              {zhNews && <h1 className="font-cn text-2xl font-bold text-[var(--school-dark)] mt-2 mb-1">{zhNews.title}</h1>}
              <h2 className="text-lg text-gray-500 mb-6">{news.title}</h2>

              {zhNews && (
                <div className="font-cn text-base text-gray-700 leading-loose mb-4 whitespace-pre-wrap">
                  {zhNews.body}
                </div>
              )}
              <div className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">
                {news.body}
              </div>

              {news.imageUrl && news.imagePosition === "after" && (
                <figure className="mt-6">
                  <img
                    src={news.imageUrl}
                    alt={news.imageCaption ?? news.title}
                    className="w-full max-h-96 object-cover rounded"
                  />
                  {news.imageCaption && (
                    <figcaption className="text-xs text-gray-400 text-center mt-2 italic">{news.imageCaption}</figcaption>
                  )}
                </figure>
              )}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
