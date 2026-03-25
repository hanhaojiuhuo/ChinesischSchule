"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { ContentProvider } from "@/contexts/ContentContext";
import { AuthProvider } from "@/contexts/AuthContext";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <ContentProvider>
        <AuthProvider>{children}</AuthProvider>
      </ContentProvider>
    </LanguageProvider>
  );
}
