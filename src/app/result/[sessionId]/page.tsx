"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TierBadge } from "@/components/result/tier-badge";
import { ScoreDisplay } from "@/components/result/score-display";
import { ActionButtons } from "@/components/result/action-buttons";
import type { QuizResultResponse } from "@/types/quiz";

export default function ResultPage() {
  const params = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<QuizResultResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResult = async () => {
      const res = await fetch(`/api/result/${params.sessionId}`);
      if (!res.ok) {
        setError("결과를 불러올 수 없습니다");
        return;
      }
      setResult(await res.json());
    };
    fetchResult();
  }, [params.sessionId]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-muted-foreground">결과 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <p className="text-lg text-muted-foreground">
          {result.nickname}님의 결과
        </p>
        <h1 className="mt-1 text-4xl font-bold">Real or AI?</h1>
      </div>

      <TierBadge tier={result.tier} />

      <ScoreDisplay
        score={result.score}
        correctCount={result.correct_count}
        totalQuestions={result.total_questions}
        rank={result.rank}
        totalPlayers={result.total_players}
      />

      <ActionButtons />
    </div>
  );
}
