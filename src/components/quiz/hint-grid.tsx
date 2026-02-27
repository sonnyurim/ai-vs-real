"use client";

import type { ObjectState } from "./quiz-container";

interface HintGridProps {
  objectStates: ObjectState[];
  questionDone: boolean;
  onNext: () => void;
}

export function HintGrid({ questionDone, onNext }: HintGridProps) {
  if (!questionDone) return null;

  return (
    <button
      onClick={onNext}
      className="w-full rounded-lg bg-brand py-3 font-sans text-sm font-bold text-[#0c0b09] hover:opacity-90"
    >
      다음으로 →
    </button>
  );
}
