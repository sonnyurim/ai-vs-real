"use client";

import { QUIZ_CONFIG } from "@/lib/constants";

interface ProgressBarProps {
  current: number;
  total: number;
  score: number;
  lives: number;
}

export function ProgressBar({ current, total, score, lives }: ProgressBarProps) {
  const progress = (current / total) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-lg">
        <span className="text-muted-foreground">
          {current} / {total}
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: QUIZ_CONFIG.MAX_WRONG }, (_, i) => (
            <span
              key={i}
              className={`text-2xl transition-all ${
                i < lives ? "text-red-500" : "text-muted-foreground/30"
              }`}
            >
              {i < lives ? "\u2764" : "\u2661"}
            </span>
          ))}
        </div>
        <span className="font-semibold text-brand">{score}점</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
