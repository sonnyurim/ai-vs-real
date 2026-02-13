export const QUIZ_CONFIG = {
  TOTAL_QUESTIONS: 20,
  TWIN_COUNT: 8, // 40% twin (4:6 ratio)
  NORMAL_COUNT: 12, // 60% normal
  SCORE_PER_QUESTION: 10,
  MAX_WRONG: 3,
  NICKNAME_MIN: 2,
  NICKNAME_MAX: 10,
} as const;

export const TIERS = [
  { grade: "S", name: "AI 감별사", minScore: 200, color: "#FFD700" },
  { grade: "A", name: "디지털 탐정", minScore: 160, color: "#C0C0FF" },
  { grade: "B", name: "견습 감별사", minScore: 120, color: "#90EE90" },
  { grade: "C", name: "AI 초보자", minScore: 80, color: "#FFB347" },
  { grade: "D", name: "AI에 속은 자", minScore: 0, color: "#FF6B6B" },
] as const;
