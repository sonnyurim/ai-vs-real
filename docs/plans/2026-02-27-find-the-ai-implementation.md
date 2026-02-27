# Find the AI — 게임 구조 전환 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 기존 "AI vs Real" (버튼 선택형) 게임을 "Find the AI" (이미지 클릭형) 게임으로 전면 교체한다.

**Architecture:** 게임 로직 전체(타이머, 클릭 판정, 점수 계산)는 클라이언트 사이드에서 처리한다. 히트박스는 API start 응답에 포함되어 클라이언트가 직접 판정한다(학교 이벤트 게임이므로 보안 강제 불필요). 서버는 세션 생성, 최종 점수 저장, 랭킹 조회만 담당한다.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase (quizzes + quiz_objects 테이블은 photo-maker가 이미 생성), Tailwind CSS v4, JetBrains Mono (next/font/google)

---

## 흐름 요약

```
POST /api/quiz/start   → questions + hitboxes 반환, session 생성
  (클라이언트: 게임 진행, 타이머, 클릭 판정, 점수 계산)
POST /api/quiz/finish  → 최종 score + hint_count 저장, session_id 반환
GET  /api/result/[id]  → score + tier + rank 반환
GET  /api/rankings     → 상위 랭킹 반환
```

## 삭제할 파일

작업 시작 전 아래 파일들을 삭제한다:
- `src/lib/questions.ts`
- `src/lib/sync-questions.ts`
- `src/components/quiz/normal-question.tsx`
- `src/components/quiz/twin-question.tsx`
- `src/app/api/quiz/answer/route.ts`
- `src/components/result/tier-badge.tsx`
- `src/components/result/score-display.tsx`
- `src/components/result/action-buttons.tsx`

---

## Task 1: DB 스키마 마이그레이션

**Files:**
- Supabase SQL 에디터에서 직접 실행

**Step 1: 기존 quiz_sessions 테이블 교체**

Supabase Dashboard > SQL Editor 에서 실행:

```sql
-- 기존 테이블 삭제 (quiz_sessions, question_votes는 이제 사용 안 함)
DROP TABLE IF EXISTS question_votes;
DROP TABLE IF EXISTS quiz_sessions CASCADE;

-- 새 quiz_sessions 테이블 생성
CREATE TABLE quiz_sessions (
  id           SERIAL PRIMARY KEY,
  nickname     TEXT NOT NULL,
  score        INTEGER NOT NULL DEFAULT 0,
  hint_count   INTEGER NOT NULL DEFAULT 0,
  finished_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 랭킹 조회 성능용 인덱스
CREATE INDEX idx_quiz_sessions_ranking
  ON quiz_sessions (score DESC, hint_count ASC, finished_at ASC);
```

**Step 2: quizzes 테이블 확인**

아래 쿼리로 photo-maker가 데이터를 넣었는지 확인:

```sql
SELECT q.id, q.difficulty, q.status, COUNT(qo.id) as object_count
FROM quizzes q
LEFT JOIN quiz_objects qo ON qo.quiz_id = q.id
WHERE q.status = 'approved'
GROUP BY q.id
ORDER BY q.difficulty, q.id;
```

Easy 3개 이상, Medium 4개 이상, Hard 3개 이상 있어야 게임 가능. 데이터가 없으면 photo-maker에서 먼저 생성할 것.

---

## Task 2: Types + Constants + Scoring 교체

**Files:**
- Modify: `src/types/quiz.ts`
- Modify: `src/lib/constants.ts`
- Modify: `src/lib/scoring.ts`

**Step 1: types/quiz.ts 전면 교체**

```typescript
// src/types/quiz.ts

export type Difficulty = "easy" | "medium" | "hard";

export interface QuizObject {
  id: number;
  name: string;
  hitbox: { x: number; y: number; width: number; height: number }; // % 단위
  hint: HintArea | HintText;
}

export interface HintArea {
  type: "area";
  cx: number;
  cy: number;
  radius: number; // % 단위
}

export interface HintText {
  type: "text";
  value: string;
}

export interface QuizQuestion {
  id: number;           // quizzes.id
  order: number;        // 1~10
  image_url: string;
  difficulty: Difficulty;
  time_limit: number;   // 초
  objects: QuizObject[];
}

export interface StartQuizRequest {
  nickname: string;
}

export interface StartQuizResponse {
  session_id: string;
  questions: QuizQuestion[];
}

export interface FinishQuizRequest {
  session_id: string;
  score: number;
  hint_count: number;
}

export interface QuizResultResponse {
  nickname: string;
  score: number;
  hint_count: number;
  tier: TierInfo;
  rank: number;
  total_players: number;
}

export interface TierInfo {
  grade: string;
  name: string;
  color: string;
}

export interface RankingEntry {
  rank: number;
  nickname: string;
  score: number;
}

// Supabase row types
export interface QuizRow {
  id: number;
  image_url: string;
  difficulty: Difficulty;
  status: string;
}

export interface QuizObjectRow {
  id: number;
  quiz_id: number;
  ai_object_name: string;
  hitbox_x: number;
  hitbox_y: number;
  hitbox_w: number;
  hitbox_h: number;
  hint_cx: number;
  hint_cy: number;
  hint_radius: number;
  sort_order: number;
}

export interface QuizSessionRow {
  id: number;
  nickname: string;
  score: number;
  hint_count: number;
  finished_at: string;
}
```

