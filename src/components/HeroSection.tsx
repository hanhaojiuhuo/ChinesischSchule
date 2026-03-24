import { useTranslations } from "next-intl";
import Link from "next/link";

export default function HeroSection() {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");

  return (
    <section className="relative bg-gradient-to-br from-red-700 via-red-800 to-red-900 text-white overflow-hidden">
      {/* Decorative Chinese pattern */}
      <div className="absolute inset-0 opacity-10 font-chinese">
        <div className="absolute top-4 right-4 text-9xl select-none">福</div>
        <div className="absolute bottom-4 left-4 text-9xl select-none">学</div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] select-none opacity-5">
          中
        </div>
      </div>

      <div className="relative container mx-auto px-4 py-24 text-center">
        {/* Vertical Chinese accent text */}
        <div className="flex justify-center mb-6">
          <div
            className="text-red-200 text-xl font-light tracking-[0.5em] hidden sm:flex flex-col items-center font-chinese"
            style={{ writingMode: "vertical-rl" } as React.CSSProperties}
          >
            <span>益新中文学校</span>
          </div>
          <div className="sm:mx-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {t("hero_title")}
            </h1>
            <p className="text-xl md:text-2xl text-red-200 mb-4">
              {t("hero_subtitle")}
            </p>
            <p className="text-base md:text-lg text-red-100 max-w-2xl mx-auto mb-8">
              {t("hero_description")}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="#courses"
                className="px-8 py-3 bg-white text-red-700 rounded-full font-semibold hover:bg-red-50 transition-colors"
              >
                {tNav("courses")}
              </Link>
              <Link
                href="#contact"
                className="px-8 py-3 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-red-700 transition-colors"
              >
                {tNav("contact")}
              </Link>
            </div>
          </div>
          <div
            className="text-red-200 text-xl font-light tracking-[0.5em] hidden sm:flex flex-col items-center font-chinese"
            style={{ writingMode: "vertical-rl" } as React.CSSProperties}
          >
            <span>学中文·爱文化</span>
          </div>
        </div>
      </div>
    </section>
  );
}
