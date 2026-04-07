import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum · 法律声明 · Legal Notice",
  description:
    "Impressum der Yi Xin Chinesischen Sprachschule Heilbronn. Legal Notice of Yi Xin Chinese Language School Heilbronn.",
  robots: { index: false, follow: false },
};

export default function ImpressumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
