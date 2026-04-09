import type { Metadata } from "next";
import EditablePageLayout from "@/components/admin/EditablePageLayout";

export const metadata: Metadata = {
  title: "Datenschutz / Privacy Policy / 隐私政策",
  description:
    "Datenschutzerklärung der Yi Xin Chinesischen Sprachschule Heilbronn – " +
    "Privacy policy of Yi Xin Chinese Language School Heilbronn – " +
    "海尔布隆一心中文学校隐私政策",
};

export default function PrivacyPage() {
  return <EditablePageLayout section="privacy" label="Privacy" />;
}
