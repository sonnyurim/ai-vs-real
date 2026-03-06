// src/types/quiz.ts

export type Difficulty = "easy" | "medium" | "hard";

export interface QuizObject {
  id: number;
  name: string;
  hitbox: { x: number; y: number; width: number; height: number }; // % 단위
  hint: HintArea | HintText;
}

export interface HintArea {
  type: "area";
  cx: number;
  cy: number;
  radius: number; // % 단위
}

export interface HintText {
  type: "text";
  value: string;
}

export interface QuizQuestion {
  id: number;
  order: number;
  image_url: string;
  difficulty: Difficulty;
  time_limit: number;
  objects: QuizObject[];
}

export interface StartQuizRequest {
  nickname: string;
}

export interface StartQuizResponse {
  questions: QuizQuestion[];
}

export interface FinishQuizRequest {
  nickname: string;
  score: number;
  hint_count: number;
}

export interface QuizResultResponse {
  nickname: string;
  score: number;
  hint_count: number;
  tier: TierInfo;
  rank: number;
  total_players: number;
}

export interface TierInfo {
  grade: string;
  name: string;
  color: string;
}

export interface RankingEntry {
  rank: number;
  nickname: string;
  score: number;
}

// Supabase row types
export interface QuizRow {
  id: number;
  image_url: string;
  difficulty: Difficulty;
  status: string;
}

export interface QuizObjectRow {
  id: number;
  quiz_id: number;
  ai_object_name: string;
  hitbox_x: number;
  hitbox_y: number;
  hitbox_w: number;
  hitbox_h: number;
  hint_cx: number;
  hint_cy: number;
  hint_radius: number;
  sort_order: number;
}

export interface QuizSessionRow {
  id: number;
  nickname: string;
  score: number;
  hint_count: number;
  finished_at: string;
}
