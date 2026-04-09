"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useContent } from "@/contexts/ContentContext";
import { useAuth } from "@/contexts/AuthContext";
import type { NewsItem, NewsBodyBlock } from "@/i18n/translations";
import { getNewsBodyBlocks } from "@/i18n/translations";
import {
  IMAGE_ACCEPT,
} from "@/lib/validation";
import { stripHtml } from "@/lib/sanitize-html";
import RichTextEditor from "@/components/admin/RichTextEditor";

export default function AdminNewsEditPage() {
  const params = useParams();
  const router = useRouter();
  const idxParam = params.idx as string;
  const isNew = idxParam === "new";
  const parsedIdx = isNew ? -1 : parseInt(idxParam, 10);
  const idx = !isNew && isNaN(parsedIdx) ? -1 : parsedIdx;
  const isInvalid = !isNew && isNaN(parsedIdx);

  // Trigger Next.js 404 for truly invalid (non-numeric, non-"new") params
  if (isInvalid || (!isNew && parsedIdx < 0)) {
    notFound();
  }

  const { getContent, saveContent } = useContent();
  const { isAdmin } = useAuth();

  const [deTitle, setDeTitle] = useState("");
  const [deBlocks, setDeBlocks] = useState<NewsBodyBlock[]>([{ type: "text", content: "" }]);
  const [zhTitle, setZhTitle] = useState("");
  const [zhBlocks, setZhBlocks] = useState<NewsBodyBlock[]>([{ type: "text", content: "" }]);
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<{ lang: "de" | "zh"; idx: number } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      router.push("/admin");
    }
  }, [isAdmin, router]);

  // Load existing news item
  useEffect(() => {
    if (!isNew) {
      const de = getContent("de");
      const zh = getContent("zh");
      const item = de.news.items[idx];
      const zhItem = zh.news.items[idx];
      if (item) {
        setDeTitle(item.title);
        setDate(item.date);
        const blocks = getNewsBodyBlocks(item);
        setDeBlocks(blocks.length > 0 ? blocks : [{ type: "text", content: "" }]);
      }
      if (zhItem) {
        setZhTitle(zhItem.title);
        const blocks = getNewsBodyBlocks(zhItem);
        setZhBlocks(blocks.length > 0 ? blocks : [{ type: "text", content: "" }]);
      }
    }
  }, [isNew, idx, getContent]);

  /** Build the plain-text body from text blocks for backward compatibility */
  function blocksToBody(blocks: NewsBodyBlock[]): string {
    return blocks
      .filter((b): b is Extract<NewsBodyBlock, { type: "text" }> => b.type === "text")
      .map((b) => stripHtml(b.content))
      .join("\n\n");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const finalDate = date.trim() || today;

      const newItem: NewsItem = {
        date: finalDate,
        title: deTitle,
        body: blocksToBody(deBlocks),
        bodyBlocks: deBlocks,
      };
      const newZhItem: NewsItem = {
        date: finalDate,
        title: zhTitle,
        body: blocksToBody(zhBlocks),
        bodyBlocks: zhBlocks,
      };

      const de = getContent("de");
      const zh = getContent("zh");

      let deItems = [...de.news.items];
      let zhItems = [...zh.news.items];

      if (isNew) {
        deItems = [newItem, ...deItems];
        zhItems = [newZhItem, ...zhItems];
      } else {
        deItems = deItems.map((item, i) => (i === idx ? newItem : item));
        zhItems = zhItems.map((item, i) => (i === idx ? newZhItem : item));
      }

      await Promise.all([
        saveContent("de", { ...de, news: { ...de.news, items: deItems } }),
        saveContent("zh", { ...zh, news: { ...zh.news, items: zhItems } }),
      ]);

      setDate(finalDate);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);

      if (isNew) {
        router.push("/admin/news/0");
      }
    } finally {
      setSaving(false);
    }
  }

  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/tiff", "image/svg+xml"];
  const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|tiff?|svg|raw|cr2|nef|arw|dng)$/i;
  const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB
  const MAX_WORDS_NEWS = 1000;
  const MAX_WORDS_DEFAULT = 200;

  function countWords(text: string): number {
    const plain = stripHtml(text);
    if (!plain.trim()) return 0;
    const cjk = plain.match(/[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}]/gu);
    const stripped = plain.replace(/[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}]/gu, " ");
    const latin = stripped.trim().split(/\s+/).filter(Boolean);
    return (cjk?.length ?? 0) + latin.length;
  }

  function validateImageFile(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !ALLOWED_IMAGE_EXTENSIONS.test(file.name)) {
      return "Only JPEG, PNG, GIF, TIFF, SVG, and RAW images are allowed. / Nur JPEG, PNG, GIF, TIFF, SVG und RAW erlaubt. / 仅支持 JPEG、PNG、GIF、TIFF、SVG、RAW 格式。";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be under 3 MB. / Dateigröße muss unter 3 MB liegen. / 文件大小不能超过 3 MB。";
    }
    return null;
  }

  async function handleUpload(file: File, lang: "de" | "zh", blockIdx: number) {
    const validationError = validateImageFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }
    setUploadingIdx({ lang, idx: blockIdx });
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        const setBlocks = lang === "de" ? setDeBlocks : setZhBlocks;
        setBlocks((prev) =>
          prev.map((b, i) => (i === blockIdx && b.type === "image" ? { ...b, url: data.url } : b))
        );
      } else {
        setUploadError(data.error ?? "Upload failed");
      }
    } catch {
      setUploadError("Upload failed / 上传失败");
    } finally {
      setUploadingIdx(null);
    }
  }

  function renderBlockEditor(blocks: NewsBodyBlock[], setBlocks: React.Dispatch<React.SetStateAction<NewsBodyBlock[]>>, lang: "de" | "zh") {
    return (
      <div className="space-y-3">
        {blocks.map((block, bIdx) => (
          <div key={bIdx} className="flex gap-2 items-start">
            <div className="flex flex-col gap-1 mt-1">
              {bIdx > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const newBlocks = [...blocks];
                    [newBlocks[bIdx - 1], newBlocks[bIdx]] = [newBlocks[bIdx], newBlocks[bIdx - 1]];
                    setBlocks(newBlocks);
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
                    setBlocks(newBlocks);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-700"
                  title="Move down"
                >▼</button>
              )}
            </div>
            <div className="flex-1">
              {block.type === "text" ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">📝 Text</label>
                  <RichTextEditor
                    value={block.content}
                    onChange={(html) => {
                      setBlocks((prev) =>
                        prev.map((b, i) => (i === bIdx ? { ...b, content: html } : b))
                      );
                    }}
                    maxWords={MAX_WORDS_NEWS}
                    editorClassName={lang === "zh" ? "font-cn" : ""}
                    placeholder={lang === "de" ? "Text eingeben…" : "输入文本…"}
                    minHeight="100px"
                  />
                </div>
              ) : (
                <div className="border border-gray-200 rounded p-3 bg-gray-50">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">🖼 Image</label>
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
                          setUploadError(err);
                        } else {
                          handleUpload(file, lang, bIdx);
                        }
                      }
                    }}
                    onClick={() => {
                      setUploadingIdx({ lang, idx: bIdx });
                      fileInputRef.current?.click();
                    }}
                    className="border-2 border-dashed border-gray-300 hover:border-school-red rounded-lg p-4 text-center cursor-pointer transition-colors mb-2"
                  >
                    {uploadingIdx?.lang === lang && uploadingIdx?.idx === bIdx ? (
                      <p className="text-sm text-gray-500">⏳ Uploading… / 上传中…</p>
                    ) : block.url ? (
                      <div>
                        <Image src={block.url} alt={block.caption ?? ""} width={400} height={160} unoptimized className="mx-auto max-h-40 object-cover rounded border border-gray-200 mb-2" />
                        <p className="text-xs text-gray-400">Click or drop to replace / Klicken oder Bild hierher ziehen / 点击或拖拽替换图片</p>
                        <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, GIF, TIFF, SVG, RAW · max 3 MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl mb-1">📎</p>
                        <p className="text-sm text-gray-500">Drop image here or click to upload</p>
                        <p className="text-xs text-gray-400">Bild hierher ziehen oder klicken / 拖拽图片到此处或点击上传</p>
                        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, TIFF, SVG, RAW · max 3 MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={block.caption ?? ""}
                    onChange={(e) => {
                      setBlocks((prev) =>
                        prev.map((b, i) => (i === bIdx ? { ...b, caption: e.target.value || undefined } : b))
                      );
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-school-red"
                    placeholder="Caption (optional) / Bildunterschrift"
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const newBlocks = blocks.filter((_, i) => i !== bIdx);
                setBlocks(newBlocks.length > 0 ? newBlocks : [{ type: "text", content: "" }]);
              }}
              className="text-xs text-red-400 hover:text-red-600 mt-2"
              title="Remove block"
            >✕</button>
          </div>
        ))}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBlocks((prev) => [...prev, { type: "text", content: "" }])}
            className="text-xs px-3 py-1.5 border border-dashed border-gray-300 rounded hover:border-school-red hover:text-school-red transition-colors"
          >
            + Text / 添加文本
          </button>
          <button
            type="button"
            onClick={() => setBlocks((prev) => [...prev, { type: "image", url: "" }])}
            className="text-xs px-3 py-1.5 border border-dashed border-gray-300 rounded hover:border-school-red hover:text-school-red transition-colors"
          >
            + Image / 添加图片
          </button>
        </div>
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Redirecting…</div>;
  }

  if (isInvalid) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Ungültiger Index / Invalid index</div>;
  }

  return (
    <div className="min-h-screen bg-school-gray">
      <div className="sticky top-0 z-40 bg-school-dark text-white px-4 py-3 flex items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-cn font-bold text-lg">
            {isNew ? "新建新闻 / Neuer Artikel" : `新闻编辑 / News bearbeiten #${idx + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded transition-colors"
          >
            {saving ? "⏳ …" : saved ? "✓ Gespeichert!" : "💾 Speichern / Save / 保存"}
          </button>
          <Link href="/admin" className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors">
            ← Admin Panel
          </Link>
        </div>
      </div>

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingIdx) {
            handleUpload(file, uploadingIdx.lang, uploadingIdx.idx);
          }
          e.target.value = "";
        }}
      />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Date */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <label htmlFor="news-date" className="block text-sm font-semibold text-gray-700 mb-2">
            📅 Datum / Date / 日期 <span className="font-normal text-gray-400">(auto-generated if empty)</span>
          </label>
          <input
            id="news-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-school-red"
          />
          <p className="text-xs text-gray-400 mt-1">Leave empty to use today&apos;s date when saving. / Leer lassen, um das heutige Datum beim Speichern zu verwenden. / 保存时留空以使用今天的日期。</p>
        </div>

        {/* DE Title + Body Blocks */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-school-dark mb-3">🇩🇪 Deutsch</h3>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Titel / Title</label>
            <input
              type="text"
              value={deTitle}
              onChange={(e) => setDeTitle(e.target.value)}
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none ${countWords(deTitle) > MAX_WORDS_DEFAULT ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-school-red"}`}
              placeholder="Deutscher Titel…"
            />
            <p className={`text-xs mt-0.5 text-right ${countWords(deTitle) > MAX_WORDS_DEFAULT ? "text-red-600 font-semibold" : "text-gray-400"}`}>
              {countWords(deTitle)} / {MAX_WORDS_DEFAULT} words
            </p>
          </div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Inhalt / Body (Blocks)</label>
          {renderBlockEditor(deBlocks, setDeBlocks, "de")}
        </div>

        {/* ZH Title + Body Blocks */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-school-dark mb-3">🇨🇳 中文</h3>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1">标题 / Title</label>
            <input
              type="text"
              value={zhTitle}
              onChange={(e) => setZhTitle(e.target.value)}
              className={`w-full border rounded px-3 py-2 text-sm font-cn focus:outline-none ${countWords(zhTitle) > MAX_WORDS_DEFAULT ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-school-red"}`}
              placeholder="中文标题…"
            />
            <p className={`text-xs mt-0.5 text-right ${countWords(zhTitle) > MAX_WORDS_DEFAULT ? "text-red-600 font-semibold" : "text-gray-400"}`}>
              {countWords(zhTitle)} / {MAX_WORDS_DEFAULT} words
            </p>
          </div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">正文 / Body (Blocks)</label>
          {renderBlockEditor(zhBlocks, setZhBlocks, "zh")}
        </div>

        {/* Save button */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-lg shadow transition-colors"
          >
            {saving ? "⏳ Speichern…" : saved ? "✓ Gespeichert! / Saved!" : "💾 Speichern / Save / 保存"}
          </button>
          <Link
            href={isNew ? "/#news" : `/news/${idx}`}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            {isNew ? "Abbrechen / Cancel" : "Artikel ansehen / View Article / 查看文章"}
          </Link>
        </div>
      </div>
    </div>
  );
}
