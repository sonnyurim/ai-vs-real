"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RankingTable } from "@/components/ranking/ranking-table";
import type { RankingEntry } from "@/types/quiz";

export default function RankingPage() {
  const router = useRouter();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rankings");
      if (!res.ok) return;
      const data = await res.json();
      setRankings(data.rankings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      {/* 핀 + 카드 */}
      <div className="relative w-full max-w-md" style={{ transform: "rotate(-0.6deg)" }}>

        {/* 압정 */}
        <div className="absolute -top-[22px] left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "radial-gradient(circle at 38% 30%, #f8e080, #d09030, #7a4c08)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.9), inset 0 -1px 2px rgba(0,0,0,0.35)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 4,
                left: 5,
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.55)",
              }}
            />
          </div>
          <div style={{ width: 2, height: 8, background: "rgba(180,130,50,0.25)" }} />
        </div>

        {/* 카드 */}
        <div
          className="rounded-sm px-6 pt-10 pb-7"
          style={{
            background: "#16130e",
            border: "1px solid #2e2418",
            boxShadow:
              "4px 10px 32px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.02)",
          }}
        >
          {/* 헤더 */}
          <div className="mb-6 text-center">
            <p className="font-mono text-[9px] font-bold tracking-[0.3em] text-muted-foreground/60">
              BUREAU OF AI DETECTION
            </p>
            <p className="mt-1 font-mono text-[13px] font-bold tracking-[0.2em] text-brand">
              ◉ LIVE FEED
            </p>
          </div>

          {/* 목록 */}
          {loading ? (
            <p className="py-8 text-center font-mono text-[11px] tracking-widest text-muted-foreground/40">
              LOADING...
            </p>
          ) : (
            <RankingTable rankings={rankings} />
          )}

          {/* 하단 버튼 */}
          <button
            onClick={() => router.back()}
            className="mt-6 block w-full text-center font-mono text-[10px] font-bold tracking-[0.15em] text-muted-foreground transition-colors hover:text-brand"
          >
            ← 홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
