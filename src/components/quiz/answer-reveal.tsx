"use client";

import { Button } from "@/components/ui/button";
import type { SubmitAnswerResponse, VoteOption } from "@/types/quiz";

interface AnswerRevealProps {
  result: SubmitAnswerResponse;
  onNext: () => void;
  isLast: boolean;
}

function VoteBar({ votes }: { votes: VoteOption[] }) {
  const total = votes.reduce((sum, v) => sum + v.count, 0);
  if (total === 0) return null;

  return (
    <div className="w-full space-y-2">
      <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        다른 사람들의 선택
      </p>
      <div className="flex h-8 w-full overflow-hidden rounded-lg">
        {votes.map((v, i) => {
          const pct = Math.round((v.count / total) * 100);
          if (pct === 0) return null;
          return (
            <div
              key={v.label}
              className={`flex items-center justify-center text-sm font-bold text-white transition-all ${
                i === 0 ? "bg-brand" : "bg-muted-foreground/60"
              }`}
              style={{ width: `${pct}%` }}
            >
              {v.label} {pct}% ({v.count})
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AnswerReveal({ result, onNext, isLast }: AnswerRevealProps) {
  return (
    <div className="shrink-0 flex flex-col gap-3 rounded-xl border border-border/50 bg-card/80 p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white ${
              result.correct ? "bg-correct" : "bg-incorrect"
            }`}
          >
            {result.correct ? "O" : "X"}
          </span>
          <div>
            <p
              className={`text-lg font-bold ${result.correct ? "text-correct" : "text-incorrect"}`}
            >
              {result.correct ? "정답!" : "오답!"}
            </p>
            <p className="text-sm text-muted-foreground">
              정답은 <span className="font-semibold text-foreground">{result.correct_answer.toUpperCase()}</span>
            </p>
          </div>
        </div>

        <Button
          onClick={onNext}
          variant="outline"
          className="text-base font-semibold"
        >
          {isLast ? "결과 보기" : "NEXT →"}
        </Button>
      </div>

      {result.votes.length > 0 && <VoteBar votes={result.votes} />}
    </div>
  );
}
