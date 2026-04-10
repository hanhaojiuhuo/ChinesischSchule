import type { MetadataRoute } from "next";
import { defaultTranslations } from "@/i18n/translations";

export const dynamic = "force-static";

const siteUrl = "https://www.yixin-heilbronn.de";

/**
 * Sitemap including static pages and dynamic news article pages.
 * Because `force-static` is set, `new Date()` would freeze at build time
 * and produce a misleading timestamp.  Use an explicit date instead.
 */
const LAST_CONTENT_UPDATE = "2026-04-10";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/impressum`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Generate entries for known news pages from default translations
  const newsItems = defaultTranslations.de.news.items;
  const newsPages: MetadataRoute.Sitemap = newsItems.map((item, idx) => ({
    url: `${siteUrl}/news/${idx}`,
    // item.date is "YYYY-MM"; append "-01" for a valid ISO date
    lastModified: item.date ? `${item.date}-01` : LAST_CONTENT_UPDATE,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...newsPages];
}
