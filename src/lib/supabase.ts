import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Course = {
  id: string;
  level: string;
  day: string;
  time_start: string;
  time_end: string;
  teacher: string;
  room: string;
  age_group: string;
  max_students: number;
  current_students: number;
  created_at: string;
};

export type NewsItem = {
  id: string;
  title_en: string;
  title_de: string;
  title_zh: string;
  content_en: string;
  content_de: string;
  content_zh: string;
  published_at: string;
  created_at: string;
};
