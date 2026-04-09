import type { Metadata } from "next";
import EditablePageLayout from "@/components/admin/EditablePageLayout";

export const metadata: Metadata = {
  title: "Impressum",
  description:
    "Impressum der Yi Xin Chinesischen Sprachschule Heilbronn – " +
    "Legal notice of Yi Xin Chinese Language School Heilbronn – " +
    "海尔布隆一心中文学校法律信息",
};

export default function ImpressumPage() {
  return <EditablePageLayout section="impressum" label="Impressum" />;
}
