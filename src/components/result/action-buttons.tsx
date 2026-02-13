"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ActionButtons() {
  const router = useRouter();

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <Button
        variant="outline"
        onClick={() => router.push("/ranking")}
        className="w-full h-14 text-lg"
        size="lg"
      >
        랭킹 보기
      </Button>
      <Button
        variant="ghost"
        onClick={() => router.push("/")}
        className="w-full h-14 text-lg"
        size="lg"
      >
        다시 도전하기
      </Button>
    </div>
  );
}
