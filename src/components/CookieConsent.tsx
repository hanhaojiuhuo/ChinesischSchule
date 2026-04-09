"use client";

import { useState, useEffect, useRef, startTransition } from "react";

const CONSENT_KEY = "yixin-cookie-consent";
/** Extra pixels below the measured banner so the footer never sits flush against it. */
const BANNER_BOTTOM_PADDING = 24;

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
      // When not visible the component returns null, so the spacer is not
      // rendered and resetting bannerHeight is unnecessary.
      return;
    }
    const ro = new ResizeObserver(([entry]) => {
      setBannerHeight(entry.contentRect.height + BANNER_BOTTOM_PADDING);
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
        aria-label="Cookie-Einstellungen / Cookie Settings / Cookie设置"
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t-2 border-school-red shadow-2xl px-4 py-5 sm:px-6"
        data-testid="cookie-consent-banner"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-school-dark mb-1">
                🍪 Datenschutz & Cookies · Privacy &amp; Cookies · 隐私与Cookie
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong>DE:</strong> Diese Website verwendet ausschließlich technisch notwendige Cookies (Session-Daten für die Administrationsfunktion). Es werden keinerlei Tracking- oder Analysedaten erhoben und keine personenbezogenen Daten an Dritte weitergegeben.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed mt-1">
                <strong>EN:</strong> This website uses only strictly necessary cookies (session data for the admin function). We do not collect any tracking or analytics data, and no personal data is shared with third parties.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed mt-1">
                <strong>中文:</strong> 本网站仅使用必要的技术性Cookie（管理功能的会话数据）。我们不收集任何跟踪或分析数据，也不会将个人数据分享给第三方。
              </p>

              {showDetails && (
                <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 text-xs space-y-2">
                  <p className="font-semibold text-school-dark">
                    Cookie-Details / Cookie Details / Cookie详情
                  </p>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-1 pr-3 font-semibold text-gray-600">Name</th>
                        <th className="py-1 pr-3 font-semibold text-gray-600">Zweck / Purpose / 用途</th>
                        <th className="py-1 font-semibold text-gray-600">Typ / Type / 类型</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-500">
                      <tr className="border-b border-gray-100">
                        <td className="py-1 pr-3 font-mono">yixin-admin-session</td>
                        <td className="py-1 pr-3">Admin-Login-Session / Admin login session / 管理员登录会话</td>
                        <td className="py-1 text-green-700 font-semibold">Notwendig / Essential / 必要</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1 pr-3 font-mono">yixin-cookie-consent</td>
                        <td className="py-1 pr-3">Speichert Ihre Cookie-Einwilligung / Stores your consent / 存储您的Cookie同意</td>
                        <td className="py-1 text-green-700 font-semibold">Notwendig / Essential / 必要</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-3 text-gray-400 italic" colSpan={3}>
                          Keine Tracking- oder Marketing-Cookies · No tracking or marketing cookies · 无跟踪或营销Cookie
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-gray-400 mt-1">
                    Mehr Informationen finden Sie in unserer{" "}
                    <a href="/privacy" className="underline hover:text-school-red">Datenschutzerklärung</a>
                    {" "}· More information in our{" "}
                    <a href="/privacy" className="underline hover:text-school-red">Privacy Policy</a>
                    {" "}· 更多信息请参阅我们的
                    <a href="/privacy" className="underline hover:text-school-red">隐私政策</a>。
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowDetails((v) => !v)}
                className="mt-2 text-xs text-school-red underline hover:opacity-80 transition-opacity"
                data-testid="cookie-details-toggle"
              >
                {showDetails
                  ? "Details ausblenden / Hide details / 隐藏详情"
                  : "Details anzeigen / Show details / 显示详情"}
              </button>
            </div>

            <div className="flex flex-row sm:flex-col gap-2 shrink-0">
              <button
                onClick={() => saveConsent("all")}
                className="px-5 py-2 bg-school-red hover:bg-school-red-dark text-white text-sm font-semibold rounded transition-colors whitespace-nowrap"
                data-testid="cookie-accept-all"
              >
                Alle akzeptieren · Accept All · 全部接受
              </button>
              <button
                onClick={() => saveConsent("essential")}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded transition-colors whitespace-nowrap border border-gray-300"
                data-testid="cookie-essential-only"
              >
                Nur Notwendige · Essential Only · 仅必要
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
