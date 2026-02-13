"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NormalQuestion } from "./normal-question";
import { TwinQuestion } from "./twin-question";
import { AnswerReveal } from "./answer-reveal";
import { ProgressBar } from "./progress-bar";
import { QUIZ_CONFIG } from "@/lib/constants";
import type {
  QuizQuestionPayload,
  SubmitAnswerResponse,
} from "@/types/quiz";

interface QuizContainerProps {
  sessionId: string;
  questions: QuizQuestionPayload[];
}

export function QuizContainer({ sessionId, questions }: QuizContainerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lives, setLives] = useState<number>(QUIZ_CONFIG.MAX_WRONG);
  const [answerResult, setAnswerResult] = useState<SubmitAnswerResponse | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  // Preload next question's images
  useEffect(() => {
    const next = questions[currentIndex + 1];
    if (!next) return;

    const urls: string[] = [];
    if (next.image_url) urls.push(next.image_url);
    if (next.image_a) urls.push(next.image_a.url);
    if (next.image_b) urls.push(next.image_b.url);

    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [currentIndex, questions]);

  const handleAnswer = useCallback(
    async (answer: string) => {
      if (submitting || answerResult) return;
      setSubmitting(true);

      // For twin: answer is the selected image's ID, always checking for "ai"
      const isTwin = currentQuestion.is_twin;
      const questionId = isTwin ? answer : currentQuestion.id;
      const answerValue = isTwin ? "ai" : answer;

      try {
        const res = await fetch("/api/quiz/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            question_id: questionId,
            answer: answerValue,
            question_order: currentIndex + 1,
          }),
        });

        if (!res.ok) return;

        const data: SubmitAnswerResponse = await res.json();

        // Twin: resolve image IDs to A/B labels
        if (currentQuestion.is_twin && data.votes) {
          data.votes = data.votes.map((v) => ({
            ...v,
            label: v.label === currentQuestion.image_a?.id ? "A" : "B",
          }));
        }

        setAnswerResult(data);

        if (data.correct) {
          setCorrectCount((c) => c + 1);
        } else {
          setLives((prev) => prev - 1);
        }

        // Redirect immediately on game over
        if (data.game_over || (!data.correct && lives - 1 <= 0)) {
          router.push(`/result/${sessionId}`);
          return;
        }
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, answerResult, sessionId, currentQuestion, currentIndex, lives, router],
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      router.push(`/result/${sessionId}`);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setAnswerResult(null);
  }, [isLast, sessionId, router]);

  if (!currentQuestion) return null;

  const isTwin = currentQuestion.is_twin;

  return (
    <div className="flex h-dvh w-full flex-col px-4 py-3">
      <div className={`mx-auto flex w-full flex-1 min-h-0 flex-col gap-3 transition-all ${isTwin ? "max-w-5xl" : "max-w-2xl"}`}>
      <ProgressBar
        current={currentIndex + 1}
        total={questions.length}
        score={correctCount * QUIZ_CONFIG.SCORE_PER_QUESTION}
        lives={lives}
      />

      {currentQuestion.is_twin ? (
        <TwinQuestion
          question={currentQuestion}
          onAnswer={handleAnswer}
          disabled={submitting || !!answerResult}
        />
      ) : (
        <NormalQuestion
          question={currentQuestion}
          onAnswer={handleAnswer}
          disabled={submitting || !!answerResult}
        />
      )}

      {answerResult && (
        <AnswerReveal
          result={answerResult}
          onNext={handleNext}
          isLast={isLast}
        />
      )}
      </div>
    </div>
  );
}
