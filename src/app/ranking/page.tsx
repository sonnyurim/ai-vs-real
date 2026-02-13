"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RankingTable } from "@/components/ranking/ranking-table";
import type { RankingEntry } from "@/types/quiz";

export default function RankingPage() {
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
    <div className="mx-auto flex h-dvh max-w-2xl flex-col gap-8 px-4 py-10">
      <div className="shrink-0 text-center">
        <h1 className="text-4xl font-bold">랭킹</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          AI 감별 고수들의 순위
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="py-12 text-center text-lg text-muted-foreground">로딩 중...</p>
        ) : (
          <RankingTable rankings={rankings} />
        )}
      </div>

      <div className="shrink-0 pt-4">
        <Link href="/">
          <Button variant="outline" className="w-full h-14 text-lg" size="lg">
            홈으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  );
}
