// src/lib/quiz-select.ts
import type { QuizRow, QuizObjectRow, QuizQuestion, QuizObject } from "@/types/quiz";
import { QUIZ_CONFIG } from "./constants";

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function rowToObject(row: QuizObjectRow): QuizObject {
  return {
    id: row.id,
    name: row.ai_object_name,
    hitbox: { x: row.hitbox_x, y: row.hitbox_y, width: row.hitbox_w, height: row.hitbox_h },
    hint: { type: "area", cx: row.hint_cx, cy: row.hint_cy, radius: row.hint_radius },
  };
}

export function selectQuizzes(
  quizzes: QuizRow[],
  objectsByQuizId: Map<number, QuizObjectRow[]>,
): QuizQuestion[] {
  const selected = shuffle(quizzes).slice(0, QUIZ_CONFIG.TOTAL_QUESTIONS);

  return selected.map((quiz, i) => ({
    id: quiz.id,
    order: i + 1,
    image_url: quiz.image_url,
    difficulty: quiz.difficulty,
    time_limit: QUIZ_CONFIG.TIME_LIMIT[quiz.difficulty],
    objects: (objectsByQuizId.get(quiz.id) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(rowToObject),
  }));
}
