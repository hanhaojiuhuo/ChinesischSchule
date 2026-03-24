"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { ContentProvider } from "@/contexts/ContentContext";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <ContentProvider>{children}</ContentProvider>
    </LanguageProvider>
  );
}
