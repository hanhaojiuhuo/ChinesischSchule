import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "./ClientProviders";

const siteUrl = "https://www.yixin-heilbronn.de";

export const metadata: Metadata = {
  title: {
    default:
      "Yi Xin Chinesische Sprachschule Heilbronn – Chinesisch lernen in Heilbronn",
    template: "%s | Yi Xin Chinesische Sprachschule Heilbronn",
  },
  description:
    "Yi Xin Chinesische Sprachschule Heilbronn – Chinesisch lernen für Kinder " +
    "und Erwachsene nahe Heilbronn. Chinese language school near Heilbronn, " +
    "Baden-Württemberg. Kurse für alle Altersgruppen: Kinder ab 6 Jahren bis Erwachsene. " +
    "欢迎来到海尔布隆一心中文学校，提供专业中文课程。",
  keywords: [
    "chinesische sprachschule heilbronn",
    "chinese language school heilbronn",
    "chinese language school near heilbronn",
    "chinesisch lernen heilbronn",
    "lernen chinese heilbronn",
    "chinese school heilbronn",
    "chinesischkurs heilbronn",
    "mandarin kurs heilbronn",
    "mandarin lernen heilbronn",
    "chinese for kids heilbronn",
    "chinesisch für kinder heilbronn",
    "yi xin heilbronn",
    "一心中文学校",
    "海尔布隆中文学校",
    "chinesisch kurs heilbronn",
    "chinese school near heilbronn",
    "sprachschule heilbronn chinesisch",
    "HSK kurs heilbronn",
  ],
  authors: [
    {
      name: "Yi Xin Chinesische Sprachschule Heilbronn",
      url: siteUrl,
    },
  ],
  creator: "Yi Xin Chinesische Sprachschule Heilbronn",
  publisher: "Yi Xin Chinesische Sprachschule Heilbronn",
  alternates: {
    canonical: siteUrl,
    languages: {
      de: siteUrl,
      zh: siteUrl,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Yi Xin Chinesische Sprachschule Heilbronn",
    title:
      "Yi Xin Chinesische Sprachschule Heilbronn – Chinesisch lernen in Heilbronn",
    description:
      "Chinesisch lernen für Kinder und Erwachsene in Heilbronn. " +
      "Chinese language school near Heilbronn, Baden-Württemberg, Germany. " +
      "Kurse für alle Altersgruppen. 课程面向6岁至成人。",
    locale: "de_DE",
    alternateLocale: ["zh_CN"],
  },
  twitter: {
    card: "summary",
    title:
      "Yi Xin Chinesische Sprachschule Heilbronn – Chinesisch lernen in Heilbronn",
    description:
      "Chinesisch lernen für Kinder und Erwachsene in Heilbronn. " +
      "Chinese language school near Heilbronn, Baden-Württemberg.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "MNIG-Zw29yYpMNspV7jl8dJpYIjqSPyKGVq0HKyCeuY",
  },
  icons: { icon: "/favicon.ico" },
  other: {
    "geo.region": "DE-BW",
    "geo.placename": "Heilbronn",
    "geo.position": "49.1417;9.2176",
    ICBM: "49.1417, 9.2176",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["LanguageSchool", "EducationalOrganization"],
  name: "Yi Xin Chinesische Sprachschule Heilbronn",
  alternateName: ["海尔布隆一心中文学校", "Yi Xin Chinese School Heilbronn"],
  url: siteUrl,
  email: "info@yixin-heilbronn.de",
  description:
    "Chinesisch lernen für Kinder und Erwachsene in Heilbronn. " +
    "Chinese language school near Heilbronn, Baden-Württemberg, Germany.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Heilbronn",
    addressRegion: "Baden-Württemberg",
    addressCountry: "DE",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 49.1417,
    longitude: 9.2176,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: "Saturday",
    opens: "09:00",
    closes: "13:00",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "info@yixin-heilbronn.de",
    contactType: "customer service",
    availableLanguage: ["German", "Chinese", "English"],
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Chinesisch-Kurse",
    itemListElement: [
      {
        "@type": "Course",
        name: "初级班 – Anfänger (6–10 Jahre)",
        description:
          "Pinyin, Grundvokabular und einfache Sätze. Für Kinder von 6–10 Jahren.",
        provider: {
          "@type": "LanguageSchool",
          name: "Yi Xin Chinesische Sprachschule Heilbronn",
        },
      },
      {
        "@type": "Course",
        name: "中级班 – Mittelstufe (10–14 Jahre)",
        description: "HSK 2–3, Lesen und Schreiben. Für Kinder von 10–14 Jahren.",
        provider: {
          "@type": "LanguageSchool",
          name: "Yi Xin Chinesische Sprachschule Heilbronn",
        },
      },
      {
        "@type": "Course",
        name: "高级班 – Fortgeschrittene (14+ Jahre)",
        description:
          "HSK 4–6, Konversation und Kultur. Für Jugendliche ab 14 Jahren.",
        provider: {
          "@type": "LanguageSchool",
          name: "Yi Xin Chinesische Sprachschule Heilbronn",
        },
      },
      {
        "@type": "Course",
        name: "成人班 – Erwachsene (18+ Jahre)",
        description:
          "Alltagskommunikation, Reise & Geschäft. Für Erwachsene ab 18 Jahren.",
        provider: {
          "@type": "LanguageSchool",
          name: "Yi Xin Chinesische Sprachschule Heilbronn",
        },
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