**Step 2: constants.ts 교체**

```typescript
// src/lib/constants.ts

export const QUIZ_CONFIG = {
  TOTAL_QUESTIONS: 10,
  EASY_COUNT: 3,
  MEDIUM_COUNT: 4,
  HARD_COUNT: 3,
  MAX_SCORE: 150,
  NICKNAME_MIN: 2,
  NICKNAME_MAX: 10,
  TIME_LIMIT: { easy: 10, medium: 15, hard: 20 } as const,
  OBJECT_ATTEMPTS: 3,
} as const;

export const TIERS = [
  { grade: "S", name: "AI 감별사",   minScore: 130, color: "#f0a820" },
  { grade: "A", name: "디지털 탐정", minScore: 100, color: "#C0C0FF" },
  { grade: "B", name: "견습 감별사", minScore:  70, color: "#4a9060" },
  { grade: "C", name: "AI 초보자",   minScore:  40, color: "#e8a020" },
  { grade: "D", name: "AI에 속은 자",minScore:   0, color: "#c0392b" },
] as const;

// 기본 점수 (객체 인덱스 0-based)
export const BASE_SCORES: Record<Difficulty, number[]> = {
  easy:   [10],
  medium: [5, 5],
  hard:   [3, 3, 4],
};

type Difficulty = "easy" | "medium" | "hard";
```

**Step 3: scoring.ts 교체**

```typescript
// src/lib/scoring.ts

import type { TierInfo } from "@/types/quiz";
import { TIERS, QUIZ_CONFIG, BASE_SCORES } from "./constants";

type Difficulty = "easy" | "medium" | "hard";

/** 객체 기본 점수 */
export function getBaseScore(difficulty: Difficulty, objectIndex: number): number {
  return BASE_SCORES[difficulty][objectIndex] ?? 0;
}

/** 힌트 사용 시 점수 */
export function applyHintPenalty(score: number): number {
  return Math.floor(score * 0.5);
}

/** 시간 보너스 (모든 객체 찾은 경우에만 호출) */
export function getTimeBonus(timeLeft: number, timeLimit: number): number {
  const ratio = timeLeft / timeLimit;
  if (ratio >= 0.8) return 5;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.2) return 1;
  return 0;
}

export function getTier(score: number): TierInfo {
  const tier = TIERS.find((t) => score >= t.minScore) ?? TIERS[TIERS.length - 1];
  return { grade: tier.grade, name: tier.name, color: tier.color };
}
```

**Step 4: 빌드 확인**

```bash
cd /Users/yurim/Dev/ai-vs-real-yc
npm run build 2>&1 | head -30
```

타입 에러가 나오면 고칠 것. 아직 사용처가 없어서 unused import 에러가 날 수 있음 — 무시.

**Step 5: 커밋**

```bash
git add src/types/quiz.ts src/lib/constants.ts src/lib/scoring.ts
git commit -m "refactor: 퀴즈 타입/상수/점수 로직을 Find the AI 게임 구조로 교체"
```

---

## Task 3: Quiz Selection 로직

**Files:**
- Create: `src/lib/quiz-select.ts`

**Step 1: quiz-select.ts 생성**

```typescript
// src/lib/quiz-select.ts
// Supabase에서 가져온 데이터를 difficulty별로 셔플해서 선택

import type { QuizRow, QuizObjectRow, QuizQuestion, QuizObject } from "@/types/quiz";
import { QUIZ_CONFIG } from "./constants";

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function rowToObject(row: QuizObjectRow): QuizObject {
  return {
    id: row.id,
    name: row.ai_object_name,
    hitbox: { x: row.hitbox_x, y: row.hitbox_y, width: row.hitbox_w, height: row.hitbox_h },
    hint: { type: "area", cx: row.hint_cx, cy: row.hint_cy, radius: row.hint_radius },
  };
}

export function selectQuizzes(
  quizzes: QuizRow[],
  objectsByQuizId: Map<number, QuizObjectRow[]>,
): QuizQuestion[] {
  const byDifficulty = {
    easy:   shuffle(quizzes.filter((q) => q.difficulty === "easy")),
    medium: shuffle(quizzes.filter((q) => q.difficulty === "medium")),
    hard:   shuffle(quizzes.filter((q) => q.difficulty === "hard")),
  };

  const selected = [
    ...byDifficulty.easy.slice(0, QUIZ_CONFIG.EASY_COUNT),
    ...byDifficulty.medium.slice(0, QUIZ_CONFIG.MEDIUM_COUNT),
    ...byDifficulty.hard.slice(0, QUIZ_CONFIG.HARD_COUNT),
  ];

  return selected.map((quiz, i) => ({
    id: quiz.id,
    order: i + 1,
    image_url: quiz.image_url,
    difficulty: quiz.difficulty,
    time_limit: QUIZ_CONFIG.TIME_LIMIT[quiz.difficulty],
    objects: (objectsByQuizId.get(quiz.id) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(rowToObject),
  }));
}
```

**Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: 커밋**

```bash
git add src/lib/quiz-select.ts
git commit -m "feat: difficulty별 퀴즈 선택 로직 추가"
```

---

## Task 4: API — POST /api/quiz/start

**Files:**
- Modify: `src/app/api/quiz/start/route.ts`

**Step 1: route.ts 교체**

