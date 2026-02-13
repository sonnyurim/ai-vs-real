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
    <div className="flex flex-col gap-8">
      <h2 className="text-center text-2xl font-semibold">
        이 이미지는 AI가 만든 것일까요?
      </h2>

      <div className="relative aspect-square w-full mx-auto overflow-hidden rounded-2xl border border-border/50">
        {question.image_url && (
          <MediaRenderer
            src={question.image_url}
            alt="퀴즈 이미지"
            sizes="(max-width: 1024px) 100vw, 1024px"
            priority
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => onAnswer("real")}
          disabled={disabled}
          className="h-20 text-2xl font-semibold"
        >
          Real 사진
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => onAnswer("ai")}
          disabled={disabled}
          className="h-20 text-2xl font-semibold"
        >
          AI 생성
        </Button>
      </div>
    </div>
  );
}
