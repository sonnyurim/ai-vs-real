"use client";

import { MediaRenderer } from "@/components/quiz/media-renderer";
import type { QuizQuestionPayload } from "@/types/quiz";

interface TwinQuestionProps {
  question: QuizQuestionPayload;
  onAnswer: (answer: string) => void;
  disabled: boolean;
}

export function TwinQuestion({
  question,
  onAnswer,
  disabled,
}: TwinQuestionProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="shrink-0 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-brand">
          쌍둥이 문제
        </p>
        <h2 className="mt-1 text-xl font-semibold">
          어느 쪽이 AI가 만든 이미지일까요?
        </h2>
      </div>

      <div className="flex flex-1 min-h-0 items-center justify-center gap-4">
        <button
          onClick={() => onAnswer(question.image_a!.id)}
          disabled={disabled}
          className="group relative aspect-square h-full max-w-[calc(50%-0.5rem)] overflow-hidden rounded-2xl border-2 border-border/50 transition-all hover:border-brand disabled:pointer-events-none"
        >
          {question.image_a && (
            <MediaRenderer
              src={question.image_a.url}
              alt="이미지 A"
              sizes="50vw"
              priority
            />
          )}
          <span className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-4 py-2 text-lg font-bold text-white">
            A
          </span>
        </button>

        <button
          onClick={() => onAnswer(question.image_b!.id)}
          disabled={disabled}
          className="group relative aspect-square h-full max-w-[calc(50%-0.5rem)] overflow-hidden rounded-2xl border-2 border-border/50 transition-all hover:border-brand disabled:pointer-events-none"
        >
          {question.image_b && (
            <MediaRenderer
              src={question.image_b.url}
              alt="이미지 B"
              sizes="50vw"
              priority
            />
          )}
          <span className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-4 py-2 text-lg font-bold text-white">
            B
          </span>
        </button>
      </div>
    </div>
  );
}