```typescript
// src/app/api/quiz/start/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { selectQuizzes } from "@/lib/quiz-select";
import { sanitizeNickname, validateNickname } from "@/lib/validation";
import type { QuizRow, QuizObjectRow, StartQuizRequest } from "@/types/quiz";

export async function POST(request: Request) {
  const body = (await request.json()) as StartQuizRequest;
  const nickname = sanitizeNickname(body.nickname ?? "");

  const error = validateNickname(nickname);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const supabase = createServerClient();

  // quizzes + quiz_objects 조회
  const [{ data: quizzes }, { data: objects }] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, image_url, difficulty, status")
      .eq("status", "approved")
      .returns<QuizRow[]>(),
    supabase
      .from("quiz_objects")
      .select("id, quiz_id, ai_object_name, hitbox_x, hitbox_y, hitbox_w, hitbox_h, hint_cx, hint_cy, hint_radius, sort_order")
      .returns<QuizObjectRow[]>(),
  ]);

  if (!quizzes?.length || !objects) {
    return NextResponse.json({ error: "문제를 불러올 수 없습니다" }, { status: 500 });
  }

  const objectsByQuizId = new Map<number, QuizObjectRow[]>();
  for (const obj of objects) {
    const list = objectsByQuizId.get(obj.quiz_id) ?? [];
    list.push(obj);
    objectsByQuizId.set(obj.quiz_id, list);
  }

  const questions = selectQuizzes(quizzes, objectsByQuizId);

  if (questions.length < 10) {
    return NextResponse.json(
      { error: `문제 수 부족: ${questions.length}개 (10개 필요)` },
      { status: 500 },
    );
  }

  // 세션 생성 (score는 finish 시 업데이트)
  const { data: session, error: sessionError } = await supabase
    .from("quiz_sessions")
    .insert({ nickname, score: 0, hint_count: 0 })
    .select("id")
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "세션 생성 실패" }, { status: 500 });
  }

  return NextResponse.json({ session_id: String(session.id), questions });
}
```

**Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

**Step 3: 커밋**

```bash
git add src/app/api/quiz/start/route.ts
git commit -m "feat: /api/quiz/start를 quizzes/quiz_objects 테이블 기반으로 교체"
```

---

## Task 5: API — finish + result

**Files:**
- Create: `src/app/api/quiz/finish/route.ts`
- Modify: `src/app/api/result/[sessionId]/route.ts`
- Delete: `src/app/api/quiz/answer/route.ts`

**Step 1: finish route 생성**

```typescript
// src/app/api/quiz/finish/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { FinishQuizRequest } from "@/types/quiz";

export async function POST(request: Request) {
  const body = (await request.json()) as FinishQuizRequest;
  const { session_id, score, hint_count } = body;

  if (!session_id || score == null || hint_count == null) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { error } = await supabase
    .from("quiz_sessions")
    .update({ score, hint_count })
    .eq("id", Number(session_id));

  if (error) {
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }

  return NextResponse.json({ session_id });
}
```

**Step 2: result route 교체**

```typescript
// src/app/api/result/[sessionId]/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getTier } from "@/lib/scoring";
import type { QuizSessionRow } from "@/types/quiz";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const supabase = createServerClient();

  const { data: session } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq("id", Number(sessionId))
    .single<QuizSessionRow>();

  if (!session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다" }, { status: 404 });
  }

  const tier = getTier(session.score);

  const [{ count: betterCount }, { count: totalPlayers }] = await Promise.all([
    supabase
      .from("quiz_sessions")
      .select("*", { count: "exact", head: true })
      .gt("score", session.score),
    supabase
      .from("quiz_sessions")
      .select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    nickname: session.nickname,
    score: session.score,
    hint_count: session.hint_count,
    tier,
    rank: (betterCount ?? 0) + 1,
    total_players: totalPlayers ?? 0,
  });
}
```

**Step 3: answer route 삭제**

```bash
rm src/app/api/quiz/answer/route.ts
```

**Step 4: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

**Step 5: 커밋**

```bash
git add src/app/api/quiz/finish/route.ts src/app/api/result/[sessionId]/route.ts
git rm src/app/api/quiz/answer/route.ts
git commit -m "feat: quiz finish/result API를 새 점수 체계로 교체"
```

---

## Task 6: API — Rankings

**Files:**
- Modify: `src/app/api/rankings/route.ts`

**Step 1: rankings route 교체**

```typescript
// src/app/api/rankings/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { QuizSessionRow } from "@/types/quiz";

export async function GET() {
  const supabase = createServerClient();

  const { data } = await supabase
    .from("quiz_sessions")
    .select("id, nickname, score, hint_count, finished_at")
    .order("score", { ascending: false })
    .order("hint_count", { ascending: true })
    .order("finished_at", { ascending: true })
    .limit(20)
    .returns<QuizSessionRow[]>();

  const rankings = (data ?? []).map((row, i) => ({
    rank: i + 1,
    nickname: row.nickname,
    score: row.score,
  }));

  return NextResponse.json({ rankings });
}
```

**Step 2: 커밋**

```bash
git add src/app/api/rankings/route.ts
git commit -m "feat: 랭킹 API를 새 점수 정렬 기준으로 교체"
```

---

## Task 7: Layout + Fonts

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Step 1: JetBrains Mono 폰트 추가, RankingPanel 제거**

