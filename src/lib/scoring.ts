// src/lib/scoring.ts

import type { TierInfo } from "@/types/quiz";
import { TIERS, BASE_SCORES } from "./constants";

export function getBaseScore(difficulty: "easy" | "medium" | "hard", objectIndex: number): number {
  return BASE_SCORES[difficulty]?.[objectIndex] ?? 0;
}

export function applyHintPenalty(score: number): number {
  return Math.floor(score * 0.5);
}

export function getTimeBonus(timeLeft: number, timeLimit: number): number {
  const ratio = timeLeft / timeLimit;
  if (ratio >= 0.8) return 5;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.2) return 1;
  return 0;
}

export function getTier(score: number): TierInfo {
  const tier = TIERS.find((t) => score >= t.minScore) ?? TIERS[TIERS.length - 1];
  return { grade: tier.grade, name: tier.name, color: tier.color };
}
