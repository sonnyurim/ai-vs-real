// --- Database row types ---

export interface QuestionRow {
  question_id: number;
  image_url: string;
  answer: string;
  pair_id: number | null;
}

export interface QuizSessionRow {
  quiz_session_id: number;
  nickname: string;
  correct_count: number;
  started_at: string;
  finished_at: string | null;
}

// --- API types ---

export interface TwinImageInfo {
  id: string;
  url: string;
}

export interface QuizQuestionPayload {
  id: string;
  order: number;
  image_url?: string;
  is_twin?: boolean;
  image_a?: TwinImageInfo;
  image_b?: TwinImageInfo;
}

export interface StartQuizRequest {
  nickname: string;
}

export interface StartQuizResponse {
  session_id: string;
  questions: QuizQuestionPayload[];
}

export interface SubmitAnswerRequest {
  session_id: string;
  question_id: string;
  answer: string;
  question_order: number;
}

export interface VoteOption {
  label: string;
  count: number;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  correct_answer: string;
  votes: VoteOption[];
  game_over: boolean;
}

export interface QuizResultResponse {
  nickname: string;
  score: number;
  correct_count: number;
  total_questions: number;
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

