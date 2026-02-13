import type { QuestionRow, QuizQuestionPayload } from "@/types/quiz";
import { QUIZ_CONFIG } from "./constants";

// Fisher-Yates shuffle
function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Each "unit" = 1 question slot (normal = 1 row, twin pair = 2 rows → 1 slot)
type QuestionUnit = { type: "normal"; row: QuestionRow } | { type: "twin"; rows: QuestionRow[] };

export function selectQuestions(
  allQuestions: QuestionRow[],
): QuestionRow[] {
  // Build twin pairs
  const pairMap = new Map<number, QuestionRow[]>();
  for (const q of allQuestions) {
    if (q.pair_id === null) continue;
    const group = pairMap.get(q.pair_id) ?? [];
    group.push(q);
    pairMap.set(q.pair_id, group);
  }
  const twinUnits: QuestionUnit[] = [];
  for (const rows of pairMap.values()) {
    if (rows.length >= 2) twinUnits.push({ type: "twin", rows });
  }

  // Build normal units
  const normalUnits: QuestionUnit[] = allQuestions
    .filter((q) => q.pair_id === null)
    .map((row) => ({ type: "normal" as const, row }));

  // 4:6 ratio (twin:normal), fallback if not enough twins
  const twinTarget = Math.min(QUIZ_CONFIG.TWIN_COUNT, twinUnits.length);
  const normalTarget = QUIZ_CONFIG.TOTAL_QUESTIONS - twinTarget;

  const selected: QuestionUnit[] = [
    ...shuffle(twinUnits).slice(0, twinTarget),
    ...shuffle(normalUnits).slice(0, normalTarget),
  ];

  // Shuffle units (not individual rows) to interleave twin and normal
  return shuffle(selected).flatMap((u) =>
    u.type === "normal" ? [u.row] : u.rows,
  );
}

export function toQuestionPayloads(
  selected: QuestionRow[],
): QuizQuestionPayload[] {
  const payloads: QuizQuestionPayload[] = [];
  const processedPairs = new Set<number>();
  let order = 1;

  for (const q of selected) {
    // Normal question
    if (q.pair_id === null) {
      payloads.push({
        id: String(q.question_id),
        order: order++,
        image_url: q.image_url,
      });
      continue;
    }

    // Twin question - skip if pair already processed
    if (processedPairs.has(q.pair_id)) continue;
    processedPairs.add(q.pair_id);

    // Find both images in the pair
    const pair = selected.filter((s) => s.pair_id === q.pair_id);
    if (pair.length < 2) continue;

    // Randomly assign A/B positions
    const [first, second] =
      Math.random() < 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]];

    payloads.push({
      id: `twin-${q.pair_id}`,
      order: order++,
      is_twin: true,
      image_a: { id: String(first.question_id), url: first.image_url },
      image_b: { id: String(second.question_id), url: second.image_url },
    });
  }

  return payloads;
}
