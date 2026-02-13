"use client";

import type { TierInfo } from "@/types/quiz";

interface TierBadgeProps {
  tier: TierInfo;
}

export function TierBadge({ tier }: TierBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex h-32 w-32 items-center justify-center rounded-full text-6xl font-black"
        style={{
          color: tier.color,
          border: `3px solid ${tier.color}`,
          boxShadow: `0 0 24px ${tier.color}40`,
        }}
      >
        {tier.grade}
      </div>
      <p className="text-2xl font-bold" style={{ color: tier.color }}>
        {tier.name}
      </p>
    </div>
  );
}
