// src/app/api/quiz/start/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { selectQuizzes } from "@/lib/quiz-select";
import { sanitizeNickname, validateNickname } from "@/lib/validation";
import type { QuizRow, QuizObjectRow, StartQuizRequest } from "@/types/quiz";

export async function POST(request: Request) {
  const body = (await request.json()) as StartQuizRequest;
  const nickname = sanitizeNickname(body.nickname ?? "");

  const error = validateNickname(nickname);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const supabase = createServerClient();

  const [{ data: quizzes }, { data: objects }] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, image_url, difficulty, status")
      .eq("status", "approved")
      .returns<QuizRow[]>(),
    supabase
      .from("quiz_objects")
      .select("id, quiz_id, ai_object_name, hitbox_x, hitbox_y, hitbox_w, hitbox_h, hint_cx, hint_cy, hint_radius, sort_order")
      .returns<QuizObjectRow[]>(),
  ]);

  if (!quizzes?.length || !objects) {
    return NextResponse.json({ error: "문제를 불러올 수 없습니다" }, { status: 500 });
  }

  const objectsByQuizId = new Map<number, QuizObjectRow[]>();
  for (const obj of objects) {
    const list = objectsByQuizId.get(obj.quiz_id) ?? [];
    list.push(obj);
    objectsByQuizId.set(obj.quiz_id, list);
  }

  const questions = selectQuizzes(quizzes, objectsByQuizId);

  if (questions.length === 0) {
    return NextResponse.json({ error: "문제를 불러올 수 없습니다" }, { status: 500 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("quiz_sessions")
    .insert({ nickname, score: 0, hint_count: 0 })
    .select("id")
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "세션 생성 실패" }, { status: 500 });
  }

  return NextResponse.json({ session_id: String(session.id), questions });
}
