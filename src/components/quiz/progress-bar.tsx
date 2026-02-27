interface ProgressBarProps {
  current: number;
  total: number;
  score: number;
  timeLeft: number;
  timeLimit: number;
}

export function ProgressBar({ current, total, score, timeLeft, timeLimit }: ProgressBarProps) {
  const isUrgent = timeLeft <= 3;
  const timePct = (timeLeft / timeLimit) * 100;

  return (
    <div className="bg-[#0c0b09] px-4 pt-3 pb-2 space-y-2">
      {/* 상단: 케이스(왼쪽) + 점수(가운데) + 빈칸(오른쪽) */}
      <div className="grid grid-cols-3 items-center">
        <div className="rounded border border-border bg-[#161412] px-2 py-1 w-fit">
          <span className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground">
            {String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
        <span className="text-center font-mono text-xl font-bold text-brand">{score}점</span>
      </div>

      {/* 타이머 바 */}
      <div className="h-2.5 overflow-hidden rounded-full bg-[#161412]">
        <div
          className="h-2.5 rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${timePct}%`,
            background: isUrgent ? "#e84030" : "#f0a820",
          }}
        />
      </div>

    </div>
  );
}
