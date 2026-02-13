import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { QUIZ_CONFIG } from "@/lib/constants";
import { getScore, getTier } from "@/lib/scoring";
import type { QuizSessionRow } from "@/types/quiz";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const supabase = createServerClient();

  const { data: session } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq("quiz_session_id", sessionId)
    .single<QuizSessionRow>();

  if (!session) {
    return NextResponse.json(
      { error: "세션을 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  const score = getScore(session.correct_count);
  const tier = getTier(score);

  // Calculate rank
  const { count: betterCount } = await supabase
    .from("quiz_sessions")
    .select("*", { count: "exact", head: true })
    .not("finished_at", "is", null)
    .gt("correct_count", session.correct_count);

  const { count: totalPlayers } = await supabase
    .from("quiz_sessions")
    .select("*", { count: "exact", head: true })
    .not("finished_at", "is", null);

  const rank = (betterCount ?? 0) + 1;

  return NextResponse.json({
    nickname: session.nickname,
    score,
    correct_count: session.correct_count,
    total_questions: QUIZ_CONFIG.TOTAL_QUESTIONS,
    tier,
    rank,
    total_players: totalPlayers ?? 0,
  });
}
