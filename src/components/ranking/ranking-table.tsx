"use client";

import type { RankingEntry } from "@/types/quiz";

interface RankingTableProps {
  rankings: RankingEntry[];
}

function getRankDisplay(rank: number): string {
  if (rank === 1) return "\uD83E\uDD47";
  if (rank === 2) return "\uD83E\uDD48";
  if (rank === 3) return "\uD83E\uDD49";
  return `${rank}`;
}

export function RankingTable({ rankings }: RankingTableProps) {
  if (rankings.length === 0) {
    return (
      <p className="py-12 text-center text-lg text-muted-foreground">
        아직 기록이 없습니다
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50">
      <table className="w-full text-base">
        <thead>
          <tr className="border-b border-border/50 bg-card/80">
            <th className="px-6 py-4 text-left font-medium text-muted-foreground">
              순위
            </th>
            <th className="px-6 py-4 text-center font-medium text-muted-foreground">
              닉네임
            </th>
            <th className="px-6 py-4 text-right font-medium text-muted-foreground">
              점수
            </th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((entry) => (
            <tr
              key={`${entry.rank}-${entry.nickname}`}
              className="border-b border-border/30 last:border-0"
            >
              <td className="px-6 py-4 text-center text-lg">
                {getRankDisplay(entry.rank)}
              </td>
              <td className="px-6 py-4 text-center text-lg font-medium">
                {entry.nickname}
              </td>
              <td className="px-6 py-4 text-right text-lg font-semibold text-brand">
                {entry.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}