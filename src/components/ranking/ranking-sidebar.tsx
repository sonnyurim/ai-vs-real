"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { RankingEntry } from "@/types/quiz";

function getRankDisplay(rank: number): string {
  if (rank === 1) return "\uD83E\uDD47";
  if (rank === 2) return "\uD83E\uDD48";
  if (rank === 3) return "\uD83E\uDD49";
  return `${rank}`;
}

export function RankingPanel() {
  const pathname = usePathname();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRankings = useCallback(async () => {
    try {
      const res = await fetch("/api/rankings?limit=10");
      if (!res.ok) return;
      const data = await res.json();
      setRankings(data.rankings);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch on every route change
  useEffect(() => {
    fetchRankings();
  }, [pathname, fetchRankings]);

  return (
    <div className="fixed right-0 top-0 hidden h-dvh w-72 border-l border-border/50 bg-background lg:flex flex-col px-4 py-8">
      <h2 className="text-xl font-bold">랭킹</h2>
      <p className="mt-1 text-sm text-muted-foreground">전체 순위</p>

      <div className="mt-4 flex-1 overflow-y-auto">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            로딩 중...
          </p>
        ) : rankings.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            아직 기록이 없습니다
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {rankings.map((entry) => (
              <li
                key={`${entry.rank}-${entry.nickname}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
              >
                <span className="w-8 text-center text-base">
                  {getRankDisplay(entry.rank)}
                </span>
                <span className="flex-1 truncate font-medium">
                  {entry.nickname}
                </span>
                <span className="font-semibold text-brand">
                  {entry.score}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/ranking"
          className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          랭킹 보기
        </Link>
      </div>
    </div>
  );
}
