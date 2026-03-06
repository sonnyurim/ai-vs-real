// src/app/api/quiz/finish/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { FinishQuizRequest } from "@/types/quiz";

export async function POST(request: Request) {
  const body = (await request.json()) as FinishQuizRequest;
  const { nickname, score, hint_count } = body;

  if (!nickname || score == null || hint_count == null) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: session, error } = await supabase
    .from("quiz_sessions")
    .insert({ nickname, score, hint_count })
    .select("id")
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }

  return NextResponse.json({ session_id: String(session.id) });
}