```typescript
// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "FIND THE AI — 연암공과대학교",
  description: "실제 사진 속에 AI가 몰래 넣은 사물을 찾아라! 연암공과대학교 AI 감별 퀴즈 게임",
  openGraph: {
    title: "FIND THE AI — 연암공과대학교",
    description: "실제 사진 속에 AI가 몰래 넣은 사물을 찾아라!",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <main className="min-h-dvh">{children}</main>
      </body>
    </html>
  );
}
```

**Step 2: globals.css — 폰트 변수 교체**

`globals.css` 내 `@theme inline` 블록에서 아래 두 줄 교체:

```css
/* 변경 전 */
--font-sans: var(--font-geist-sans);
--font-mono: var(--font-geist-mono);

/* 변경 후 */
--font-sans: var(--font-inter);
--font-mono: var(--font-jetbrains-mono);
```

스크롤바 색도 테마 색으로 교체 (보라 → 앰버):

```css
/* 변경 전 */
background: oklch(0.3 0.03 280);
/* 변경 후 */
background: #3a3228;
```

**Step 3: 빌드 + 시각 확인**

```bash
npm run build && npm run dev
```

브라우저에서 http://localhost:3000 열고 폰트가 JetBrains Mono로 표시되는지 확인.

**Step 4: 커밋**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: JetBrains Mono 폰트 적용, RankingPanel 전역 제거"
```

---

## Task 8: Home Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/quiz/nickname-form.tsx`
- Modify: `src/components/ranking/ranking-sidebar.tsx`

**Step 1: page.tsx 교체**

`syncQuestions()` 호출 제거, QUIZ_CONFIG 값 업데이트, 랭킹 사이드바를 홈에서만 인라인으로 표시.

```typescript
// src/app/page.tsx

import { ScopeOverlay } from "@/components/home/scope-overlay";
import { NicknameForm } from "@/components/quiz/nickname-form";
import { RankingPanel } from "@/components/ranking/ranking-sidebar";
import { QUIZ_CONFIG } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <ScopeOverlay />
      <div className="relative flex min-h-dvh">
        {/* 중앙 컨텐츠 */}
        <div
          className="mx-auto flex flex-1 max-w-lg flex-col items-center justify-center gap-10 px-4 py-12"
          style={{ zIndex: 1 }}
        >
          <div className="space-y-4 text-center">
            <p className="font-mono text-[10px] tracking-[0.35em] text-muted-foreground">
              YEONAM INSTITUTE OF TECHNOLOGY
            </p>
            <h1 className="font-mono text-7xl font-bold text-brand">
              FIND  THE  AI
            </h1>
            <p className="text-base text-muted-foreground">AI가 숨긴 사물을 찾아라</p>
          </div>

          <NicknameForm />

          <div className="flex items-center gap-5 font-mono text-[11px] tracking-widest text-muted-foreground">
            <span>{QUIZ_CONFIG.TOTAL_QUESTIONS} CASES</span>
            <span className="h-3 w-px bg-border" />
            <span>{QUIZ_CONFIG.OBJECT_ATTEMPTS} ATTEMPTS</span>
            <span className="h-3 w-px bg-border" />
            <span>MAX {QUIZ_CONFIG.MAX_SCORE} pts</span>
          </div>
        </div>

        {/* 랭킹 사이드바 (데스크톱 전용) */}
        <RankingPanel />
      </div>
    </>
  );
}
```

**Step 2: ranking-sidebar.tsx — 서버 컴포넌트로 교체**

랭킹 사이드바는 서버에서 fetch해서 렌더링.

```typescript
// src/components/ranking/ranking-sidebar.tsx

import { createServerClient } from "@/lib/supabase/server";
import type { QuizSessionRow } from "@/types/quiz";

async function getRankings() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("quiz_sessions")
    .select("nickname, score")
    .order("score", { ascending: false })
    .order("hint_count", { ascending: true })
    .order("finished_at", { ascending: true })
    .limit(10)
    .returns<Pick<QuizSessionRow, "nickname" | "score">[]>();
  return data ?? [];
}

export async function RankingPanel() {
  const rankings = await getRankings();

  return (
    <aside className="hidden w-72 shrink-0 border-l border-border bg-[#080807] lg:flex lg:flex-col lg:justify-center lg:gap-2 lg:px-4 lg:py-5">
      <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-brand">RANKING</p>
      <div className="h-px bg-border" />
      {rankings.length === 0 && (
        <p className="font-mono text-xs text-muted-foreground">아직 기록 없음</p>
      )}
      {rankings.map((entry, i) => (
        <div key={i} className="flex items-center justify-between px-2 py-2.5">
          <span
            className="font-mono text-sm font-bold"
            style={{ color: i === 0 ? "#f0a820" : i === 1 ? "#a09078" : "#605848" }}
          >
            {i + 1}
          </span>
          <span className="flex-1 px-3 font-sans text-xs" style={{ color: i === 0 ? "#f0a820" : i === 1 ? "#a09078" : "#605848" }}>
            {entry.nickname}
          </span>
          <span
            className="font-mono text-xs font-bold"
            style={{ color: i === 0 ? "#f0a820" : i === 1 ? "#a09078" : "#605848" }}
          >
            {entry.score}pts
          </span>
        </div>
      ))}
      <div className="h-px bg-border" />
      <a href="/ranking" className="font-mono text-[10px] font-bold tracking-[0.2em] text-muted-foreground text-center hover:text-brand">
        VIEW ALL →
      </a>
    </aside>
  );
}
```

**Step 3: 빌드 + 시각 확인**

