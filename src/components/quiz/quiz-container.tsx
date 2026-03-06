"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FindObjectQuestion } from "./find-object-question";
import { ProgressBar } from "./progress-bar";
import { BASE_SCORES } from "@/lib/constants";
import { getTimeBonus } from "@/lib/scoring";
import type { QuizQuestion, QuizObject } from "@/types/quiz";

export interface ObjectState {
  object: QuizObject;
  baseScore: number;
  found: boolean;
  earnedScore: number;
}

interface QuizContainerProps {
  questions: QuizQuestion[];
}

function initObjectStates(question: QuizQuestion): ObjectState[] {
  const scores = BASE_SCORES[question.difficulty];
  return question.objects.map((obj, i) => ({
    object: obj,
    baseScore: scores[i] ?? 0,
    found: false,
    earnedScore: 0,
  }));
}

export function QuizContainer({ questions }: QuizContainerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [objectStates, setObjectStates] = useState<ObjectState[]>(
    () => initObjectStates(questions[0]),
  );
  const [timeLeft, setTimeLeft] = useState(questions[0].time_limit);
  const [questionDone, setQuestionDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  // 세션 시작 시 전체 이미지 프리로드
  useEffect(() => {
    questions.forEach((q) => {
      const img = new window.Image();
      img.src = q.image_url;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTimeout() {
    // 타이머 종료 — 미발견 객체는 점수 0으로 확정, 찾은 객체만 점수 합산
    setObjectStates((prev) => {
      const finished = prev.map((s) =>
        s.found ? s : { ...s, earnedScore: 0 },
      );
      const qScore = finished.reduce((sum, s) => sum + s.earnedScore, 0);
      setTotalScore((t) => t + qScore);
      return finished;
    });
    setQuestionDone(true);
  }

  useEffect(() => {
    if (questionDone) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questionDone]);

  function handleHit(objectIndex: number) {
    setObjectStates((prev) => {
      const next = [...prev];
      const state = { ...next[objectIndex] };
      state.found = true;
      state.earnedScore = state.baseScore;
      next[objectIndex] = state;

      const allFound = next.every((s) => s.found);
      if (allFound) {
        clearInterval(timerRef.current!);
        const bonus = getTimeBonus(timeLeft, currentQuestion.time_limit);
        const qScore = next.reduce((sum, s) => sum + s.earnedScore, 0) + bonus;
        setTotalScore((t) => t + qScore);
        setQuestionDone(true);
      }

      return next;
    });
  }

  async function handleNext() {
    if (isLast) {
      const nickname = sessionStorage.getItem("quiz_nickname") ?? "";
      const res = await fetch("/api/quiz/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, score: totalScore, hint_count: 0 }),
      });
      const data = await res.json();
      router.replace(`/result/${data.session_id}`);
      return;
    }

    const next = questions[currentIndex + 1];
    setCurrentIndex((i) => i + 1);
    setObjectStates(initObjectStates(next));
    setTimeLeft(next.time_limit);
    setQuestionDone(false);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <ProgressBar
        current={currentIndex + 1}
        total={questions.length}
        score={totalScore}
        timeLeft={timeLeft}
        timeLimit={currentQuestion.time_limit}
      />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-4">
        <FindObjectQuestion
          question={currentQuestion}
          objectStates={objectStates}
          questionDone={questionDone}
          onHit={handleHit}
          onNext={handleNext}
        />
      </div>
    </div>
  );
}
