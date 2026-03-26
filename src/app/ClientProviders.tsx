"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { ContentProvider } from "@/contexts/ContentContext";
import { AuthProvider } from "@/contexts/AuthContext";
import CookieConsent from "@/components/CookieConsent";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <ContentProvider>
        <AuthProvider>
          {children}
          <CookieConsent />
        </AuthProvider>
      </ContentProvider>
    </LanguageProvider>
  );
}
