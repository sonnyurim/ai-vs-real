"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      setError(`닉네임은 ${QUIZ_CONFIG.NICKNAME_MIN}자 이상이어야 합니다`);
      return;
    }
    if (trimmed.length > QUIZ_CONFIG.NICKNAME_MAX) {
      setError(`닉네임은 ${QUIZ_CONFIG.NICKNAME_MAX}자 이하여야 합니다`);
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
        setError(data.error ?? "오류가 발생했습니다");
        return;
      }

      const data = await res.json();
      sessionStorage.setItem("quiz_nickname", trimmed);
      sessionStorage.setItem("quiz_session", JSON.stringify(data));
      router.push("/quiz");
    } catch {
      setError("서버에 연결할 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">닉네임을 입력하세요</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임 (2~10자)"
            maxLength={QUIZ_CONFIG.NICKNAME_MAX}
            className="text-center text-3xl font-semibold h-16"
            autoFocus
          />
          {error && (
            <p className="text-center text-base text-destructive">{error}</p>
          )}
          <Button
            type="submit"
            size="lg"
            disabled={
              loading || nickname.trim().length < QUIZ_CONFIG.NICKNAME_MIN
            }
            className="h-14 text-lg bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {loading ? "준비 중..." : "퀴즈 시작"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
