import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { QUIZ_CONFIG } from "@/lib/constants";
import type {
  QuestionRow,
  QuizSessionRow,
  SubmitAnswerRequest,
  VoteOption,
} from "@/types/quiz";

export async function POST(request: Request) {
  const body = (await request.json()) as SubmitAnswerRequest;
  const { session_id, question_id, answer, question_order } = body;

  if (!session_id || !question_id || !answer || !question_order) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Verify session exists and is not completed
  const { data: session } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq("quiz_session_id", session_id)
    .is("finished_at", null)
    .single<QuizSessionRow>();

  if (!session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다" }, { status: 404 });
  }

  // Get question
  const { data: question } = await supabase
    .from("questions")
    .select("*")
    .eq("question_id", question_id)
    .single<QuestionRow>();

  if (!question) {
    return NextResponse.json({ error: "문제를 찾을 수 없습니다" }, { status: 404 });
  }

  const isCorrect = answer === question.answer;

  // Determine game state
  const newCorrectCount = session.correct_count + (isCorrect ? 1 : 0);
  const wrongCount = question_order - newCorrectCount;
  const isGameOver =
    wrongCount >= QUIZ_CONFIG.MAX_WRONG ||
    question_order >= QUIZ_CONFIG.TOTAL_QUESTIONS;

  const sessionUpdates: Record<string, unknown> = {
    correct_count: newCorrectCount,
    ...(isGameOver && { finished_at: new Date().toISOString() }),
  };

  // Record vote and update session
  await Promise.all([
    supabase.from("quiz_sessions").update(sessionUpdates).eq("quiz_session_id", session_id),
    supabase.from("question_votes").insert({
      question_id: Number(question_id),
      answer,
    }),
  ]);

  // Build vote stats from question_votes
  let votes: VoteOption[];

  if (question.pair_id !== null) {
    // Twin: count votes per image in the pair
    const { data: pairQuestions } = await supabase
      .from("questions")
      .select("question_id")
      .eq("pair_id", question.pair_id);

    const pairIds = (pairQuestions ?? []).map((p) => p.question_id);

    const votePromises = pairIds.map(async (id) => {
      const { count } = await supabase
        .from("question_votes")
        .select("*", { count: "exact", head: true })
        .eq("question_id", id)
        .eq("answer", "ai");
      return { label: String(id), count: count ?? 0 };
    });

    votes = await Promise.all(votePromises);
  } else {
    // Normal: count AI vs Real votes
    const [{ count: aiCount }, { count: realCount }] = await Promise.all([
      supabase
        .from("question_votes")
        .select("*", { count: "exact", head: true })
        .eq("question_id", question_id)
        .eq("answer", "ai"),
      supabase
        .from("question_votes")
        .select("*", { count: "exact", head: true })
        .eq("question_id", question_id)
        .eq("answer", "real"),
    ]);

    votes = [
      { label: "AI", count: aiCount ?? 0 },
      { label: "Real", count: realCount ?? 0 },
    ];
  }

  return NextResponse.json({
    correct: isCorrect,
    correct_answer: question.answer,
    votes,
    game_over: isGameOver,
  });
}
