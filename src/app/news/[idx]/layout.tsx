import type { Metadata } from "next";
import { getServerContent } from "@/lib/server-content";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ idx: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { idx: idxStr } = await params;
  const idx = parseInt(idxStr, 10);

  const de = await getServerContent("de");
  const zh = await getServerContent("zh");

  const news = !isNaN(idx) && idx >= 0 ? de.news.items[idx] : undefined;
  const zhNews = !isNaN(idx) && idx >= 0 ? zh.news.items[idx] : undefined;

  if (!news) {
    return {
      title: "Artikel nicht gefunden / Article not found / 文章未找到",
    };
  }

  const title = [zhNews?.title, news.title].filter(Boolean).join(" – ");
  const description = news.body?.slice(0, 200) || news.title;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: news.date,
    },
  };
}

export default function NewsLayout({ children }: LayoutProps) {
  return children;
}
