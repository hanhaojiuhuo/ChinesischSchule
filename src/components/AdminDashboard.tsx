"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { NewsItem, Course } from "@/lib/supabase";

interface AdminDashboardProps {
  locale: string;
}

type Tab = "news" | "courses";

export default function AdminDashboard({ locale }: AdminDashboardProps) {
  const t = useTranslations("admin");
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showAddNews, setShowAddNews] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/news").then((r) => r.json()),
      fetch("/api/courses").then((r) => r.json()),
    ]).then(([newsData, coursesData]) => {
      setNews(newsData);
      setCourses(coursesData);
      setLoading(false);
    });
  }, []);

  const handleDeleteNews = async (id: string) => {
    if (!confirm(t("confirm_delete_news"))) return;
    await fetch(`/api/news/${id}`, { method: "DELETE" });
    setNews((prev) => prev.filter((n) => n.id !== id));
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm(t("confirm_delete_course"))) return;
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveNews = async (item: NewsItem) => {
    if (item.id) {
      const res = await fetch(`/api/news/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const updated = await res.json();
        setNews((prev) => prev.map((n) => (n.id === item.id ? updated : n)));
      }
    } else {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, published_at: new Date().toISOString() }),
      });
      if (res.ok) {
        const created = await res.json();
        setNews((prev) => [created, ...prev]);
      }
    }
    setEditingNews(null);
    setShowAddNews(false);
  };

  const handleSaveCourse = async (course: Course) => {
    if (course.id) {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(course),
      });
      if (res.ok) {
        const updated = await res.json();
        setCourses((prev) => prev.map((c) => (c.id === course.id ? updated : c)));
      }
    }
    setEditingCourse(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-700 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Logout button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          {t("logout")}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("news")}
            className={`pb-4 px-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === "news"
                ? "border-red-700 text-red-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("news_management")}
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`pb-4 px-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === "courses"
                ? "border-red-700 text-red-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("course_management")}
          </button>
        </nav>
      </div>

      {/* News Tab */}
      {activeTab === "news" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{t("news_management")}</h2>
            <button
              onClick={() => setShowAddNews(true)}
              className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
            >
              {t("add_news")}
            </button>
          </div>

          {(showAddNews || editingNews) && (
            <NewsForm
              item={editingNews || createEmptyNews()}
              onSave={handleSaveNews}
              onCancel={() => {
                setEditingNews(null);
                setShowAddNews(false);
              }}
              t={t}
            />
          )}

          <div className="space-y-4">
            {news.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{item.title_en}</p>
                    <p className="text-sm text-gray-500">{item.title_de}</p>
                    <p className="text-sm text-gray-500">{item.title_zh}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(item.published_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingNews(item)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      {t("edit_news")}
                    </button>
                    <button
                      onClick={() => handleDeleteNews(item.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      {t("delete_news")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === "courses" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{t("course_management")}</h2>
          </div>

          {editingCourse && (
            <CourseForm
              course={editingCourse}
              onSave={handleSaveCourse}
              onCancel={() => setEditingCourse(null)}
              t={t}
            />
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="border border-gray-200 px-4 py-2 text-sm font-semibold">{t("level")}</th>
                  <th className="border border-gray-200 px-4 py-2 text-sm font-semibold">{t("day")}</th>
                  <th className="border border-gray-200 px-4 py-2 text-sm font-semibold">{t("time")}</th>
                  <th className="border border-gray-200 px-4 py-2 text-sm font-semibold">{t("teacher")}</th>
                  <th className="border border-gray-200 px-4 py-2 text-sm font-semibold">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2 text-sm">{course.level}</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">{course.day}</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">
                      {course.time_start} - {course.time_end}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">{course.teacher}</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingCourse(course)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          {t("edit_course")}
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          {t("delete_course")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function createEmptyNews(): NewsItem {
  return {
    id: "",
    title_en: "",
    title_de: "",
    title_zh: "",
    content_en: "",
    content_de: "",
    content_zh: "",
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

function NewsForm({
  item,
  onSave,
  onCancel,
  t,
}: {
  item: NewsItem;
  onSave: (item: NewsItem) => void;
  onCancel: () => void;
  t: (key: string) => string;
}) {
  const [form, setForm] = useState({ ...item });

  return (
    <div className="mb-6 border border-red-200 rounded-lg p-6 bg-red-50">
      <h3 className="font-bold mb-4 text-red-700">
        {item.id ? t("edit_news") : t("add_news")}
      </h3>
      <div className="grid gap-4">
        {(["en", "de", "zh"] as const).map((lang) => (
          <div key={lang} className="border border-gray-200 rounded p-4 bg-white">
            <h4 className="font-semibold text-sm text-gray-600 mb-3 uppercase">
              {lang === "en" ? "🇬🇧 English" : lang === "de" ? "🇩🇪 Deutsch" : "🇨🇳 中文"}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("title_field")}</label>
                <input
                  type="text"
                  value={form[`title_${lang}` as keyof NewsItem] as string}
                  onChange={(e) =>
                    setForm({ ...form, [`title_${lang}`]: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("content_field")}</label>
                <textarea
                  value={form[`content_${lang}` as keyof NewsItem] as string}
                  onChange={(e) =>
                    setForm({ ...form, [`content_${lang}`]: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => onSave(form)}
          className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-colors text-sm"
        >
          {t("save")}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

function CourseForm({
  course,
  onSave,
  onCancel,
  t,
}: {
  course: Course;
  onSave: (course: Course) => void;
  onCancel: () => void;
  t: (key: string) => string;
}) {
  const [form, setForm] = useState({ ...course });

  return (
    <div className="mb-6 border border-blue-200 rounded-lg p-6 bg-blue-50">
      <h3 className="font-bold mb-4 text-blue-700">{t("edit_course")}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Level</label>
          <input
            type="text"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Day</label>
          <select
            value={form.day}
            onChange={(e) => setForm({ ...form, day: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          >
            {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Time</label>
          <input
            type="time"
            value={form.time_start}
            onChange={(e) => setForm({ ...form, time_start: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End Time</label>
          <input
            type="time"
            value={form.time_end}
            onChange={(e) => setForm({ ...form, time_end: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Teacher</label>
          <input
            type="text"
            value={form.teacher}
            onChange={(e) => setForm({ ...form, teacher: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Room</label>
          <input
            type="text"
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Age Group</label>
          <input
            type="text"
            value={form.age_group}
            onChange={(e) => setForm({ ...form, age_group: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Max Students</label>
          <input
            type="number"
            value={form.max_students}
            onChange={(e) =>
              setForm({ ...form, max_students: parseInt(e.target.value, 10) || form.max_students })
            }
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => onSave(form)}
          className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors text-sm"
        >
          {t("save")}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
