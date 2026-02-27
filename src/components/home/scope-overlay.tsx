"use client";

import { useEffect, useRef, useState } from "react";

const SCOPE_SIZE = 260;
const MOVE_INTERVAL_MIN = 2200;
const MOVE_INTERVAL_MAX = 4500;

export function ScopeOverlay() {
  const [pos, setPos] = useState({ x: -SCOPE_SIZE, y: -SCOPE_SIZE });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const move = () => {
      const margin = SCOPE_SIZE * 0.6;
      const x = margin + Math.random() * (window.innerWidth - margin * 2);
      const y = margin + Math.random() * (window.innerHeight - margin * 2);
      setPos({ x: x - SCOPE_SIZE / 2, y: y - SCOPE_SIZE / 2 });

      const delay = MOVE_INTERVAL_MIN + Math.random() * (MOVE_INTERVAL_MAX - MOVE_INTERVAL_MIN);
      timeoutRef.current = setTimeout(move, delay);
    };

    timeoutRef.current = setTimeout(move, 400);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <div
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: SCOPE_SIZE,
          height: SCOPE_SIZE,
          transition: `left 2.8s cubic-bezier(0.4, 0, 0.2, 1), top 2.8s cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        {/* 외부 링 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid var(--brand)",
            opacity: 0.45,
          }}
        />
        {/* 내부 링 */}
        <div
          style={{
            position: "absolute",
            inset: 22,
            borderRadius: "50%",
            border: "1px solid var(--brand)",
            opacity: 0.2,
          }}
        />
        {/* 수평 크로스헤어 */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: "var(--brand)",
            opacity: 0.35,
          }}
        />
        {/* 수직 크로스헤어 */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: "var(--brand)",
            opacity: 0.35,
          }}
        />
        {/* 중앙 점 */}
        <div
          style={{
            position: "absolute",
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: "var(--primary)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.55,
          }}
        />
      </div>
    </div>
  );
}
