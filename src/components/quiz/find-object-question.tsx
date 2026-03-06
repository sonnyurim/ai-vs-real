"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { HintGrid } from "./hint-grid";
import type { QuizQuestion } from "@/types/quiz";
import type { ObjectState } from "./quiz-container";

interface ClickMarker {
  x: number;
  y: number;
  hit: boolean;
}

interface FindObjectQuestionProps {
  question: QuizQuestion;
  objectStates: ObjectState[];
  questionDone: boolean;
  onHit: (objectIndex: number) => void;
  onNext: () => void;
}

function getClickPct(e: React.MouseEvent, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100,
  };
}

function isHit(
  px: number,
  py: number,
  hb: { x: number; y: number; width: number; height: number },
) {
  return (
    px >= hb.x && px <= hb.x + hb.width && py >= hb.y && py <= hb.y + hb.height
  );
}

export function FindObjectQuestion({
  question,
  objectStates,
  questionDone,
  onHit,
  onNext,
}: FindObjectQuestionProps) {
  const imgRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<ClickMarker[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setMarkers([]);
    setImageLoaded(false);
  }, [question.id]);

  function handleImageClick(e: React.MouseEvent) {
    if (questionDone) return;
    if (!imgRef.current) return;

    const { x, y } = getClickPct(e, imgRef.current);

    const activeStates = objectStates
      .map((s, i) => ({ state: s, index: i }))
      .filter(({ state }) => !state.found);

    let hitIdx = -1;
    for (const { state, index } of activeStates) {
      if (isHit(x, y, state.object.hitbox)) {
        hitIdx = index;
        break;
      }
    }

    if (hitIdx >= 0) {
      setMarkers((prev) => [...prev, { x, y, hit: true }]);
      onHit(hitIdx);
    } else {
      setMarkers((prev) => [...prev, { x, y, hit: false }]);
    }
  }

  const revealedBoxes = questionDone
    ? objectStates.map((s) => ({ hitbox: s.object.hitbox }))
    : objectStates
        .filter((s) => s.found)
        .map((s) => ({ hitbox: s.object.hitbox }));

  const foundCount = objectStates.filter((s) => s.found).length;
  const totalCount = question.objects.length;

  return (
    <div className="flex flex-1 flex-col justify-center gap-3">
      {/* 이미지 바로 위 — 지시문 + 찾은 수 */}
      <div className="flex flex-col items-center gap-2 pb-2 -mt-2">
        <p className="font-sans text-2xl font-semibold text-foreground">
          AI가 숨긴 사물&nbsp;
          <span className="font-mono text-5xl font-bold text-brand leading-none">
            {totalCount}
          </span>
          개를 찾아라!
        </p>
        <span className="font-mono text-xs font-bold text-brand/60 tabular-nums">
          {foundCount}&thinsp;/&thinsp;{totalCount} 찾음
        </span>
      </div>

      {/* 이미지 영역 */}
      <div
        ref={imgRef}
        className="relative w-full select-none overflow-hidden rounded-2xl border-2 border-brand"
        style={{ aspectRatio: "1/1" }}
        onClick={handleImageClick}
      >
        <Image
          key={question.id}
          src={question.image_url}
          alt="퀴즈 이미지"
          fill
          className="object-cover"
          style={{ objectFit: "cover", opacity: imageLoaded ? 1 : 0, transition: "opacity 0.2s" }}
          priority
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 768px) 100vw, 672px"
        />
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}

        {/* 코너 브래킷 장식 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-2.5 top-2.5 h-5 w-5 border-l-2 border-t-2 border-brand" />
          <div className="absolute right-2.5 top-2.5 h-5 w-5 border-r-2 border-t-2 border-brand" />
          <div className="absolute bottom-2.5 left-2.5 h-5 w-5 border-b-2 border-l-2 border-brand" />
          <div className="absolute bottom-2.5 right-2.5 h-5 w-5 border-b-2 border-r-2 border-brand" />
        </div>

        {/* 히트박스 강조 — 항상 초록 (정답 위치) */}
        {revealedBoxes.map((rb, i) => (
          <div
            key={i}
            className="pointer-events-none absolute border-2"
            style={{
              left: `${rb.hitbox.x}%`,
              top: `${rb.hitbox.y}%`,
              width: `${rb.hitbox.width}%`,
              height: `${rb.hitbox.height}%`,
              borderColor: "#4a9060",
              background: "rgba(74,144,96,0.15)",
            }}
          />
        ))}

        {/* 클릭 마커들 — 조준경 스타일 */}
        {markers.map((m, i) => {
          const color = m.hit ? "#4a9060" : "#c0392b";
          return (
            <svg
              key={i}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${m.x}%`, top: `${m.y}%`, width: 28, height: 28 }}
              viewBox="0 0 28 28"
              fill="none"
            >
              <circle cx="14" cy="14" r="11" stroke={color} strokeWidth="1.5" />
              <line
                x1="14"
                y1="2"
                x2="14"
                y2="8"
                stroke={color}
                strokeWidth="1.5"
              />
              <line
                x1="14"
                y1="20"
                x2="14"
                y2="26"
                stroke={color}
                strokeWidth="1.5"
              />
              <line
                x1="2"
                y1="14"
                x2="8"
                y2="14"
                stroke={color}
                strokeWidth="1.5"
              />
              <line
                x1="20"
                y1="14"
                x2="26"
                y2="14"
                stroke={color}
                strokeWidth="1.5"
              />
              <circle cx="14" cy="14" r="1.5" fill={color} />
            </svg>
          );
        })}
      </div>

      {/* 객체 상태 + 다음으로 버튼 */}
      <HintGrid
        objectStates={objectStates}
        questionDone={questionDone}
        onNext={onNext}
      />
    </div>
  );
}
