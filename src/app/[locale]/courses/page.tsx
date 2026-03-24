import { getTranslations } from "next-intl/server";
import CourseSchedule from "@/components/CourseSchedule";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "courses" });

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4 text-red-700">
          {t("title")}
        </h1>
        <p className="text-center text-gray-600 mb-12">{t("subtitle")}</p>
        <CourseSchedule locale={locale} />
      </div>
    </div>
  );
}
