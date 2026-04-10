import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const siteUrl = "https://www.yixin-heilbronn.de";

/**
 * Static sitemap — dates reflect the most recent known content update.
 * Because `force-static` is set, `new Date()` would freeze at build time
 * and produce a misleading timestamp.  Use an explicit date instead.
 */
const LAST_CONTENT_UPDATE = "2026-04-10";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
}