```bash
npm run build && npm run dev
```

http://localhost:3000 — 홈 화면, 랭킹 사이드바(데스크톱), 닉네임 입력 확인.

**Step 4: 커밋**

```bash
git add src/app/page.tsx src/components/ranking/ranking-sidebar.tsx
git commit -m "feat: 홈 페이지 및 랭킹 사이드바 업데이트"
```

---

## Task 9: 퀴즈 컨테이너 — 상태 관리

**Files:**
- Modify: `src/components/quiz/quiz-container.tsx`

퀴즈 컨테이너는 게임 전체 상태(타이머, 클릭 기회, 점수, 힌트)를 관리한다.

**Step 1: quiz-container.tsx 전면 교체**

```typescript
// src/components/quiz/quiz-container.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FindObjectQuestion } from "./find-object-question";
import { ProgressBar } from "./progress-bar";
import { QUIZ_CONFIG, BASE_SCORES } from "@/lib/constants";
import { getTimeBonus, applyHintPenalty } from "@/lib/scoring";
import type { QuizQuestion, QuizObject } from "@/types/quiz";

interface ObjectState {
  object: QuizObject;
  baseScore: number;       // 이 객체의 기본 점수
  found: boolean;
  hintUsed: boolean;
  attemptsLeft: number;    // 3 → 0
  earnedScore: number;     // 확정된 점수 (찾거나 찬스 소진 시)
}

interface QuizContainerProps {
  sessionId: string;
  questions: QuizQuestion[];
}

function initObjectStates(question: QuizQuestion): ObjectState[] {
  const scores = BASE_SCORES[question.difficulty];
  return question.objects.map((obj, i) => ({
    object: obj,
    baseScore: scores[i] ?? 0,
    found: false,
    hintUsed: false,
    attemptsLeft: QUIZ_CONFIG.OBJECT_ATTEMPTS,
    earnedScore: 0,
  }));
}

export function QuizContainer({ sessionId, questions }: QuizContainerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalHints, setTotalHints] = useState(0);
  const [objectStates, setObjectStates] = useState<ObjectState[]>(
    () => initObjectStates(questions[0]),
  );
  const [timeLeft, setTimeLeft] = useState(questions[0].time_limit);
  const [questionDone, setQuestionDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  // 현재 문제가 완료됐는지 계산
  const allDone = objectStates.every((s) => s.found || s.attemptsLeft === 0);

  // 타이머
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
  }, [currentIndex, questionDone]);

  function handleTimeout() {
    // 미발견 객체 자동 오답 처리
    setObjectStates((prev) =>
      prev.map((s) => (s.found ? s : { ...s, attemptsLeft: 0, earnedScore: 0 })),
    );
    setQuestionDone(true);
  }

  function handleClick(objectIndex: number, hit: boolean) {
    setObjectStates((prev) => {
      const next = [...prev];
      const state = { ...next[objectIndex] };

      if (hit) {
        const score = state.hintUsed
          ? applyHintPenalty(state.baseScore)
          : state.baseScore;
        state.found = true;
        state.earnedScore = score;
      } else {
        state.attemptsLeft -= 1;
        if (state.attemptsLeft === 0) {
          state.earnedScore = 0;
        }
      }
      next[objectIndex] = state;

      // 모두 완료됐으면 타이머 멈추고 점수 확정
      const done = next.every((s) => s.found || s.attemptsLeft === 0);
      if (done) {
        clearInterval(timerRef.current!);
        const allFound = next.every((s) => s.found);
        const bonus = allFound
          ? getTimeBonus(timeLeft, currentQuestion.time_limit)
          : 0;
        const qScore = next.reduce((sum, s) => sum + s.earnedScore, 0) + bonus;
        setTotalScore((prev) => prev + qScore);
        setTotalHints((prev) => prev + next.filter((s) => s.hintUsed).length);
        setQuestionDone(true);
      }

      return next;
    });
  }

  function handleUseHint(objectIndex: number) {
    setObjectStates((prev) => {
      const next = [...prev];
      next[objectIndex] = { ...next[objectIndex], hintUsed: true };
      return next;
    });
  }

  async function handleNext() {
    if (isLast) {
      // 게임 종료 — 서버에 점수 저장
      await fetch("/api/quiz/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          score: totalScore,
          hint_count: totalHints,
        }),
      });
      router.push(`/result/${sessionId}`);
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
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-4">
        <FindObjectQuestion
          question={currentQuestion}
          objectStates={objectStates}
          questionDone={questionDone}
          onHit={(idx) => handleClick(idx, true)}
          onMiss={(idx) => handleClick(idx, false)}
          onUseHint={handleUseHint}
          onNext={handleNext}
        />
      </div>
    </div>
  );
}
```

**Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: 커밋**

```bash
git add src/components/quiz/quiz-container.tsx
git commit -m "feat: 퀴즈 컨테이너 상태 관리 — 타이머/클릭/힌트/점수"
```

---

## Task 10: ProgressBar 업데이트

**Files:**
- Modify: `src/components/quiz/progress-bar.tsx`

**Step 1: progress-bar.tsx 교체**

