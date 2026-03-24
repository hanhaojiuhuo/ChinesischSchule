import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";

export async function GET() {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("day", { ascending: true });

  if (error) {
    return NextResponse.json(getSampleCourses());
  }

  return NextResponse.json(data || getSampleCourses());
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { data, error } = await supabase.from("courses").insert([body]).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]);
}

function getSampleCourses() {
  return [
    {
      id: "1",
      level: "Beginner / 入门",
      day: "Saturday",
      time_start: "09:00",
      time_end: "10:30",
      teacher: "Zhang Wei",
      room: "A101",
      age_group: "6-10",
      max_students: 15,
      current_students: 12,
    },
    {
      id: "2",
      level: "Elementary / 初级",
      day: "Saturday",
      time_start: "10:45",
      time_end: "12:15",
      teacher: "Li Ming",
      room: "A102",
      age_group: "10-14",
      max_students: 15,
      current_students: 10,
    },
    {
      id: "3",
      level: "Intermediate / 中级",
      day: "Sunday",
      time_start: "09:00",
      time_end: "10:30",
      teacher: "Wang Fang",
      room: "B201",
      age_group: "14+",
      max_students: 12,
      current_students: 8,
    },
    {
      id: "4",
      level: "Advanced / 高级",
      day: "Sunday",
      time_start: "10:45",
      time_end: "12:15",
      teacher: "Chen Jing",
      room: "B202",
      age_group: "Adults",
      max_students: 10,
      current_students: 7,
    },
  ];
}
