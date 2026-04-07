"use client";

import { useState, useEffect, useRef, startTransition } from "react";

const CONSENT_KEY = "yixin-cookie-consent";

type ConsentState = "all" | "essential" | null;

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startTransition(() => {
      try {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (!stored) {
          setVisible(true);
        }
      } catch {
        setVisible(true);
      }
    });
  }, []);

  // Measure the banner height so the spacer keeps footer content accessible
  useEffect(() => {
    if (!visible || !bannerRef.current) {
      setBannerHeight(0);
      return;
    }
    const ro = new ResizeObserver(([entry]) => {
      setBannerHeight(entry.contentRect.height + 24); // 24px extra breathing room
    });
    ro.observe(bannerRef.current);
    return () => ro.disconnect();
  }, [visible, showDetails]);

  function saveConsent(choice: ConsentState) {
    try {
      localStorage.setItem(CONSENT_KEY, choice ?? "essential");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <>
      {/* Spacer so fixed banner doesn't cover footer content */}
      <div style={{ height: bannerHeight }} aria-hidden="true" />

      <div
        ref={bannerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cookie-Einstellungen / Cookie Settings"
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t-2 border-[var(--school-red)] shadow-2xl px-4 py-5 sm:px-6"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--school-dark)] mb-1">
                🍪 Datenschutz & Cookies · Privacy &amp; Cookies
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong>DE:</strong> Diese Website verwendet ausschließlich technisch notwendige Cookies (Session-Daten für die Administrationsfunktion). Es werden keinerlei Tracking- oder Analysedaten erhoben und keine personenbezogenen Daten an Dritte weitergegeben.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed mt-1">
                <strong>EN:</strong> This website uses only strictly necessary cookies (session data for the admin function). We do not collect any tracking or analytics data, and no personal data is shared with third parties.
              </p>

              {showDetails && (
                <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 text-xs space-y-2">
                  <p className="font-semibold text-[var(--school-dark)]">
                    Cookie-Details / Cookie Details
                  </p>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-1 pr-3 font-semibold text-gray-600">Name</th>
                        <th className="py-1 pr-3 font-semibold text-gray-600">Zweck / Purpose</th>
                        <th className="py-1 font-semibold text-gray-600">Typ / Type</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-500">
                      <tr className="border-b border-gray-100">
                        <td className="py-1 pr-3 font-mono">yixin-admin-session</td>
                        <td className="py-1 pr-3">Admin-Login-Session / Admin login session</td>
                        <td className="py-1 text-green-700 font-semibold">Notwendig / Essential</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1 pr-3 font-mono">yixin-cookie-consent</td>
                        <td className="py-1 pr-3">Speichert Ihre Cookie-Einwilligung / Stores your consent</td>
                        <td className="py-1 text-green-700 font-semibold">Notwendig / Essential</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-3 text-gray-400 italic" colSpan={3}>
                          Keine Tracking- oder Marketing-Cookies · No tracking or marketing cookies
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-gray-400 mt-1">
                    Mehr Informationen finden Sie in unserer{" "}
                    <a href="/privacy" className="underline hover:text-[var(--school-red)]">
                      Datenschutzerklärung
                    </a>
                    {" "}· More information in our{" "}
                    <a href="/privacy" className="underline hover:text-[var(--school-red)]">
                      Privacy Policy
                    </a>.
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowDetails((v) => !v)}
                className="mt-2 text-xs text-[var(--school-red)] underline hover:opacity-80 transition-opacity"
              >
                {showDetails
                  ? "Details ausblenden / Hide details"
                  : "Details anzeigen / Customize / Show details"}
              </button>
            </div>

            <div className="flex flex-row sm:flex-col gap-2 shrink-0">
              <button
                onClick={() => saveConsent("all")}
                className="px-5 py-2 bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] text-white text-sm font-semibold rounded transition-colors whitespace-nowrap"
              >
                Alle akzeptieren · Accept All
              </button>
              <button
                onClick={() => saveConsent("essential")}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded transition-colors whitespace-nowrap border border-gray-300"
              >
                Nur Notwendige · Essential Only
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
