// src/app/api/rankings/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { QuizSessionRow } from "@/types/quiz";

export async function GET() {
  const supabase = createServerClient();

  const { data } = await supabase
    .from("quiz_sessions")
    .select("id, nickname, score, hint_count, finished_at")
    .order("score", { ascending: false })
    .order("hint_count", { ascending: true })
    .order("finished_at", { ascending: true })
    .limit(20)
    .returns<QuizSessionRow[]>();

  const rankings = (data ?? []).map((row, i) => ({
    rank: i + 1,
    nickname: row.nickname,
    score: row.score,
  }));

  return NextResponse.json({ rankings });
}
