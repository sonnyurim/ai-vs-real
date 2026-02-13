import { NicknameForm } from "@/components/quiz/nickname-form";
import { QUIZ_CONFIG } from "@/lib/constants";
import { syncQuestions } from "@/lib/sync-questions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await syncQuestions();
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-10 px-4 py-12">
      <div className="text-center">
        <p className="text-2xl font-medium tracking-wider text-muted-foreground">
          연암공과대학교
        </p>
        <h1 className="mt-2 text-8xl font-bold tracking-tight">Real or AI?</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          AI가 만든 이미지 vs 진짜 사진
          <br />
          당신은 구별할 수 있나요?
        </p>
      </div>

      <NicknameForm />

      <div className="flex gap-6 text-base text-muted-foreground">
        <span>{QUIZ_CONFIG.TOTAL_QUESTIONS}문제</span>
        <span>목숨 {QUIZ_CONFIG.MAX_WRONG}개</span>
        <span>
          최대 {QUIZ_CONFIG.TOTAL_QUESTIONS * QUIZ_CONFIG.SCORE_PER_QUESTION}점
        </span>
      </div>
    </div>
  );
}
