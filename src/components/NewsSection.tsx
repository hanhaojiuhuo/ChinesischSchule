"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { NewsItem } from "@/lib/supabase";

interface NewsSectionProps {
  locale: string;
}

export default function NewsSection({ locale }: NewsSectionProps) {
  const t = useTranslations("news");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        setNews(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getTitle = (item: NewsItem) => {
    if (locale === "de") return item.title_de;
    if (locale === "zh") return item.title_zh;
    return item.title_en;
  };

  const getContent = (item: NewsItem) => {
    if (locale === "de") return item.content_de;
    if (locale === "zh") return item.content_zh;
    return item.content_en;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      locale === "zh" ? "zh-CN" : locale === "de" ? "de-DE" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-700 border-t-transparent"></div>
      </div>
    );
  }

  if (news.length === 0) {
    return <p className="text-center text-gray-500 py-8">{t("no_news")}</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
      {news.map((item) => (
        <article
          key={item.id}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="h-2 bg-red-700" />
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {getTitle(item)}
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              {t("published")}: {formatDate(item.published_at)}
            </p>
            <p className="text-gray-700 leading-relaxed line-clamp-3">
              {getContent(item)}
            </p>
            <button className="mt-4 text-red-700 hover:text-red-800 font-medium text-sm transition-colors">
              {t("read_more")} →
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
