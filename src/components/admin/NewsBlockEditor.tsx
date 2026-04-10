"use client";

import React from "react";
import Image from "next/image";
import { ExpandModal, ExpandButton } from "@/components/admin/AdminHelpers";
import { getNewsBodyBlocks } from "@/i18n/translations";
import type { NewsItem, NewsBodyBlock } from "@/i18n/translations";
import { countWords, MAX_WORDS_NEWS, validateImageFile } from "@/lib/validation";

export interface NewsBlockEditorProps {
  item: NewsItem;
  idx: number;
  updateNewsBlocks: (idx: number, blocks: NewsBodyBlock[]) => void;
  handleNewsImageUpload: (file: File, newsIdx: number, blockIdx: number) => void;
  newsUploadingIdx: { newsIdx: number; blockIdx: number } | null;
  setNewsUploadingIdx: React.Dispatch<React.SetStateAction<{ newsIdx: number; blockIdx: number } | null>>;
  newsUploadError: string;
  setNewsUploadError: React.Dispatch<React.SetStateAction<string>>;
  newsFileInputRef: React.RefObject<HTMLInputElement | null>;
  newsExpandedBlock: { newsIdx: number; blockIdx: number } | null;
  setNewsExpandedBlock: React.Dispatch<React.SetStateAction<{ newsIdx: number; blockIdx: number } | null>>;
}

/**
 * Renders the body-block editor (text + image blocks with drag/drop/reorder)
 * for a single news item inside the ContentTab.
 */
export default function NewsBlockEditor({
  item,
  idx,
  updateNewsBlocks,
  handleNewsImageUpload,
  newsUploadingIdx,
  setNewsUploadingIdx,
  newsUploadError,
  setNewsUploadError,
  newsFileInputRef,
  newsExpandedBlock,
  setNewsExpandedBlock,
}: NewsBlockEditorProps) {
  const blocks = getNewsBodyBlocks(item).length > 0
    ? getNewsBodyBlocks(item)
    : [{ type: "text" as const, content: "" }];

  return (
    <div className="mt-3 mb-2">
      <label className="block text-xs font-semibold text-gray-600 mb-2">Body Blocks / Inhaltsblöcke / 内容块</label>
      {blocks.map((block, bIdx) => (
        <div key={bIdx} className="flex gap-2 mb-2 items-start">
          <div className="flex flex-col gap-1 mt-1">
            {bIdx > 0 && (
              <button
                type="button"
                onClick={() => {
                  const newBlocks = [...blocks];
                  [newBlocks[bIdx - 1], newBlocks[bIdx]] = [newBlocks[bIdx], newBlocks[bIdx - 1]];
                  updateNewsBlocks(idx, newBlocks);
                }}
                className="text-xs text-gray-400 hover:text-gray-700"
                title="Move up"
              >▲</button>
            )}
            {bIdx < blocks.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  const newBlocks = [...blocks];
                  [newBlocks[bIdx], newBlocks[bIdx + 1]] = [newBlocks[bIdx + 1], newBlocks[bIdx]];
                  updateNewsBlocks(idx, newBlocks);
                }}
                className="text-xs text-gray-400 hover:text-gray-700"
                title="Move down"
              >▼</button>
            )}
          </div>
          <div className="flex-1">
            {block.type === "text" ? (
              <div>
                <div className="flex items-center mb-1">
                  <span className="text-xs text-gray-500">Text</span>
                  <ExpandButton onClick={() => setNewsExpandedBlock({ newsIdx: idx, blockIdx: bIdx })} />
                </div>
                {newsExpandedBlock?.newsIdx === idx && newsExpandedBlock?.blockIdx === bIdx && (
                  <ExpandModal
                    label={`News ${idx + 1} – Text block ${bIdx + 1}`}
                    value={block.content}
                    onChange={(v) => {
                      const newBlocks = blocks.map((b, i) =>
                        i === bIdx ? { ...b, content: v } : b
                      ) as typeof blocks;
                      updateNewsBlocks(idx, newBlocks);
                    }}
                    onClose={() => setNewsExpandedBlock(null)}
                    maxWords={MAX_WORDS_NEWS}
                  />
                )}
                <textarea
                  className={`w-full border rounded px-3 py-2 text-sm focus:outline-none resize-y min-h-[60px] ${countWords(block.content) > MAX_WORDS_NEWS ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-school-red"}`}
                  value={block.content}
                  placeholder="Text…"
                  onChange={(e) => {
                    const newBlocks = blocks.map((b, i) =>
                      i === bIdx ? { ...b, content: e.target.value } : b
                    ) as typeof blocks;
                    updateNewsBlocks(idx, newBlocks);
                  }}
                />
                <p className={`text-xs mt-0.5 text-right ${countWords(block.content) > MAX_WORDS_NEWS ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                  {countWords(block.content)} / {MAX_WORDS_NEWS} words
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded p-2 bg-white">
                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const err = validateImageFile(file);
                      if (err) {
                        setNewsUploadError(err);
                      } else {
                        handleNewsImageUpload(file, idx, bIdx);
                      }
                    }
                  }}
                  onClick={() => {
                    setNewsUploadingIdx({ newsIdx: idx, blockIdx: bIdx });
                    newsFileInputRef.current?.click();
                  }}
                  className="border-2 border-dashed border-gray-300 hover:border-school-red rounded-lg p-3 text-center cursor-pointer transition-colors mb-1"
                >
                  {newsUploadingIdx?.newsIdx === idx && newsUploadingIdx?.blockIdx === bIdx ? (
                    <p className="text-sm text-gray-500">⏳ Uploading… / 上传中…</p>
                  ) : block.url ? (
                    <div>
                      <Image src={block.url} alt={block.caption || `News image ${bIdx + 1}`} width={400} height={128} unoptimized className="mx-auto max-h-32 object-cover rounded border border-gray-200 mb-1" />
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
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-school-red"
                  value={block.caption ?? ""}
                  placeholder="Caption (optional) / Bildunterschrift"
                  onChange={(e) => {
                    const newBlocks = blocks.map((b, i) =>
                      i === bIdx ? { ...b, caption: e.target.value || undefined } : b
                    ) as typeof blocks;
                    updateNewsBlocks(idx, newBlocks);
                  }}
                />
                {newsUploadError && newsUploadingIdx?.newsIdx === idx && (
                  <p className="text-xs text-red-600 mt-1">{newsUploadError}</p>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const newBlocks = blocks.filter((_, i) => i !== bIdx);
              updateNewsBlocks(idx, newBlocks.length > 0 ? newBlocks : [{ type: "text", content: "" }]);
            }}
            className="text-xs text-red-400 hover:text-red-600 mt-2"
            title="Remove block"
          >✕</button>
        </div>
      ))}
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={() => updateNewsBlocks(idx, [...blocks, { type: "text", content: "" }])}
          className="text-xs px-3 py-1 border border-dashed border-gray-300 rounded hover:border-school-red hover:text-school-red transition-colors"
        >
          + Text / 添加文本
        </button>
        <button
          type="button"
          onClick={() => updateNewsBlocks(idx, [...blocks, { type: "image", url: "" }])}
          className="text-xs px-3 py-1 border border-dashed border-gray-300 rounded hover:border-school-red hover:text-school-red transition-colors"
        >
          + Image / 添加图片
        </button>
      </div>
    </div>
  );
}