```typescript
// src/components/quiz/progress-bar.tsx

interface ProgressBarProps {
  current: number;
  total: number;
  score: number;
  timeLeft: number;
  timeLimit: number;
}

export function ProgressBar({ current, total, score, timeLeft, timeLimit }: ProgressBarProps) {
  const isUrgent = timeLeft <= 3;
  const progressPct = ((current - 1) / total) * 100;

  return (
    <div className="bg-[#0c0b09]">
      {/* HUD 행 */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* 타이머 */}
        <div className="flex items-end gap-1">
          <span
            className="font-mono text-5xl font-bold leading-none"
            style={{ color: isUrgent ? "#e84030" : "#f0a820" }}
          >
            {String(timeLeft).padStart(2, "0")}
          </span>
          <span className="mb-1 font-mono text-[9px] tracking-[0.3em] text-muted-foreground">SEC</span>
        </div>

        {/* 점수 */}
        <span className="font-mono text-xl font-bold text-brand">{score}점</span>

        {/* 케이스 번호 */}
        <div className="rounded border border-border bg-[#161412] px-2 py-1">
          <span className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground">
            CASE  {String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="h-3 rounded-full bg-[#161412] mx-4 mb-2">
        <div
          className="h-3 rounded-full bg-brand transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
```

**Step 2: 커밋**

```bash
git add src/components/quiz/progress-bar.tsx
git commit -m "feat: ProgressBar — 타이머/점수/케이스 번호 HUD"
```

---

## Task 11: FindObjectQuestion 컴포넌트

**Files:**
- Create: `src/components/quiz/find-object-question.tsx`
- Create: `src/components/quiz/hint-grid.tsx`

클릭 가능한 이미지 + 힌트 그리드를 포함하는 핵심 게임 화면.

**Step 1: find-object-question.tsx 생성**

```typescript
// src/components/quiz/find-object-question.tsx
"use client";

import Image from "next/image";
import { useRef } from "react";
import { HintGrid } from "./hint-grid";
import type { QuizQuestion } from "@/types/quiz";
import type { ObjectState } from "./quiz-container"; // quiz-container에서 export 필요

interface ClickMarker {
  x: number;  // %
  y: number;  // %
  hit: boolean;
}

interface FindObjectQuestionProps {
  question: QuizQuestion;
  objectStates: ObjectState[];
  questionDone: boolean;
  onHit: (objectIndex: number) => void;
  onMiss: (objectIndex: number) => void;
  onUseHint: (objectIndex: number) => void;
  onNext: () => void;
}

// 클릭 좌표를 이미지 기준 % 로 변환
function getClickPct(e: React.MouseEvent, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100,
  };
}

// 히트박스 판정
function isHit(px: number, py: number, hb: { x: number; y: number; width: number; height: number }) {
  return px >= hb.x && px <= hb.x + hb.width && py >= hb.y && py <= hb.y + hb.height;
}

export function FindObjectQuestion({
  question,
  objectStates,
  questionDone,
  onHit,
  onMiss,
  onUseHint,
  onNext,
}: FindObjectQuestionProps) {
  const imgRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<ClickMarker[]>([]);

  function handleImageClick(e: React.MouseEvent) {
    if (questionDone) return;
    if (!imgRef.current) return;

    const { x, y } = getClickPct(e, imgRef.current);

    // 아직 못 찾고 찬스 남은 객체들만 판정
    const activeStates = objectStates
      .map((s, i) => ({ state: s, index: i }))
      .filter(({ state }) => !state.found && state.attemptsLeft > 0);

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
      // 가장 가까운 활성 객체의 attemptsLeft 감소
      const firstActive = activeStates[0];
      if (firstActive) {
        setMarkers((prev) => [...prev, { x, y, hit: false }]);
        onMiss(firstActive.index);
      }
    }
  }

  // 찾은 객체 + 찬스 소진 객체의 hitbox 표시
  const revealedBoxes = questionDone
    ? objectStates.map((s) => ({ hitbox: s.object.hitbox, found: s.found }))
    : objectStates
        .filter((s) => s.found)
        .map((s) => ({ hitbox: s.object.hitbox, found: true }));

  const foundCount = objectStates.filter((s) => s.found).length;

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* 지시문 */}
      <p className="text-center font-sans text-sm font-bold text-foreground">
        이 사진에서 AI가 숨긴 사물을 찾아라!
      </p>

      {/* 이미지 영역 */}
      <div
        ref={imgRef}
        className="relative w-full overflow-hidden rounded-2xl border-2 border-brand cursor-crosshair select-none"
        style={{ aspectRatio: "1/1" }}
        onClick={handleImageClick}
      >
        <Image
          src={question.image_url}
          alt="퀴즈 이미지"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 672px"
        />

        {/* 코너 브래킷 장식 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-2.5 top-2.5 h-5 w-5 border-l-2 border-t-2 border-brand" />
          <div className="absolute right-2.5 top-2.5 h-5 w-5 border-r-2 border-t-2 border-brand" />
          <div className="absolute bottom-2.5 left-2.5 h-5 w-5 border-b-2 border-l-2 border-brand" />
          <div className="absolute bottom-2.5 right-2.5 h-5 w-5 border-b-2 border-r-2 border-brand" />
        </div>

        {/* EVIDENCE 스탬프 */}
        <div className="pointer-events-none absolute bottom-3 right-3 rounded bg-[#0c0b09] px-2 py-1">
          <span className="font-mono text-[9px] font-bold tracking-[0.15em] text-brand">
            EVIDENCE PHOTO #{String(question.id).padStart(3, "0")}
          </span>
        </div>

        {/* 찾음 카운터 */}
        <div className="pointer-events-none absolute right-3 top-3 rounded bg-[#0c0b09] px-2 py-1">
          <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-brand">
            {foundCount} / {question.objects.length}  FOUND
          </span>
        </div>

        {/* 힌트 영역 오버레이 (area 타입) */}
        {objectStates.map((s, i) => {
          if (!s.hintUsed || s.object.hint.type !== "area") return null;
          const h = s.object.hint;
          return (
            <div
              key={i}
              className="pointer-events-none absolute rounded-full border-2 border-brand/50"
              style={{
                left: `${h.cx - h.radius}%`,
                top: `${h.cy - h.radius}%`,
                width: `${h.radius * 2}%`,
                height: `${h.radius * 2}%`,
                background: "rgba(240, 168, 32, 0.08)",
              }}
            />
          );
        })}

        {/* 히트박스 강조 (정답/오답 공개) */}
        {revealedBoxes.map((rb, i) => (
          <div
            key={i}
            className="pointer-events-none absolute border-2"
            style={{
              left: `${rb.hitbox.x}%`,
              top: `${rb.hitbox.y}%`,
              width: `${rb.hitbox.width}%`,
              height: `${rb.hitbox.height}%`,
              borderColor: rb.found ? "#4a9060" : "#c0392b",
              background: rb.found ? "rgba(74,144,96,0.15)" : "rgba(192,57,43,0.15)",
            }}
          />
        ))}

        {/* 클릭 마커들 */}
        {markers.map((m, i) => (
          <div
            key={i}
            className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{
              left: `${m.x}%`,
              top: `${m.y}%`,
              borderColor: m.hit ? "#4a9060" : "#c0392b",
              background: m.hit ? "rgba(74,144,96,0.4)" : "rgba(192,57,43,0.3)",
            }}
          />
        ))}
      </div>

      {/* 힌트 그리드 + NEXT 버튼 */}
      <HintGrid
        objectStates={objectStates}
        questionDone={questionDone}
        onUseHint={onUseHint}
        onNext={onNext}
      />
    </div>
  );
}
```

