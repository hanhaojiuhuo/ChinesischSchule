import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "海尔布隆一心中文学校 – Yi Xin Chinesische Sprachschule Heilbronn",
  description:
    "Willkommen bei der Yi Xin Chinesischen Sprachschule Heilbronn. " +
    "欢迎来到海尔布隆一心中文学校。",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
