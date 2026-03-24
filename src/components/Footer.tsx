import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-lg font-semibold mb-2">{t("school_name")}</p>
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} {t("school_name")} — {t("rights")}
        </p>
        <div className="mt-4 flex justify-center gap-4 text-sm text-gray-400">
          <span>Heilbronn, Germany</span>
          <span>•</span>
          <a href="mailto:info@yixin-chinese.de" className="hover:text-white transition-colors">
            info@yixin-chinese.de
          </a>
        </div>
      </div>
    </footer>
  );
}
