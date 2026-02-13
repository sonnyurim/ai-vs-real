import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "quiz-images";

function getAnswer(filename: string): "ai" | "real" | null {
  // Check "real" first — "pair" contains "ai" substring
  if (filename.includes("real")) return "real";
  if (filename.includes("ai")) return "ai";
  return null;
}

function getPairId(filename: string): number | null {
  // pair-ai-01.jpg / pair-real-01.jpg → pair 1
  const match = filename.match(/pair-(?:ai|real)-(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

async function listFiles(
  supabase: SupabaseClient,
  folder: string,
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(folder, { limit: 200 });

  if (error) {
    console.warn(`[sync] ${folder}/ 목록 조회 실패:`, error.message);
    return [];
  }

  return (data ?? [])
    .filter((f) => f.name && !f.name.startsWith("."))
    .map((f) => f.name);
}

function buildQuestions(
  files: string[],
  folder: string,
  storageBase: string,
) {
  return files.flatMap((file) => {
    const answer = getAnswer(file);
    if (!answer) {
      console.warn(`  [skip] ${folder}/${file} — ai/real 구분 불가`);
      return [];
    }

    const pairId = folder === "twin" ? getPairId(file) : null;
    if (folder === "twin" && pairId === null) {
      console.warn(`  [skip] ${folder}/${file} — pair 번호 구분 불가`);
      return [];
    }

    return [
      {
        image_url: `${storageBase}/${folder}/${file}`,
        answer,
        pair_id: pairId,
      },
    ];
  });
}

export async function syncQuestions() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("[sync] SUPABASE_SERVICE_ROLE_KEY 없음 — 동기화 건너뜀");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const storageBase = `${supabaseUrl}/storage/v1/object/public/${BUCKET}`;

  // List files from storage
  const [normalFiles, twinFiles] = await Promise.all([
    listFiles(supabase, "normal"),
    listFiles(supabase, "twin"),
  ]);

  const questions = [
    ...buildQuestions(normalFiles, "normal", storageBase),
    ...buildQuestions(twinFiles, "twin", storageBase),
  ];

  if (questions.length === 0) {
    console.warn("[sync] 스토리지에 파일 없음");
    return;
  }

  // Compare with DB (check both URLs and answers)
  const { data: existing } = await supabase
    .from("questions")
    .select("image_url, answer");

  const existingKeys = new Set(
    (existing ?? []).map((q) => `${q.image_url}|${q.answer}`),
  );
  const newKeys = new Set(
    questions.map((q) => `${q.image_url}|${q.answer}`),
  );

  const isSynced =
    existingKeys.size === newKeys.size &&
    [...existingKeys].every((key) => newKeys.has(key));

  if (isSynced) {
    console.log(`[sync] 문제 ${existingKeys.size}개 — 이미 동기화됨`);
    return;
  }

  // Full replace (CASCADE deletes related question_votes)
  await supabase
    .from("questions")
    .delete()
    .gte("question_id", 0);

  const { data, error } = await supabase
    .from("questions")
    .insert(questions)
    .select("question_id, pair_id");

  if (error) {
    console.error("[sync] 동기화 실패:", error.message);
    return;
  }

  const normals = data.filter((q) => q.pair_id === null).length;
  const twins = data.filter((q) => q.pair_id !== null).length;
  console.log(
    `[sync] ${data.length}개 동기화 완료 (Normal: ${normals}, Twin: ${twins}개 ${twins / 2}쌍)`,
  );
}
