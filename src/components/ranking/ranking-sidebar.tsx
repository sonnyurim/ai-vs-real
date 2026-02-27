import { createServerClient } from "@/lib/supabase/server";
import type { QuizSessionRow } from "@/types/quiz";

async function getRankings() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("quiz_sessions")
    .select("nickname, score")
    .order("score", { ascending: false })
    .order("hint_count", { ascending: true })
    .order("finished_at", { ascending: true })
    .limit(10)
    .returns<Pick<QuizSessionRow, "nickname" | "score">[]>();
  return data ?? [];
}

export async function RankingPanel() {
  const rankings = await getRankings();

  return (
    <aside className="hidden w-56 shrink-0 lg:flex lg:flex-col lg:items-center lg:justify-center lg:py-4">
      {/* 핀 + 카드 */}
      <div className="relative w-full" style={{ transform: "rotate(-1.2deg)" }}>

        {/* 압정 */}
        <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
          <div
            style={{
              width: 15,
              height: 15,
              borderRadius: "50%",
              background: "radial-gradient(circle at 38% 30%, #f8e080, #d09030, #7a4c08)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.9), inset 0 -1px 2px rgba(0,0,0,0.35)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: 4,
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.55)",
              }}
            />
          </div>
          {/* 스템 */}
          <div style={{ width: 2, height: 7, background: "rgba(180,130,50,0.25)" }} />
        </div>

        {/* 카드 */}
        <div
          className="rounded-sm px-4 pt-8 pb-5"
          style={{
            background: "#16130e",
            border: "1px solid #2e2418",
            boxShadow:
              "3px 8px 24px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.02)",
          }}
        >
          <p className="mb-4 text-center font-mono text-[9px] font-bold tracking-[0.3em] text-brand">
            ◉ LIVE FEED
          </p>

          {rankings.length === 0 ? (
            <p className="text-center font-mono text-[10px] text-muted-foreground">기록 없음</p>
          ) : (
            <div className="flex flex-col">
              {rankings.map((entry, i) => (
                <div
                  key={i}
                  className="grid items-center py-[7px]"
                  style={{ gridTemplateColumns: "24px 1fr 36px" }}
                >
                  <span className="text-center font-mono text-[10px] tabular-nums text-brand">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate text-center font-mono text-[11px] text-foreground">
                    {entry.nickname}
                  </span>
                  <span className="text-center font-mono text-[11px] font-bold tabular-nums text-brand">
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>
          )}

          <a
            href="/ranking"
            className="mt-5 block text-center font-mono text-[10px] font-bold tracking-[0.15em] text-muted-foreground transition-colors hover:text-brand"
          >
            전체 기록 보기 →
          </a>
        </div>
      </div>
    </aside>
  );
}
