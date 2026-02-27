"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ScopeOverlay } from "@/components/home/scope-overlay";
import type { QuizResultResponse } from "@/types/quiz";

export default function ResultPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<QuizResultResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/result/${params.sessionId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setResult)
      .catch(() => setError("결과를 불러올 수 없습니다"));
  }, [params.sessionId]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-mono text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-mono text-xs tracking-widest text-muted-foreground">LOADING...</p>
      </div>
    );
  }

  return (
    <>
      <ScopeOverlay />
      <div className="relative flex min-h-dvh items-center justify-center px-4" style={{ zIndex: 1 }}>
        <div className="flex w-full max-w-lg flex-col items-center gap-6">

          {/* 헤더 */}
          <div className="text-center">
            <p className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground">
              INVESTIGATOR: {result.nickname}
            </p>
            <p className="mt-1 font-mono text-[11px] font-bold tracking-[0.3em] text-muted-foreground/50">
              — CASE CLOSED —
            </p>
          </div>

          {/* 스탬프 배지 */}
          <div
            className="flex h-44 w-44 items-center justify-center rounded-full border-[5px]"
            style={{ borderColor: result.tier.color }}
          >
            <div
              className="flex h-[152px] w-[152px] items-center justify-center rounded-full border"
              style={{ borderColor: result.tier.color }}
            >
              <span
                className="font-mono text-[88px] font-bold leading-none"
                style={{ color: result.tier.color }}
              >
                {result.tier.grade}
              </span>
            </div>
          </div>

          <p className="font-sans text-2xl font-bold text-foreground">
            {result.tier.name}
          </p>

          {/* 스탯 2개 */}
          <div className="grid w-full grid-cols-2 gap-3">
            {[
              { label: "SCORE", value: String(result.score), sub: "pts" },
              { label: "RANK", value: `#${result.rank}`, sub: `/ ${result.total_players}` },
            ].map(({ label, value, sub }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center gap-1 rounded-lg border border-border bg-[#111009] py-4"
              >
                <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/60">
                  {label}
                </span>
                <span className="font-mono text-3xl font-bold text-brand">{value}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{sub}</span>
              </div>
            ))}
          </div>

          {/* 버튼 */}
          <div className="flex w-full gap-3">
            <button
              onClick={() => router.push("/ranking")}
              className="flex-1 rounded-lg bg-brand py-3 font-mono text-sm font-bold tracking-wide text-[#0c0b09] hover:opacity-90"
            >
              수사 기록 보기&nbsp;&nbsp;→
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 rounded-lg border border-brand bg-[#161412] py-3 font-mono text-sm font-bold tracking-wide text-brand hover:opacity-90"
            >
              다시 수사하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
