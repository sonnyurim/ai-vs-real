"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUIZ_CONFIG } from "@/lib/constants";

export function NicknameForm() {
  const router = useRouter();
  const [nickname, setNickname] = useState(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("quiz_nickname") ?? ""
      : "",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();

    if (trimmed.length < QUIZ_CONFIG.NICKNAME_MIN) {
      setError(`ERR: ${QUIZ_CONFIG.NICKNAME_MIN}자 이상 입력하세요`);
      return;
    }
    if (trimmed.length > QUIZ_CONFIG.NICKNAME_MAX) {
      setError(`ERR: ${QUIZ_CONFIG.NICKNAME_MAX}자 이하로 입력하세요`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(`ERR: ${data.error ?? "오류가 발생했습니다"}`);
        return;
      }

      const data = await res.json();
      sessionStorage.setItem("quiz_nickname", trimmed);
      sessionStorage.setItem("quiz_session", JSON.stringify(data));
      router.push("/quiz");
    } catch {
      setError("ERR: 서버에 연결할 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  const ready = !loading && nickname.trim().length >= QUIZ_CONFIG.NICKNAME_MIN;

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-6">
      {/* 주석 */}
      <p className="font-mono text-[11px] text-muted-foreground/40">
        // IDENTITY VERIFICATION
      </p>

      {/* 프롬프트 인풋 */}
      <div className="flex items-baseline gap-3">
        <span className="shrink-0 font-mono text-sm font-bold text-brand">
          CODENAME :&gt;
        </span>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="두 글자 이상 입력하세요."
          maxLength={QUIZ_CONFIG.NICKNAME_MAX}
          autoFocus
          className="flex-1 bg-transparent font-mono text-2xl font-bold text-foreground caret-brand placeholder:text-muted-foreground/20 focus:outline-none"
        />
      </div>

      {/* 구분선 */}
      <div className="h-px bg-border" />

      {/* 에러 */}
      {error && (
        <p className="font-mono text-[11px] text-destructive">{error}</p>
      )}

      {/* 버튼 */}
      <button
        type="submit"
        disabled={!ready}
        className="w-full rounded border border-brand bg-transparent py-3 font-mono text-sm font-bold tracking-widest text-brand transition-colors hover:bg-brand hover:text-[#0c0b09] disabled:border-border disabled:text-muted-foreground/30"
      >
        {loading ? "[ 로딩 중... ]" : "[ 수사 시작  → ]"}
      </button>
    </form>
  );
}
