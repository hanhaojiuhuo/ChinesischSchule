"use client";

import React from "react";
import type { SiteContent } from "@/i18n/translations";
import { EditField } from "@/components/admin/EditHelpers";
import ContactForm from "@/components/ContactForm";

interface ContactSectionProps {
  isAdmin: boolean;
  de: SiteContent;
  zh: SiteContent;
  en: SiteContent;
  showEn: (section: string) => boolean;
  updDe: <K extends keyof SiteContent>(section: K, patch: Partial<SiteContent[K]> & object) => void;
  updZh: <K extends keyof SiteContent>(section: K, patch: Partial<SiteContent[K]> & object) => void;
  updDeAddrLine: (idx: number, val: string) => void;
  updZhAddrLine: (idx: number, val: string) => void;
}

export default function ContactSection({
  isAdmin,
  de,
  zh,
  en,
  showEn,
  updDe,
  updZh,
  updDeAddrLine,
  updZhAddrLine,
}: ContactSectionProps) {
  return (
        <section id="contact" data-testid="section-contact" className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <span className="block w-8 h-1 bg-school-red rounded" />
            </div>
            <h2 className="font-cn text-2xl font-bold text-school-dark mb-1 flex items-center justify-center gap-2 flex-wrap">
              {isAdmin ? (
                <>
                  <EditField
                    value={de.contact.sectionTitle}
                    onChange={(v) => updDe("contact", { sectionTitle: v })}
                    className="text-2xl font-bold text-school-dark"
                    placeholder="DE title…"
                  />
                  <span className="text-lg font-normal text-gray-400">·</span>
                  <EditField
                    value={zh.contact.sectionTitle}
                    onChange={(v) => updZh("contact", { sectionTitle: v })}
                    className="text-lg font-normal text-gray-400"
                    placeholder="ZH 标题…"
                  />
                </>
              ) : (
                <>
                  {zh.contact.sectionTitle}
                  <span className="text-lg font-normal text-gray-400 ml-2">· {de.contact.sectionTitle}{showEn("contact") && en.contact.sectionTitle.trim() && ` · ${en.contact.sectionTitle}`}</span>
                </>
              )}
            </h2>

            <div className={`grid ${isAdmin ? "" : "md:grid-cols-2"} gap-8 text-left mt-8`}>
              {/* Left column: Contact info cards */}
              <div className="space-y-4">
                <div className={`bg-school-gray rounded-lg p-5 border border-school-border${isAdmin ? " ring-2 ring-amber-300" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📍</span>
                    <div className="flex-1">
                      {isAdmin ? (
                        <div className="space-y-1">
                          <EditField value={de.contact.addressTitle} onChange={(v) => updDe("contact", { addressTitle: v })} className="font-semibold text-school-dark text-sm w-full" placeholder="DE Address title…" />
                          <EditField value={zh.contact.addressTitle} onChange={(v) => updZh("contact", { addressTitle: v })} className="font-cn text-xs text-gray-400 w-full" placeholder="ZH 地址标题…" />
                          {de.contact.addressLines.map((l, i) => (
                            <EditField key={`de-addr-${i}`} value={l} onChange={(v) => updDeAddrLine(i, v)} className="text-sm text-gray-600 w-full" placeholder={`DE address line ${i + 1}…`} />
                          ))}
                          {zh.contact.addressLines.map((l, i) => (
                            <EditField key={`zh-addr-${i}`} value={l} onChange={(v) => updZhAddrLine(i, v)} className="font-cn text-xs text-gray-400 w-full" placeholder={`ZH 地址行 ${i + 1}…`} />
                          ))}
                        </div>
                      ) : (
                        <>
                          <h3 className="font-cn font-semibold text-school-dark mb-0.5 text-sm">{zh.contact.addressTitle}</h3>
                          {de.contact.addressTitle.trim() && <p className="text-xs text-gray-400 mb-0.5">{de.contact.addressTitle}</p>}
                          {showEn("contact") && en.contact.addressTitle.trim() && <p className="text-xs text-gray-400 mb-1">{en.contact.addressTitle}</p>}
                          {zh.contact.addressLines.map((l) => (<p key={l} className="font-cn text-sm text-gray-600">{l}</p>))}
                          {de.contact.addressLines.map((l) => (<p key={l} className="text-xs text-gray-400">{l}</p>))}
                          {showEn("contact") && en.contact.addressLines.map((l) => (<p key={l} className="text-xs text-gray-400">{l}</p>))}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`bg-school-gray rounded-lg p-5 border border-school-border${isAdmin ? " ring-2 ring-amber-300" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✉️</span>
                    <div className="flex-1">
                      {isAdmin ? (
                        <div className="space-y-1">
                          <EditField value={de.contact.emailTitle} onChange={(v) => updDe("contact", { emailTitle: v })} className="font-semibold text-school-dark text-sm w-full" placeholder="DE Email title…" />
                          <EditField value={zh.contact.emailTitle} onChange={(v) => updZh("contact", { emailTitle: v })} className="font-cn text-xs text-gray-400 w-full" placeholder="ZH 邮箱标题…" />
                          <EditField value={de.contact.email} onChange={(v) => { updDe("contact", { email: v }); updZh("contact", { email: v }); }} className="text-sm text-gray-600 w-full" placeholder="email@example.com" />
                        </div>
                      ) : (
                        <>
                          <h3 className="font-cn font-semibold text-school-dark mb-0.5 text-sm">{zh.contact.emailTitle}</h3>
                          {de.contact.emailTitle.trim() && <p className="text-xs text-gray-400 mb-0.5">{de.contact.emailTitle}</p>}
                          {showEn("contact") && en.contact.emailTitle.trim() && <p className="text-xs text-gray-400 mb-1">{en.contact.emailTitle}</p>}
                          <p className="text-sm text-gray-600">{de.contact.email}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {(isAdmin || de.contact.phone) && (
                  <div className={`bg-school-gray rounded-lg p-5 border border-school-border${isAdmin ? " ring-2 ring-amber-300" : ""}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📞</span>
                      <div className="flex-1">
                        {isAdmin ? (
                          <div className="space-y-1">
                            <EditField value={de.contact.phoneTitle} onChange={(v) => updDe("contact", { phoneTitle: v })} className="font-semibold text-school-dark text-sm w-full" placeholder="DE Phone title…" />
                            <EditField value={zh.contact.phoneTitle} onChange={(v) => updZh("contact", { phoneTitle: v })} className="font-cn text-xs text-gray-400 w-full" placeholder="ZH 电话标题…" />
                            <EditField value={de.contact.phone} onChange={(v) => { updDe("contact", { phone: v }); updZh("contact", { phone: v }); }} className="text-sm text-gray-600 w-full" placeholder="+49 123 456789" />
                          </div>
                        ) : (
                          <>
                            <h3 className="font-cn font-semibold text-school-dark mb-0.5 text-sm">{zh.contact.phoneTitle}</h3>
                            {de.contact.phoneTitle.trim() && <p className="text-xs text-gray-400 mb-0.5">{de.contact.phoneTitle}</p>}
                            {showEn("contact") && en.contact.phoneTitle.trim() && <p className="text-xs text-gray-400 mb-1">{en.contact.phoneTitle}</p>}
                            <p className="text-sm text-gray-600">{de.contact.phone}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: Contact form — only shown for non-admin visitors */}
              {!isAdmin && (
                <div className="bg-school-gray rounded-lg p-6 border border-school-border">
                  <h3 className="font-cn text-lg font-semibold text-school-dark mb-1 text-center">
                    给我们留言
                  </h3>
                  <p className="text-xs text-gray-400 text-center mb-2">
                    Schreiben Sie uns · Send us a message
                  </p>
                  <ContactForm />
                </div>
              )}
            </div>
          </div>
        </section>
  );
}
