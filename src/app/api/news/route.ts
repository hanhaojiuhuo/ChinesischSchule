import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";

export async function GET() {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    return NextResponse.json(getSampleNews());
  }

  return NextResponse.json(data || getSampleNews());
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { data, error } = await supabase.from("news").insert([body]).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]);
}

function getSampleNews() {
  return [
    {
      id: "1",
      title_en: "New Semester Registration Open",
      title_de: "Anmeldung für neues Semester geöffnet",
      title_zh: "新学期报名开始",
      content_en: "Registration for the upcoming semester is now open. Please contact us to enroll your child.",
      content_de: "Die Anmeldung für das kommende Semester ist jetzt geöffnet. Bitte kontaktieren Sie uns, um Ihr Kind anzumelden.",
      content_zh: "下一学期报名现已开始。请联系我们为您的孩子报名。",
      published_at: "2025-01-15T10:00:00Z",
      created_at: "2025-01-15T10:00:00Z",
    },
    {
      id: "2",
      title_en: "Chinese New Year Celebration",
      title_de: "Chinesisches Neujahr Feier",
      title_zh: "春节庆典活动",
      content_en: "Join us for our annual Chinese New Year celebration with performances, food, and cultural activities for the whole family.",
      content_de: "Feiern Sie mit uns das chinesische Neujahr mit Aufführungen, Essen und kulturellen Aktivitäten für die ganze Familie.",
      content_zh: "欢迎参加我们的年度春节庆典，有表演、美食和适合全家参与的文化活动。",
      published_at: "2025-01-10T10:00:00Z",
      created_at: "2025-01-10T10:00:00Z",
    },
  ];
}
