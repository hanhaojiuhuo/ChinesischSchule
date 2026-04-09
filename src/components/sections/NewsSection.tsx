"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { SiteContent, NewsItem, NewsTextBlock, NewsBodyBlock } from "@/i18n/translations";
import { getNewsBodyBlocks } from "@/i18n/translations";
import { countWords, MAX_WORDS_NEWS, validateImageFile, IMAGE_ACCEPT } from "@/lib/validation";
import { EditField, EditBlock } from "@/components/admin/EditHelpers";

interface NewsSectionProps {
  isAdmin: boolean;
  de: SiteContent;
  zh: SiteContent;
  en: SiteContent;
  showEn: (section: string) => boolean;
  newsPage: number;
  setNewsPage: React.Dispatch<React.SetStateAction<number>>;
  NEWS_PER_PAGE: number;
  setDraftDe: React.Dispatch<React.SetStateAction<SiteContent>>;
  setDraftZh: React.Dispatch<React.SetStateAction<SiteContent>>;
  updDeNews: (idx: number, key: keyof NewsItem, val: string) => void;
  updZhNews: (idx: number, key: keyof NewsItem, val: string) => void;
  updDeNewsBlocks: (idx: number, blocks: NewsBodyBlock[]) => void;
  updZhNewsBlocks: (idx: number, blocks: NewsBodyBlock[]) => void;
  addNews: () => void;
  removeNews: (idx: number) => void;
  handleNewsImageUpload: (file: File, lang: "de" | "zh", newsIdx: number, blockIdx: number) => void;
  newsUploadingIdx: { lang: "de" | "zh"; newsIdx: number; blockIdx: number } | null;
  setNewsUploadingIdx: React.Dispatch<React.SetStateAction<{ lang: "de" | "zh"; newsIdx: number; blockIdx: number } | null>>;
  newsUploadError: string;
  setNewsUploadError: React.Dispatch<React.SetStateAction<string>>;
  newsFileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function NewsSection({
  isAdmin,
  de,
  zh,
  en,
  showEn,
  newsPage,
  setNewsPage,
  NEWS_PER_PAGE,
  setDraftDe,
  setDraftZh,
  updDeNews,
  updZhNews,
  updDeNewsBlocks,
  updZhNewsBlocks,
  addNews,
  removeNews,
  handleNewsImageUpload,
  newsUploadingIdx,
  setNewsUploadingIdx,
  newsUploadError,
  setNewsUploadError,
  newsFileInputRef,
}: NewsSectionProps) {
  return (
        <section id="news" data-testid="section-news" className="py-16 px-4 bg-school-gray">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-8 h-1 bg-school-red rounded" />
              <h2 className="font-cn text-2xl font-bold text-school-dark flex items-center gap-2 flex-wrap">
                {isAdmin ? (
                  <>
                    <EditField
                      value={de.news.sectionTitle}
                      onChange={(v) =>
                        setDraftDe((d) => ({ ...d, news: { ...d.news, sectionTitle: v } }))
                      }
                      className="text-2xl font-bold text-school-dark"
                      placeholder="DE title…"
                    />
                    <span className="text-lg font-normal text-gray-400">·</span>
                    <EditField
                      value={zh.news.sectionTitle}
                      onChange={(v) =>
                        setDraftZh((d) => ({ ...d, news: { ...d.news, sectionTitle: v } }))
                      }
                      className="text-lg font-normal text-gray-400"
                      placeholder="ZH 标题…"
                    />
                  </>
                ) : (
                  <>
                    {zh.news.sectionTitle}
                    <span className="text-lg font-normal text-gray-400 ml-2">· {de.news.sectionTitle}{showEn("news") && en.news.sectionTitle.trim() && ` · ${en.news.sectionTitle}`}</span>
                  </>
                )}
              </h2>
            </div>

            {isAdmin && (
              <>
                {/* Hidden file input for news image uploads */}
                <input
                  ref={newsFileInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && newsUploadingIdx) {
                      const err = validateImageFile(file);
                      if (err) {
                        setNewsUploadError(err);
                        setNewsUploadingIdx(null);
                      } else {
                        handleNewsImageUpload(file, newsUploadingIdx.lang, newsUploadingIdx.newsIdx, newsUploadingIdx.blockIdx);
                      }
                    } else {
                      setNewsUploadingIdx(null);
                    }
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={addNews}
                  className="mb-6 w-full px-4 py-3 border-2 border-dashed border-amber-400 rounded-lg text-amber-700 hover:border-amber-500 hover:bg-amber-50 font-semibold text-sm transition-colors"
                >
                  + Add News Article / Neuigkeit hinzufügen / 添加新闻
                </button>
              </>
            )}

            <div className="space-y-6">
              {isAdmin ? (
                de.news.items.map((n, i) => {
                  const zhNews = zh.news.items[i];
                  const rawDeBlocks = getNewsBodyBlocks(n);
                  const deBlocks = rawDeBlocks.length > 0 ? rawDeBlocks : [{ type: "text" as const, content: "" }];
                  const rawZhBlocks = zhNews ? getNewsBodyBlocks(zhNews) : [];
                  const zhBlocks = zhNews ? (rawZhBlocks.length > 0 ? rawZhBlocks : [{ type: "text" as const, content: "" }]) : [];
                  return (
                    <EditBlock
                      key={i}
                      label={`News ${i + 1}`}
                      onDelete={() => removeNews(i)}
                      className="bg-white rounded-lg p-6 border-l-4 border-school-red shadow-sm"
                    >
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="text-xs text-amber-600 font-semibold block mb-0.5">Date</label>
                          <EditField
                            value={n.date}
                            onChange={(v) => { updDeNews(i, "date", v); updZhNews(i, "date", v); }}
                            className="text-xs font-semibold text-school-red tracking-widest w-full"
                            placeholder="2025-09"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-amber-600 font-semibold block mb-0.5">DE Title</label>
                          <EditField
                            value={n.title}
                            onChange={(v) => updDeNews(i, "title", v)}
                            className="font-bold text-school-dark w-full"
                            placeholder="German title…"
                          />
                        </div>
                        {zhNews && (
                          <div>
                            <label className="text-xs text-amber-600 font-semibold block mb-0.5">ZH Title</label>
                            <EditField
                              value={zhNews.title}
                              onChange={(v) => updZhNews(i, "title", v)}
                              className="font-cn text-sm text-gray-500 w-full"
                              placeholder="中文标题…"
                            />
                          </div>
                        )}

                        {/* DE Body Blocks */}
                        <div>
                          <label className="text-xs text-amber-600 font-semibold block mb-2">DE Body Blocks / Inhaltsblöcke</label>
                          {deBlocks.map((block, bIdx) => (
                            <div key={bIdx} className="flex gap-2 mb-2 items-start">
                              <div className="flex flex-col gap-1 mt-1">
                                {bIdx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nb = [...deBlocks];
                                      [nb[bIdx - 1], nb[bIdx]] = [nb[bIdx], nb[bIdx - 1]];
                                      updDeNewsBlocks(i, nb);
                                    }}
                                    className="text-xs text-gray-400 hover:text-gray-700"
                                    title="Move up"
                                  >▲</button>
                                )}
                                {bIdx < deBlocks.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nb = [...deBlocks];
                                      [nb[bIdx], nb[bIdx + 1]] = [nb[bIdx + 1], nb[bIdx]];
                                      updDeNewsBlocks(i, nb);
                                    }}
                                    className="text-xs text-gray-400 hover:text-gray-700"
                                    title="Move down"
                                  >▼</button>
                                )}
                              </div>
                              <div className="flex-1">
                                {block.type === "text" ? (
                                  <div>
                                    <span className="text-xs text-gray-500 mb-1 block">Text</span>
                                    <textarea
                                      className={`w-full border rounded px-3 py-2 text-sm focus:outline-none resize-y min-h-[60px] ${countWords(block.content) > MAX_WORDS_NEWS ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-amber-500"}`}
                                      value={block.content}
                                      placeholder="Text…"
                                      onChange={(e) => {
                                        const nb = deBlocks.map((b, bi) =>
                                          bi === bIdx ? { ...b, content: e.target.value } : b
                                        ) as typeof deBlocks;
                                        updDeNewsBlocks(i, nb);
                                      }}
                                    />
                                    <p className={`text-xs mt-0.5 text-right ${countWords(block.content) > MAX_WORDS_NEWS ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                                      {countWords(block.content)} / {MAX_WORDS_NEWS} words
                                    </p>
                                  </div>
                                ) : (
                                  <div className="border border-gray-200 rounded p-2 bg-gray-50">
                                    <div
                                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const file = e.dataTransfer.files?.[0];
                                        if (file) {
                                          const err = validateImageFile(file);
                                          if (err) { setNewsUploadError(err); }
                                          else { handleNewsImageUpload(file, "de", i, bIdx); }
                                        }
                                      }}
                                      onClick={() => {
                                        setNewsUploadingIdx({ lang: "de", newsIdx: i, blockIdx: bIdx });
                                        newsFileInputRef.current?.click();
                                      }}
                                      className="border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-lg p-3 text-center cursor-pointer transition-colors mb-1"
                                    >
                                      {newsUploadingIdx?.lang === "de" && newsUploadingIdx?.newsIdx === i && newsUploadingIdx?.blockIdx === bIdx ? (
                                        <p className="text-sm text-gray-500">⏳ Uploading… / 上传中…</p>
                                      ) : block.url ? (
                                        <div>
                                          <Image src={block.url} alt={block.caption ?? ""} width={400} height={128} unoptimized className="mx-auto max-h-32 object-cover rounded border border-gray-200 mb-1" />
                                          <p className="text-xs text-gray-400">Click or drop to replace / 点击或拖拽替换图片</p>
                                          <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, GIF, TIFF, SVG, RAW · max 3 MB</p>
                                        </div>
                                      ) : (
                                        <div>
                                          <p className="text-xl mb-1">📎</p>
                                          <p className="text-sm text-gray-500">Drop image here or click to upload</p>
                                          <p className="text-xs text-gray-400">Bild hierher ziehen oder klicken / 拖拽图片到此处或点击上传</p>
                                          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, TIFF, SVG, RAW · max 3 MB</p>
                                        </div>
                                      )}
                                    </div>
                                    <input
                                      type="text"
                                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500"
                                      value={block.caption ?? ""}
                                      placeholder="Caption (optional) / Bildunterschrift"
                                      onChange={(e) => {
                                        const nb = deBlocks.map((b, bi) =>
                                          bi === bIdx ? { ...b, caption: e.target.value || undefined } : b
                                        ) as typeof deBlocks;
                                        updDeNewsBlocks(i, nb);
                                      }}
                                    />
                                    {newsUploadError && newsUploadingIdx?.lang === "de" && newsUploadingIdx?.newsIdx === i && (
                                      <p className="text-xs text-red-600 mt-1">{newsUploadError}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const nb = deBlocks.filter((_, bi) => bi !== bIdx);
                                  updDeNewsBlocks(i, nb.length > 0 ? nb : [{ type: "text", content: "" }]);
                                }}
                                className="text-xs text-red-400 hover:text-red-600 mt-2"
                                title="Remove block"
                              >✕</button>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => updDeNewsBlocks(i, [...deBlocks, { type: "text", content: "" }])}
                              className="text-xs px-3 py-1 border border-dashed border-gray-300 rounded hover:border-amber-400 hover:text-amber-600 transition-colors"
                            >
                              + Text
                            </button>
                            <button
                              type="button"
                              onClick={() => updDeNewsBlocks(i, [...deBlocks, { type: "image", url: "" }])}
                              className="text-xs px-3 py-1 border border-dashed border-gray-300 rounded hover:border-amber-400 hover:text-amber-600 transition-colors"
                            >
                              + Image / Bild
                            </button>
                          </div>
                        </div>

                        {/* ZH Body Blocks */}
                        {zhNews && (
                          <div>
                            <label className="text-xs text-amber-600 font-semibold block mb-2">ZH Body Blocks / 内容块</label>
                            {zhBlocks.map((block, bIdx) => (
                              <div key={bIdx} className="flex gap-2 mb-2 items-start">
                                <div className="flex flex-col gap-1 mt-1">
                                  {bIdx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nb = [...zhBlocks];
                                        [nb[bIdx - 1], nb[bIdx]] = [nb[bIdx], nb[bIdx - 1]];
                                        updZhNewsBlocks(i, nb);
                                      }}
                                      className="text-xs text-gray-400 hover:text-gray-700"
                                      title="Move up"
                                    >▲</button>
                                  )}
                                  {bIdx < zhBlocks.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nb = [...zhBlocks];
                                        [nb[bIdx], nb[bIdx + 1]] = [nb[bIdx + 1], nb[bIdx]];
                                        updZhNewsBlocks(i, nb);
                                      }}
                                      className="text-xs text-gray-400 hover:text-gray-700"
                                      title="Move down"
                                    >▼</button>
                                  )}
                                </div>
                                <div className="flex-1">
                                  {block.type === "text" ? (
                                    <div>
                                      <span className="text-xs text-gray-500 mb-1 block">Text</span>
                                      <textarea
                                        className={`w-full border rounded px-3 py-2 text-sm font-cn focus:outline-none resize-y min-h-[60px] ${countWords(block.content) > MAX_WORDS_NEWS ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-amber-500"}`}
                                        value={block.content}
                                        placeholder="中文文本…"
                                        onChange={(e) => {
                                          const nb = zhBlocks.map((b, bi) =>
                                            bi === bIdx ? { ...b, content: e.target.value } : b
                                          ) as typeof zhBlocks;
                                          updZhNewsBlocks(i, nb);
                                        }}
                                      />
                                      <p className={`text-xs mt-0.5 text-right ${countWords(block.content) > MAX_WORDS_NEWS ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                                        {countWords(block.content)} / {MAX_WORDS_NEWS} words
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="border border-gray-200 rounded p-2 bg-gray-50">
                                      <div
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const file = e.dataTransfer.files?.[0];
                                          if (file) {
                                            const err = validateImageFile(file);
                                            if (err) { setNewsUploadError(err); }
                                            else { handleNewsImageUpload(file, "zh", i, bIdx); }
                                          }
                                        }}
                                        onClick={() => {
                                          setNewsUploadingIdx({ lang: "zh", newsIdx: i, blockIdx: bIdx });
                                          newsFileInputRef.current?.click();
                                        }}
                                        className="border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-lg p-3 text-center cursor-pointer transition-colors mb-1"
                                      >
                                        {newsUploadingIdx?.lang === "zh" && newsUploadingIdx?.newsIdx === i && newsUploadingIdx?.blockIdx === bIdx ? (
                                          <p className="text-sm text-gray-500">⏳ Uploading… / 上传中…</p>
                                        ) : block.url ? (
                                          <div>
                                            <Image src={block.url} alt={block.caption ?? ""} width={400} height={128} unoptimized className="mx-auto max-h-32 object-cover rounded border border-gray-200 mb-1" />
                                            <p className="text-xs text-gray-400">Click or drop to replace / 点击或拖拽替换图片</p>
                                            <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, GIF, TIFF, SVG, RAW · max 3 MB</p>
                                          </div>
                                        ) : (
                                          <div>
                                            <p className="text-xl mb-1">📎</p>
                                            <p className="text-sm text-gray-500">Drop image here or click to upload</p>
                                            <p className="text-xs text-gray-400">拖拽图片到此处或点击上传</p>
                                            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, TIFF, SVG, RAW · max 3 MB</p>
                                          </div>
                                        )}
                                      </div>
                                      <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500"
                                        value={block.caption ?? ""}
                                        placeholder="Caption (optional) / 图片说明"
                                        onChange={(e) => {
                                          const nb = zhBlocks.map((b, bi) =>
                                            bi === bIdx ? { ...b, caption: e.target.value || undefined } : b
                                          ) as typeof zhBlocks;
                                          updZhNewsBlocks(i, nb);
                                        }}
                                      />
                                      {newsUploadError && newsUploadingIdx?.lang === "zh" && newsUploadingIdx?.newsIdx === i && (
                                        <p className="text-xs text-red-600 mt-1">{newsUploadError}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nb = zhBlocks.filter((_, bi) => bi !== bIdx);
                                    updZhNewsBlocks(i, nb.length > 0 ? nb : [{ type: "text", content: "" }]);
                                  }}
                                  className="text-xs text-red-400 hover:text-red-600 mt-2"
                                  title="Remove block"
                                >✕</button>
                              </div>
                            ))}
                            <div className="flex gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => updZhNewsBlocks(i, [...zhBlocks, { type: "text", content: "" }])}
                                className="text-xs px-3 py-1 border border-dashed border-gray-300 rounded hover:border-amber-400 hover:text-amber-600 transition-colors"
                              >
                                + Text / 添加文本
                              </button>
                              <button
                                type="button"
                                onClick={() => updZhNewsBlocks(i, [...zhBlocks, { type: "image", url: "" }])}
                                className="text-xs px-3 py-1 border border-dashed border-gray-300 rounded hover:border-amber-400 hover:text-amber-600 transition-colors"
                              >
                                + Image / 添加图片
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </EditBlock>
                  );
                })
              ) : (
                <>
                  {(() => {
                    const totalNewsPages = Math.max(1, Math.ceil(de.news.items.length / NEWS_PER_PAGE));
                    const pageItems = de.news.items.slice(newsPage * NEWS_PER_PAGE, (newsPage + 1) * NEWS_PER_PAGE);
                    return (
                      <>
                        {pageItems.map((n, slot) => {
                          const actualIdx = newsPage * NEWS_PER_PAGE + slot;
                          const zhNews = zh.news.items[actualIdx];
                          const enNews = en.news.items[actualIdx];
                          const blocks = getNewsBodyBlocks(n);
                          const firstText = blocks.find((b): b is NewsTextBlock => b.type === "text");
                          return (
                            <Link
                              key={n.date + n.title + actualIdx}
                              href={`/news/${actualIdx}`}
                              className="block group"
                            >
                              <article className="bg-white rounded-lg p-6 border-l-4 border-school-red shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                <time className="text-xs font-semibold text-school-red tracking-widest">
                                  {n.date}
                                </time>
                                {zhNews && <h3 className="font-cn font-bold text-school-dark mt-1 group-hover:text-school-red transition-colors">{zhNews.title}</h3>}
                                {n.title.trim() && <h3 className="text-sm text-gray-500 mt-0.5">{n.title}</h3>}
                                {showEn("news") && enNews && enNews.title.trim() && <h3 className="text-xs text-gray-400 mt-0.5">{enNews.title}</h3>}
                                {zhNews && <p className="font-cn mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">{zhNews.body}</p>}
                                <p className="mt-1 text-xs text-gray-400 leading-relaxed line-clamp-2">{firstText ? firstText.content : n.body}</p>
                                {showEn("news") && enNews && enNews.body.trim() && <p className="mt-1 text-xs text-gray-400 leading-relaxed line-clamp-2">{enNews.body}</p>}
                              </article>
                            </Link>
                          );
                        })}
                        {totalNewsPages > 1 && (
                          <div className="flex flex-wrap justify-center gap-2 pt-2">
                            {Array.from({ length: totalNewsPages }, (_, p) => (
                                <button
                                  key={p}
                                  onClick={() => setNewsPage(p)}
                                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${p === newsPage ? "bg-school-red text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-school-red hover:text-school-red"}`}
                                >
                                  {p + 1}
                                </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </section>
  );
}
