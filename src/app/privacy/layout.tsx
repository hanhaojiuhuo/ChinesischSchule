import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung · 隐私政策 · Privacy Policy",
  description:
    "Datenschutzerklärung der Yi Xin Chinesischen Sprachschule Heilbronn gemäß DSGVO. Privacy Policy of Yi Xin Chinese Language School Heilbronn.",
  robots: { index: false, follow: false },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
