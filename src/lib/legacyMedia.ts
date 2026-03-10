/**
 * Legacy 미디어 URL 해석 - url / img 필드 통일
 * WorklogPage, DocPage, worklogStore 등에서 단일 규칙으로 사용
 */
function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

/**
 * 레거시 항목에서 미디어 URL 문자열을 추출합니다.
 * url 우선, 없으면 img 사용. 없거나 비문자열이면 빈 문자열 반환.
 */
export function getLegacyMediaUrl(item: unknown): string {
  const row = asRecord(item);
  if (!row) return "";
  if (typeof row.url === "string" && row.url.trim()) return row.url.trim();
  if (typeof row.img === "string" && row.img.trim()) return row.img.trim();
  return "";
}
