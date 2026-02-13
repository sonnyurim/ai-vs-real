"use client";

interface ScoreDisplayProps {
  score: number;
  correctCount: number;
  totalQuestions: number;
  rank: number;
  totalPlayers: number;
}

export function ScoreDisplay({
  score,
  correctCount,
  totalQuestions,
  rank,
  totalPlayers,
}: ScoreDisplayProps) {
  return (
    <div className="grid grid-cols-3 gap-5 w-full max-w-xl">
      {[
        { label: "점수", value: `${score}점` },
        { label: "정답", value: `${correctCount}/${totalQuestions}` },
        { label: "순위", value: `${rank}/${totalPlayers}` },
      ].map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/80 p-6"
        >
          <span className="text-base text-muted-foreground">{item.label}</span>
          <span className="text-3xl font-bold">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
