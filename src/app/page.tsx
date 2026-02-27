import { ScopeOverlay } from "@/components/home/scope-overlay";
import { NicknameForm } from "@/components/quiz/nickname-form";
import { RankingPanel } from "@/components/ranking/ranking-sidebar";
import { QUIZ_CONFIG } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <ScopeOverlay />

      {/* 랭킹 카드 — 오른쪽 상단 고정 */}
      <div className="fixed right-8 top-8 hidden lg:block" style={{ zIndex: 2 }}>
        <RankingPanel />
      </div>

      <div
        className="relative flex min-h-dvh items-center justify-center px-4 py-12"
        style={{ zIndex: 1 }}
      >
        {/* 중앙 컨텐츠 — 가운데 정렬의 기준점 */}
        <div className="relative flex flex-col items-center gap-10">
          <div className="space-y-4 text-center">
            <p className="font-mono text-[10px] tracking-[0.35em] text-muted-foreground">
              YEONAM INSTITUTE OF TECHNOLOGY
            </p>
            <h1 className="font-mono text-7xl font-bold text-brand">
              FIND THE AI
            </h1>
            <p className="text-base text-muted-foreground">
              AI가 숨긴 사물을 찾아라
            </p>
          </div>

          <NicknameForm />

          <div className="flex items-center gap-5 font-mono text-[11px] tracking-widest text-muted-foreground">
            <span>{QUIZ_CONFIG.TOTAL_QUESTIONS} CASES</span>
            <span className="h-3 w-px bg-border" />
            <span>MAX {QUIZ_CONFIG.MAX_SCORE} pts</span>
          </div>

        </div>
      </div>
    </>
  );
}
