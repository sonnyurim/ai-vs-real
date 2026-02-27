"use client";

import type { RankingEntry } from "@/types/quiz";

interface RankingTableProps {
  rankings: RankingEntry[];
}

const TOP_COLORS = ["#f0a820", "#a09078", "#7a6858"];

export function RankingTable({ rankings }: RankingTableProps) {
  if (rankings.length === 0) {
    return (
      <p className="py-12 text-center font-mono text-[11px] tracking-widest text-muted-foreground/40">
        — NO RECORDS FILED —
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <div className="grid items-center px-2 pb-2" style={{ gridTemplateColumns: "48px 1fr 64px" }}>
        <span className="text-center font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
          RANK
        </span>
        <span className="text-center font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
          INVESTIGATOR
        </span>
        <span className="text-center font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
          SCORE
        </span>
      </div>

      {rankings.map((entry) => {
        const i = entry.rank - 1;
        const color = TOP_COLORS[i];

        return (
          <div
            key={`${entry.rank}-${entry.nickname}`}
            className="grid items-center rounded px-2 py-3"
            style={{
              gridTemplateColumns: "48px 1fr 64px",
              background: i < 3 ? `${color}10` : "transparent",
            }}
          >
            <span
              className="text-center font-mono text-sm font-bold tabular-nums"
              style={{ color: color ?? "#f5ead8" }}
            >
              {String(entry.rank).padStart(2, "0")}
            </span>
            <span
              className="truncate text-center font-mono text-[13px]"
              style={{ color: color ?? "#f5ead8" }}
            >
              {entry.nickname}
            </span>
            <span
              className="text-center font-mono text-sm font-bold tabular-nums"
              style={{ color: color ?? "#f5ead8" }}
            >
              {entry.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
