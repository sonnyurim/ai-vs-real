import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { QUIZ_CONFIG } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");

  const supabase = createServerClient();

  let query = supabase
    .from("quiz_sessions")
    .select("quiz_session_id, nickname, correct_count, finished_at")
    .not("finished_at", "is", null)
    .order("correct_count", { ascending: false })
    .order("finished_at", { ascending: true });

  if (limitParam) {
    query = query.limit(Number(limitParam));
  }

  const { data: sessions, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "랭킹을 불러올 수 없습니다" },
      { status: 500 },
    );
  }

  const rankings = (sessions ?? []).map((s, i) => ({
    rank: i + 1,
    nickname: s.nickname,
    score: s.correct_count * QUIZ_CONFIG.SCORE_PER_QUESTION,
  }));

  return NextResponse.json({ rankings });
}
