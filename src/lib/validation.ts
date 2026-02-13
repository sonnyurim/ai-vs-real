import { QUIZ_CONFIG } from "./constants";

const DANGEROUS_PATTERN = /[<>"'&]/g;

export function sanitizeNickname(raw: string): string {
  return raw.trim().replace(DANGEROUS_PATTERN, "");
}

export function validateNickname(nickname: string): string | null {
  const cleaned = sanitizeNickname(nickname);
  if (cleaned.length < QUIZ_CONFIG.NICKNAME_MIN) {
    return `닉네임은 ${QUIZ_CONFIG.NICKNAME_MIN}자 이상이어야 합니다`;
  }
  if (cleaned.length > QUIZ_CONFIG.NICKNAME_MAX) {
    return `닉네임은 ${QUIZ_CONFIG.NICKNAME_MAX}자 이하여야 합니다`;
  }
  return null;
}
