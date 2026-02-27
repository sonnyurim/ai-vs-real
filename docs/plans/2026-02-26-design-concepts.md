# Design Concepts — Find the AI

3가지 디자인 컨셉 제안. Pencil 목업 포함.

---

## Concept A — "AI Scanner"

> "당신의 눈이 분석 장비다"

### 무드
차갑고 정밀한 분석 인터페이스. 이미지를 올리면 스캔 라인이 훑고 이질적인 영역을 검출하는 장비를 다루는 느낌.

### 색상
| 역할 | 값 | 설명 |
|------|-----|------|
| Background | `#050a0e` | 거의 검정에 가까운 딥 블랙 |
| Surface | `#0d1f2d` | 다크 네이비 카드 배경 |
| Primary | `#00ff88` | 형광 그린 — 스캔/검출 성공 |
| Accent | `#00ccff` | 사이언 블루 — UI 강조 |
| Warning | `#ff4444` | 레드 — 오답/실패 |
| Text | `#e0f0ff` | 차가운 흰색 |

### 타이포그래피
- 헤드라인: `JetBrains Mono` — 터미널/장비 디스플레이
- 본문: `Inter` — 클린 가독성
- 수치(타이머/점수): `JetBrains Mono Bold`

### UI 언어
- 이미지 프레임: 코너 브래킷 `⌐ ¬` + 얇은 그린 보더
- 클릭 시: 그린 크로스헤어 마커 + "SCANNING..." 텍스트 피드백
- 정답: "✓ ANOMALY DETECTED" 배너, 초록 스캔라인 오버레이
- 오답: "✗ FALSE POSITIVE" 배너, 레드 X 마커
- 타이머: 수평 진행 바가 왼쪽에서 오른쪽으로 소진 (분석 진행률)
- 클릭 찬스: `● ● ●` 원형 인디케이터, 소진 시 `○` 로 변경
- 힌트: `[ HINT AVAILABLE ]` 토글 버튼 — 클릭 시 오버레이 원 표시

### 결과 화면
분석 리포트 터미널 출력 형식:
```
> ANALYSIS COMPLETE
> DETECTION RATE: 8/10
> SCORE: 120pts
> RANK: A — DIGITAL DETECTIVE
```

---

## Concept B — "AI vs Human"

> "인간의 눈이 AI를 이길 수 있나?"

### 무드
대결 구도. 좌우 대립 프레임으로 "HUMAN vs AI" 긴장감 극대화. e스포츠/대결 포스터 에너지.

### 색상
| 역할 | 값 | 설명 |
|------|-----|------|
| Background | `#0a0a0f` | 딥 다크 |
| Human side | `#f5a623` | 웜 앰버 — 인간 |
| AI side | `#4f6ef7` | 일렉트릭 블루 — AI |
| Neutral | `#1a1a2e` | 다크 네이비 카드 |
| Success | `#22c55e` | 그린 — 정답 |
| Fail | `#ef4444` | 레드 — 오답 |
| Text | `#f8f8ff` | 흰색 |

### 타이포그래피
- 헤드라인: `Barlow Condensed ExtraBold` — 스포츠 포스터, 임팩트
- 본문: `Inter Medium`
- 스코어/수치: `Barlow Condensed Bold`

### UI 언어
- 헤더: `HUMAN ── [점수] ── AI` 대결 구도 상시 표시
- 이미지 프레임: 두꺼운 보더, 앰버 코너 포인트
- 클릭 마커: 조준경(⊕) 스타일
- 정답: 앰버 폭발 이펙트 + "HUMAN WINS THIS ROUND"
- 오답: AI 블루 플래시 + "AI FOOLED YOU"
- 타이머: 원형 카운트다운 (시계처럼 줄어드는 형태)
- 찬스: `×3`, `×2`, `×1` 굵은 숫자 카운터

### 결과 화면
스코어보드 형식. 최종 승자 선언:
```
FINAL SCORE: 120pts

HUMAN  ████████░░  80%
AI     ██░░░░░░░░  20%

HUMAN WINS
AI 감별사 달성
```

---

## Concept C — "Authenticity Lab"

> "진짜를 가려내는 연구소"

### 무드
과학적이고 신뢰감 있는 분위기. 사진이 현미경 슬라이드 표본처럼 다뤄지고, 결과는 연구 리포트로 출력됨. 진중하고 교육적.

### 색상
| 역할 | 값 | 설명 |
|------|-----|------|
| Background | `#f5f4ef` | 따뜻한 오프화이트 (라이트 모드) |
| Surface | `#ffffff` | 흰색 카드 |
| Primary | `#1e3a5f` | 딥 인디고 — 신뢰/권위 |
| Accent | `#e8a020` | 앰버 포인트 — 경고/강조 |
| Success | `#2d7a4f` | 다크 그린 — 정답 |
| Fail | `#c0392b` | 다크 레드 — 오답 |
| Text | `#1a1a1a` | 거의 검정 |

### 타이포그래피
- 헤드라인: `DM Serif Display` — 학술/신뢰감
- 본문: `Source Sans 3` — 가독성 최우선
- 레이블/UI: `DM Mono` — 데이터 포인트

### UI 언어
- 이미지 프레임: 얇은 인디고 보더 + `SPECIMEN #04` 레이블
- 클릭 마커: 핀 (📍) 스타일, 번호 태그 포함
- 정답: 인디고 체크마크 + "VERIFIED: AI ARTIFACT"
- 오답: 앰버 경고 삼각형 + "AUTHENTIC ELEMENT"
- 타이머: 수평 바 + 초 숫자 (미니멀)
- 찬스: `Attempts: 3 / 3` 텍스트 형태
- 힌트: `REQUEST ANALYSIS HINT` 버튼

### 결과 화면
연구 리포트 출력 형식:
```
AUTHENTICITY ANALYSIS REPORT
Subject: [닉네임]  Date: 2026-02-26

Detection Accuracy: 80%
Total Score: 120 / 150

Classification: GRADE A
Designation: Digital Detective
```

---

## 비교 요약

| 항목 | A. AI Scanner | B. AI vs Human | C. Authenticity Lab |
|------|--------------|----------------|---------------------|
| 무드 | 차갑고 정밀 | 뜨겁고 대결적 | 진중하고 학술적 |
| 배경 | 다크 | 다크 | 라이트 |
| 타깃 감성 | 테크 긱 | 게이머 | 교육/전시 |
| 연암공대 맥락 | 중립 | 중립 | 잘 어울림 |
| 구현 난이도 | 중 | 중 | 하 |
