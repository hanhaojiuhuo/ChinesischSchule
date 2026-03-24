"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { Course } from "@/lib/supabase";

interface CourseScheduleProps {
  locale: string;
}

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function CourseSchedule({ locale }: CourseScheduleProps) {
  const t = useTranslations("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("no_courses"));
        setLoading(false);
      });
  }, []);

  const getDayLabel = (day: string) => {
    const dayMap: Record<string, Record<string, string>> = {
      Monday: { en: "Monday", de: "Montag", zh: "周一" },
      Tuesday: { en: "Tuesday", de: "Dienstag", zh: "周二" },
      Wednesday: { en: "Wednesday", de: "Mittwoch", zh: "周三" },
      Thursday: { en: "Thursday", de: "Donnerstag", zh: "周四" },
      Friday: { en: "Friday", de: "Freitag", zh: "周五" },
      Saturday: { en: "Saturday", de: "Samstag", zh: "周六" },
      Sunday: { en: "Sunday", de: "Sonntag", zh: "周日" },
    };
    return dayMap[day]?.[locale] || day;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-700 border-t-transparent"></div>
      </div>
    );
  }

  if (error || courses.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">{t("no_courses")}</p>
    );
  }

  // Group by day
  const coursesByDay = dayOrder.reduce<Record<string, Course[]>>((acc, day) => {
    const dayCourses = courses.filter((c) => c.day === day);
    if (dayCourses.length > 0) acc[day] = dayCourses;
    return acc;
  }, {});

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {Object.entries(coursesByDay).map(([day, dayCourses]) => (
        <div key={day}>
          <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
            <span className="text-red-800 font-black">
              {getDayLabel(day)}
            </span>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dayCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow hover:border-red-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-bold text-gray-900">{course.level}</h4>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    {course.age_group}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span>
                      {course.time_start} – {course.time_end}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👤</span>
                    <span>{course.teacher}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🚪</span>
                    <span>{t("room")}: {course.room}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>
                      {course.current_students}/{course.max_students}
                    </span>
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all"
                    style={{
                      width: `${(course.current_students / course.max_students) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
