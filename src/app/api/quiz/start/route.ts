import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { selectQuestions, toQuestionPayloads } from "@/lib/questions";
import { sanitizeNickname, validateNickname } from "@/lib/validation";
import type { QuestionRow, StartQuizRequest } from "@/types/quiz";

export async function POST(request: Request) {
  const body = (await request.json()) as StartQuizRequest;
  const nickname = sanitizeNickname(body.nickname ?? "");

  const error = validateNickname(nickname);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: allQuestions, error: dbError } = await supabase
    .from("questions")
    .select("*")
    .returns<QuestionRow[]>();

  if (dbError || !allQuestions) {
    return NextResponse.json(
      { error: "문제를 불러올 수 없습니다" },
      { status: 500 },
    );
  }

  const selected = selectQuestions(allQuestions);
  const questions = toQuestionPayloads(selected);

  const { data: session, error: sessionError } = await supabase
    .from("quiz_sessions")
    .insert({ nickname })
    .select("quiz_session_id")
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "세션을 생성할 수 없습니다" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    session_id: String(session.quiz_session_id),
    questions,
  });
}
