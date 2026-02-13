"use client";

import { Button } from "@/components/ui/button";
import { MediaRenderer } from "@/components/quiz/media-renderer";
import type { QuizQuestionPayload } from "@/types/quiz";

interface NormalQuestionProps {
  question: QuizQuestionPayload;
  onAnswer: (answer: string) => void;
  disabled: boolean;
}

export function NormalQuestion({
  question,
  onAnswer,
  disabled,
}: NormalQuestionProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <h2 className="shrink-0 text-center text-xl font-semibold">
        이 이미지는 AI가 만든 것일까요?
      </h2>

      <div className="flex flex-1 min-h-0 items-center justify-center">
        <div className="relative aspect-square h-full max-w-full overflow-hidden rounded-2xl border border-border/50">
          {question.image_url && (
            <MediaRenderer
              src={question.image_url}
              alt="퀴즈 이미지"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          )}
        </div>
      </div>

      <div className="shrink-0 grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => onAnswer("real")}
          disabled={disabled}
          className="h-14 text-lg font-semibold"
        >
          Real 사진
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => onAnswer("ai")}
          disabled={disabled}
          className="h-14 text-lg font-semibold"
        >
          AI 생성
        </Button>
      </div>
    </div>
  );
}
