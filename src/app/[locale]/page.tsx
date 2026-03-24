import { getTranslations } from "next-intl/server";
import CourseSchedule from "@/components/CourseSchedule";
import NewsSection from "@/components/NewsSection";
import HeroSection from "@/components/HeroSection";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <div>
      <HeroSection />
      
      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-red-700">
            {t("about_title")}
          </h2>
          <p className="text-lg text-center text-gray-700 leading-relaxed">
            {t("about_text")}
          </p>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-red-700">
            {t("courses_title")}
          </h2>
          <CourseSchedule locale={locale} />
        </div>
      </section>

      {/* News Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-red-700">
            {t("news_title")}
          </h2>
          <NewsSection locale={locale} />
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-8 text-red-700">
            {t("contact_title")}
          </h2>
          <div className="space-y-4 text-gray-700">
            <p className="flex items-center justify-center gap-2">
              <span>📍</span> {t("address")}
            </p>
            <p className="flex items-center justify-center gap-2">
              <span>✉️</span>{" "}
              <a href={`mailto:${t("email")}`} className="text-red-700 hover:underline">
                {t("email")}
              </a>
            </p>
            <p className="flex items-center justify-center gap-2">
              <span>📞</span>{" "}
              <a href={`tel:${t("phone")}`} className="text-red-700 hover:underline">
                {t("phone")}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
