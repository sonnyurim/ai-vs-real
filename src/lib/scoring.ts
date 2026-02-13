import type { TierInfo } from "@/types/quiz";
import { QUIZ_CONFIG, TIERS } from "./constants";

export function getScore(correctCount: number): number {
  return correctCount * QUIZ_CONFIG.SCORE_PER_QUESTION;
}

export function getTier(score: number): TierInfo {
  const tier = TIERS.find((t) => score >= t.minScore) ?? TIERS[TIERS.length - 1];
  return { grade: tier.grade, name: tier.name, color: tier.color };
}

