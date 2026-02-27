// src/lib/constants.ts

export type Difficulty = "easy" | "medium" | "hard";

export const QUIZ_CONFIG = {
  TOTAL_QUESTIONS: 10,
  MAX_SCORE: 150,
  NICKNAME_MIN: 2,
  NICKNAME_MAX: 10,
  TIME_LIMIT: { easy: 10, medium: 15, hard: 20 } as const,
} as const;

export const TIERS = [
  { grade: "S", name: "AI 감별사",    minScore: 130, color: "#f0a820" },
  { grade: "A", name: "디지털 탐정",  minScore: 100, color: "#C0C0FF" },
  { grade: "B", name: "견습 감별사",  minScore:  70, color: "#4a9060" },
  { grade: "C", name: "AI 초보자",    minScore:  40, color: "#e8a020" },
  { grade: "D", name: "AI에 속은 자", minScore:   0, color: "#c0392b" },
] as const;

export const BASE_SCORES: Record<Difficulty, number[]> = {
  easy:   [10],
  medium: [5, 5],
  hard:   [3, 3, 4],
};
