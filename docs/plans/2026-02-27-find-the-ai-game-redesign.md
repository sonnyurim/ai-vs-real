# Find the AI — 게임 구조 재설계 디자인 문서

## 개요

현재 "AI vs Real" (버튼 선택형) 게임을 "Find the AI" (이미지 클릭형) 게임으로 전면 교체.

---

## 디자인 (Pencil)

`pencil-new.pen` 에 3개 화면 확정:

- **homeFrame** (VAAie): 닉네임 입력 + 랭킹 사이드바, 돋보기 그래픽
- **dtV2** (KvCfQ): 퀴즈 화면 — HUD(타이머/점수/케이스), 이미지, INVESTIGATION HINTS 그리드
- **resultFrame** (OnreD): 결과 화면 — 등급 배지, SCORE/SOLVED/RANK 스탯, 버튼 2개

디자인 토큰: `#0c0b09` bg / `#f0a820` amber / JetBrains Mono + Inter

---

## 게임 구조

### 기존 → 신규

| 항목 | 기존 | 신규 |
|------|------|------|
| 문제 유형 | AI/Real 버튼 선택, Twin | 이미지 클릭으로 AI 사물 탐지 |
| 문제 수 | 20 | 10 (Easy×3, Medium×4, Hard×3) |
| 점수 | correct × 10, 200점 만점 | 난이도별 + 시간보너스, 150점 만점 |
| 오답 시스템 | 3회 오답 = 게임오버 | 객체별 3회 찬스, 소진 시 그 객체만 오답 |
| 타이머 | 없음 | Easy=10s, Medium=15s, Hard=20s |
| 힌트 | 없음 | 객체별 1회, 사용 시 해당 객체 점수 50% |

### 점수 체계

| 문제 | 객체 1 | 객체 2 | 객체 3 |
|------|--------|--------|--------|
| Easy (1개) | 10점 | — | — |
| Medium (2개) | 5점 | 5점 | — |
| Hard (3개) | 3점 | 3점 | 4점 |

시간 보너스 (모든 객체 찾은 경우에만): 80%↑=+5, 50~79%=+3, 20~49%=+1, 20%↓=+0

힌트 사용: 해당 객체 점수 × 0.5 (floor)

### 등급

| 등급 | 이름 | 점수 |
|------|------|------|
| S | AI 감별사 | 130점~ |
| A | 디지털 탐정 | 100점~ |
| B | 견습 감별사 | 70점~ |
| C | AI 초보자 | 40점~ |
| D | AI에 속은 자 | 0점~ |

---

## 데이터 구조

### Supabase (photo-maker가 이미 생성)

```sql
quizzes (id, image_url, original_url, difficulty, status, created_at)
quiz_objects (id, quiz_id, ai_object_name, hitbox_x, hitbox_y, hitbox_w, hitbox_h, hint_cx, hint_cy, hint_radius, sort_order)
```

### 새로 필요한 테이블

```sql
-- 기존 quiz_sessions 교체
CREATE TABLE quiz_sessions (
  id           SERIAL PRIMARY KEY,
  nickname     TEXT NOT NULL,
  score        INTEGER NOT NULL DEFAULT 0,
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  finished_at  TIMESTAMPTZ
);

-- 랭킹 정렬: score DESC, hint_count ASC, finished_at ASC
-- hint_count는 score 계산 시 별도 컬럼으로 저장
```

### API → Client 페이로드 (hitbox 미노출)

```ts
// POST /api/quiz/start 응답
{
  session_id: string,
  questions: Array<{
    id: number,
    order: number,
    image_url: string,
    difficulty: 'easy' | 'medium' | 'hard',
    objects: Array<{
      id: number,
      name: string,
      hint: { type: 'area', cx: number, cy: number, radius: number }
             | { type: 'text', value: string }
    }>
  }>
}
// hitbox는 서버에서만 사용, 클라이언트에 미전달
```

---

## 아키텍처 결정사항

1. **타이머**: 클라이언트 사이드. 학교 이벤트용 게임이라 서버 강제 검증 불필요.
2. **클릭 검증**: 서버 사이드. `/api/quiz/click` 에서 hitbox 조회 후 판정. hitbox를 클라이언트에 보내지 않음.
3. **힌트 타입**: photo-maker의 `hint_cx/cy/radius`는 area 타입만 있음. text 힌트는 객체 이름으로 대체 ("고양이를 찾아보세요").
4. **문제 선택**: approved 상태 quizzes에서 difficulty별 랜덤 선택 (Easy 3, Medium 4, Hard 3).

---

## 변경 파일 목록

### 삭제
- `src/lib/questions.ts`
- `src/lib/sync-questions.ts`
- `src/components/quiz/normal-question.tsx`
- `src/components/quiz/twin-question.tsx`

### 전면 교체
- `src/types/quiz.ts`
- `src/lib/constants.ts`
- `src/lib/scoring.ts`
- `src/app/api/quiz/start/route.ts`
- `src/app/api/quiz/answer/route.ts` → `src/app/api/quiz/click/route.ts`로 교체
- `src/app/api/result/[sessionId]/route.ts`
- `src/app/api/rankings/route.ts`
- `src/components/quiz/quiz-container.tsx`
- `src/components/quiz/progress-bar.tsx`
- `src/components/quiz/answer-reveal.tsx`
- `src/app/page.tsx` (홈 디자인)
- `src/app/result/[sessionId]/page.tsx`
- `src/app/globals.css`

### 신규 생성
- `src/components/quiz/find-object-question.tsx`
- `src/components/quiz/hint-grid.tsx`
- `src/components/quiz/timer.tsx`
- `src/lib/quiz-select.ts`
