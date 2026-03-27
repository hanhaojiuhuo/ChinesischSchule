"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useContent } from "@/contexts/ContentContext";
import { useAuth } from "@/contexts/AuthContext";
import type { NewsItem } from "@/i18n/translations";

export default function AdminNewsEditPage() {
  const params = useParams();
  const router = useRouter();
  const idxParam = params.idx as string;
  const isNew = idxParam === "new";
  const idx = isNew ? -1 : parseInt(idxParam, 10);

  const { getContent, saveContent } = useContent();
  const { isAdmin } = useAuth();

  const [deTitle, setDeTitle] = useState("");
  const [deBody, setDeBody] = useState("");
  const [zhTitle, setZhTitle] = useState("");
  const [zhBody, setZhBody] = useState("");
  const [date, setDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imagePosition, setImagePosition] = useState<"before" | "after">("before");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
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
        setDeBody(item.body);
        setDate(item.date);
        setImageUrl(item.imageUrl ?? "");
        setImageCaption(item.imageCaption ?? "");
        setImagePosition(item.imagePosition ?? "before");
      }
      if (zhItem) {
        setZhTitle(zhItem.title);
        setZhBody(zhItem.body);
      }
    }
  }, [isNew, idx, getContent]);

  async function handleSave() {
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const finalDate = date.trim() || today;

      const newItem: NewsItem = {
        date: finalDate,
        title: deTitle,
        body: deBody,
        imageUrl: imageUrl || undefined,
        imageCaption: imageCaption || undefined,
        imagePosition,
      };
      const newZhItem: NewsItem = {
        date: finalDate,
        title: zhTitle,
        body: zhBody,
        imageUrl: imageUrl || undefined,
        imageCaption: imageCaption || undefined,
        imagePosition,
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

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setImageUrl(data.url);
      } else {
        setUploadError(data.error ?? "Upload failed");
      }
    } catch {
      setUploadError("Upload failed / 上传失败");
    } finally {
      setUploading(false);
    }
  }

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Redirecting…</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--school-gray)]">
      <div className="sticky top-0 z-40 bg-[var(--school-dark)] text-white px-4 py-3 flex items-center justify-between gap-4 shadow-md">
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

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Date */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📅 Datum / Date / 日期 <span className="font-normal text-gray-400">(auto-generated if empty)</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
          />
          <p className="text-xs text-gray-400 mt-1">Leave empty to use today&apos;s date when saving.</p>
        </div>

        {/* DE Title + Body */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-[var(--school-dark)] mb-3">🇩🇪 Deutsch</h3>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Titel / Title</label>
            <input
              type="text"
              value={deTitle}
              onChange={(e) => setDeTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
              placeholder="Deutscher Titel…"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Inhalt / Body</label>
            <textarea
              value={deBody}
              onChange={(e) => setDeBody(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)] resize-y"
              placeholder="Deutschen Text eingeben…"
            />
          </div>
        </div>

        {/* ZH Title + Body */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-[var(--school-dark)] mb-3">🇨🇳 中文</h3>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">标题 / Title</label>
            <input
              type="text"
              value={zhTitle}
              onChange={(e) => setZhTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-cn focus:outline-none focus:border-[var(--school-red)]"
              placeholder="中文标题…"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">正文 / Body</label>
            <textarea
              value={zhBody}
              onChange={(e) => setZhBody(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-cn focus:outline-none focus:border-[var(--school-red)] resize-y"
              placeholder="中文内容…"
            />
          </div>
        </div>

        {/* Image */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-[var(--school-dark)] mb-3">
            🖼 Bild / Image / 图片 <span className="font-normal text-gray-400 text-xs">(optional)</span>
          </h3>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Bild-URL / Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Bild hochladen / Upload Image / 上传图片</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-[var(--school-dark)] hover:bg-gray-700 disabled:opacity-60 text-white text-xs font-semibold rounded transition-colors"
              >
                {uploading ? "⏳ Uploading…" : "📎 Datei auswählen / Choose File"}
              </button>
              {imageUrl && <span className="text-xs text-green-600">✓ Image uploaded</span>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
          </div>

          {imageUrl && (
            <div className="mb-3">
              <img src={imageUrl} alt="Preview" className="w-full max-h-60 object-cover rounded border border-gray-200" />
            </div>
          )}

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Bildunterschrift / Caption / 图片说明</label>
            <input
              type="text"
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
              placeholder="Caption…"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Bildposition / Image Position / 图片位置</label>
            <select
              value={imagePosition}
              onChange={(e) => setImagePosition(e.target.value as "before" | "after")}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
            >
              <option value="before">Vor dem Text / Before text / 文本前</option>
              <option value="after">Nach dem Text / After text / 文本后</option>
            </select>
          </div>
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
