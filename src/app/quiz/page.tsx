"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuizContainer } from "@/components/quiz/quiz-container";
import type { StartQuizResponse } from "@/types/quiz";

export default function QuizPage() {
  const router = useRouter();
  const [session, setSession] = useState<StartQuizResponse | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("quiz_session");
    if (!stored) {
      router.replace("/");
      return;
    }

    try {
      const parsed: StartQuizResponse = JSON.parse(stored);
      setSession(parsed);
    } catch {
      router.replace("/");
    }
  }, [router]);

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <QuizContainer
      questions={session.questions}
    />
  );
}
