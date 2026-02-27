// src/app/api/quiz/finish/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { FinishQuizRequest } from "@/types/quiz";

export async function POST(request: Request) {
  const body = (await request.json()) as FinishQuizRequest;
  const { session_id, score, hint_count } = body;

  if (!session_id || score == null || hint_count == null) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { error } = await supabase
    .from("quiz_sessions")
    .update({ score, hint_count })
    .eq("id", Number(session_id));

  if (error) {
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }

  return NextResponse.json({ session_id });
}
