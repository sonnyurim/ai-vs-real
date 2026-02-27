// src/app/api/result/[sessionId]/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getTier } from "@/lib/scoring";
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
    .eq("id", Number(sessionId))
    .single<QuizSessionRow>();

  if (!session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다" }, { status: 404 });
  }

  const tier = getTier(session.score);

  const [{ count: betterCount }, { count: totalPlayers }] = await Promise.all([
    supabase
      .from("quiz_sessions")
      .select("*", { count: "exact", head: true })
      .gt("score", session.score),
    supabase
      .from("quiz_sessions")
      .select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    nickname: session.nickname,
    score: session.score,
    hint_count: session.hint_count,
    tier,
    rank: (betterCount ?? 0) + 1,
    total_players: totalPlayers ?? 0,
  });
}