> **주의**: `ObjectState` 타입을 `quiz-container.tsx`에서 export 해야 한다. `quiz-container.tsx`에서 `export interface ObjectState { ... }` 로 수정할 것.

**Step 2: hint-grid.tsx 생성**

```typescript
// src/components/quiz/hint-grid.tsx
"use client";

import type { ObjectState } from "./quiz-container";

interface HintGridProps {
  objectStates: ObjectState[];
  questionDone: boolean;
  onUseHint: (index: number) => void;
  onNext: () => void;
}

export function HintGrid({ objectStates, questionDone, onUseHint, onNext }: HintGridProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[9px] font-bold tracking-[0.2em] text-muted-foreground">
        [ INVESTIGATION HINTS ]
      </p>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${objectStates.length}, 1fr)` }}>
        {objectStates.map((s, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-center"
            style={{
              background: s.found ? "#111009" : "#181614",
              borderColor: s.found ? "#2a2218" : s.hintUsed ? "#f0a820" : "#3a3228",
            }}
          >
            {s.found ? (
              <span className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground">
                ✓  FOUND
              </span>
            ) : s.attemptsLeft === 0 ? (
              <span className="font-mono text-[9px] font-bold tracking-widest" style={{ color: "#c0392b" }}>
                MISSED
              </span>
            ) : s.hintUsed && s.object.hint.type === "text" ? (
              <span className="font-mono text-[9px] text-brand">{s.object.hint.value}</span>
            ) : (
              <button
                onClick={() => onUseHint(i)}
                disabled={s.hintUsed}
                className="font-mono text-[10px] font-bold tracking-wide text-brand hover:opacity-80 disabled:opacity-40"
              >
                {s.hintUsed ? "HINT USED" : "💡 HINT"}
              </button>
            )}
            <span className="font-mono text-[8px] tracking-[0.2em] text-muted-foreground">
              OBJ. {String(i + 1).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>

      {questionDone && (
        <button
          onClick={onNext}
          className="mt-1 w-full rounded-lg bg-brand py-3 font-mono text-sm font-bold tracking-widest text-[#0c0b09] hover:opacity-90"
        >
          NEXT CASE →
        </button>
      )}
    </div>
  );
}
```

**Step 3: quiz-container.tsx에서 ObjectState export 추가**

`quiz-container.tsx` 상단 interface 선언에 `export` 추가:

```typescript
export interface ObjectState { ... }
```

**Step 4: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error TS" | head -20
```

`useState` import 누락 등 확인. `find-object-question.tsx` 상단에 `import { useState, useRef } from "react";` 있는지 확인.

**Step 5: 커밋**

```bash
git add src/components/quiz/find-object-question.tsx src/components/quiz/hint-grid.tsx src/components/quiz/quiz-container.tsx
git commit -m "feat: FindObjectQuestion — 클릭 판정/힌트/오버레이, HintGrid 컴포넌트"
```

---

## Task 12: Result Page

**Files:**
- Modify: `src/app/result/[sessionId]/page.tsx`
- Delete: `src/components/result/tier-badge.tsx`, `score-display.tsx`, `action-buttons.tsx`

**Step 1: 구 컴포넌트 삭제**

```bash
rm src/components/result/tier-badge.tsx
rm src/components/result/score-display.tsx
rm src/components/result/action-buttons.tsx
```

**Step 2: result/[sessionId]/page.tsx 전면 교체**

```typescript
// src/app/result/[sessionId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ScopeOverlay } from "@/components/home/scope-overlay";
import type { QuizResultResponse } from "@/types/quiz";

export default function ResultPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<QuizResultResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/result/${params.sessionId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setResult)
      .catch(() => setError("결과를 불러올 수 없습니다"));
  }, [params.sessionId]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-mono text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-mono text-xs tracking-widest text-muted-foreground">LOADING...</p>
      </div>
    );
  }

  return (
    <>
      <ScopeOverlay />
      <div className="relative flex min-h-dvh items-center justify-center px-4" style={{ zIndex: 1 }}>
        <div className="flex w-full max-w-lg flex-col items-center gap-6">

          {/* 헤더 */}
          <div className="text-center">
            <p className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground">
              INVESTIGATOR: {result.nickname}
            </p>
            <p className="mt-1 font-mono text-[11px] font-bold tracking-[0.3em] text-muted-foreground/50">
              — CASE CLOSED —
            </p>
          </div>

          {/* 등급 카드 */}
          <div className="w-full rounded-2xl border border-border bg-[#161412] p-7">
            <div className="flex flex-col items-center gap-4">

              {/* 등급 배지 */}
              <div
                className="flex h-36 w-36 items-center justify-center rounded-full border-4 bg-[#111009]"
                style={{ borderColor: result.tier.color }}
              >
                <span
                  className="font-mono text-7xl font-bold leading-none"
                  style={{ color: result.tier.color }}
                >
                  {result.tier.grade}
                </span>
              </div>

              <p className="font-sans text-xl font-bold text-foreground">
                {result.tier.name}
              </p>

              {/* 스탯 3개 */}
              <div className="grid w-full grid-cols-3 gap-3">
                {[
                  { label: "SCORE", value: String(result.score), sub: "pts" },
                  { label: "RANK", value: `#${result.rank}`, sub: `/ ${result.total_players}` },
                  { label: "HINTS", value: String(result.hint_count), sub: "used" },
                ].map(({ label, value, sub }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-border bg-background py-3"
                  >
                    <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/70">
                      {label}
                    </span>
                    <span className="font-mono text-2xl font-bold text-brand">{value}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex w-full gap-3">
            <button
              onClick={() => router.push("/ranking")}
              className="flex-1 rounded-lg bg-brand py-3 font-mono text-sm font-bold tracking-wide text-[#0c0b09] hover:opacity-90"
            >
              수사 기록 보기  →
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 rounded-lg border border-brand bg-[#161412] py-3 font-mono text-sm font-bold tracking-wide text-brand hover:opacity-90"
            >
              다시 수사하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

**Step 3: 빌드**

```bash
npm run build 2>&1 | grep -E "error TS" | head -20
```

**Step 4: 커밋**

```bash
git add src/app/result/[sessionId]/page.tsx
git rm src/components/result/tier-badge.tsx src/components/result/score-display.tsx src/components/result/action-buttons.tsx
git commit -m "feat: 결과 페이지 — 등급 배지/스탯/버튼 새 디자인"
```

---

## Task 13: Quiz Page 연결 + 파일 정리

**Files:**
- Modify: `src/app/quiz/page.tsx`
- Delete: 불필요 파일들

**Step 1: quiz/page.tsx 확인 및 수정**

`src/app/quiz/page.tsx`가 `QuizContainer`를 올바르게 호출하는지 확인. `StartQuizResponse` 타입이 변경됐으므로 타입 불일치가 있으면 수정.

**Step 2: 불필요 파일 삭제**

```bash
rm src/lib/questions.ts
rm src/lib/sync-questions.ts
rm src/components/quiz/normal-question.tsx
rm src/components/quiz/twin-question.tsx
rm src/components/quiz/answer-reveal.tsx
```

**Step 3: 전체 빌드 + 동작 확인**

```bash
npm run build
```

빌드 성공 후:

```bash
npm run dev
```

체크리스트:
- [ ] http://localhost:3000 — 홈 화면, 닉네임 입력
- [ ] 닉네임 입력 후 "수사 시작" → 퀴즈 화면 진입
- [ ] 이미지 클릭 → 클릭 마커 표시, 정답 시 초록 하이라이트
- [ ] 타이머 카운트다운, 3초 이하 빨간색
- [ ] 힌트 버튼 클릭 → area 힌트 오버레이 표시
- [ ] 모든 객체 완료 → "NEXT CASE →" 버튼 활성화
- [ ] 10문제 완료 → 결과 화면
- [ ] 결과 화면: 등급 배지, 점수, 순위 표시

**Step 4: 최종 커밋**

```bash
git add -A
git commit -m "chore: 구버전 파일 정리 — normal-question, twin-question, sync-questions 등 삭제"
```

---

## 주의사항

### photo-maker 데이터 선결 조건
퀴즈를 플레이하려면 Supabase `quizzes` 테이블에 Easy 3개, Medium 4개, Hard 3개 이상의 approved 퀴즈가 있어야 한다. 없으면 `api/quiz/start`에서 "문제 수 부족" 에러가 반환된다.

### @nextjs-patterns 스킬
컴포넌트 작성 시 Axios/에러 핸들링 패턴이 필요하면 `@nextjs-patterns` 스킬 참고.

### @verify 스킬
각 Task 완료 후 빌드 에러 발생 시 `@verify` 스킬 참고.
