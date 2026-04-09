import { list } from "@vercel/blob";
import type { Language, SiteContent } from "@/i18n/translations";
import { defaultTranslations } from "@/i18n/translations";

type ContentOverrides = Partial<Record<Language, SiteContent>>;

const BLOB_PATHNAME = "yixin-content-overrides.json";

/**
 * Fetch site content overrides from Vercel Blob **server-side** (no client
 * fetch, no context dependency).  Falls back to default translations when
 * the blob is unavailable.
 *
 * This is intentionally a thin, standalone function so it can be called from
 * `generateMetadata`, `generateStaticParams`, and other server-only contexts
 * without importing React or any client module.
 */
export async function getServerContent(lang: Language): Promise<SiteContent> {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return defaultTranslations[lang];
    }

    const { blobs } = await list({
      prefix: BLOB_PATHNAME,
      limit: 1,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (blobs.length === 0) {
      return defaultTranslations[lang];
    }

    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) {
      return defaultTranslations[lang];
    }

    const raw = (await res.json()) as ContentOverrides;
    const override = raw[lang];
    if (!override) {
      return defaultTranslations[lang];
    }

    // Shallow-merge so newly-added default sections still appear
    return mergeWithDefaults(override, defaultTranslations[lang]);
  } catch {
    return defaultTranslations[lang];
  }
}

/**
 * Shallow-merge override sections with defaults.  Mirrors the logic in
 * ContentContext.tsx but without React dependencies.
 */
function mergeWithDefaults(override: SiteContent, defaults: SiteContent): SiteContent {
  const merged = { ...defaults };
  for (const key of Object.keys(override) as (keyof SiteContent)[]) {
    const overrideVal = override[key];
    const defaultVal = defaults[key];
    if (
      overrideVal != null &&
      typeof overrideVal === "object" &&
      !Array.isArray(overrideVal) &&
      defaultVal != null &&
      typeof defaultVal === "object" &&
      !Array.isArray(defaultVal)
    ) {
      (merged as Record<string, unknown>)[key] = { ...defaultVal, ...overrideVal };
    } else {
      (merged as Record<string, unknown>)[key] = overrideVal;
    }
  }
  return merged;
}
