import { getTranslations } from "next-intl/server";
import NewsSection from "@/components/NewsSection";

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "news" });

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12 text-red-700">
          {t("title")}
        </h1>
        <NewsSection locale={locale} />
      </div>
    </div>
  );
}
