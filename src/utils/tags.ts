/**
 * 태그 파싱 유틸리티
 *
 * 해시태그 스타일 (#태그)로 메모와 태그를 분리
 * 입력: "점심 #회식 #팀점심 새로 생긴 맛집"
 * 결과: { memo: "점심 새로 생긴 맛집", tags: ["회식", "팀점심"] }
 */

export interface ParsedMemo {
  memo: string;
  tags: string[];
}

/**
 * 메모 문자열에서 해시태그를 추출하고 분리
 * @param input 원본 메모 문자열 (태그 포함)
 * @returns 분리된 메모와 태그 배열
 */
export function parseMemoWithTags(input: string): ParsedMemo {
  if (!input || typeof input !== 'string') {
    return { memo: '', tags: [] };
  }

  // #태그1#태그2 형태도 분리되도록 # 앞에 공백 추가 후 파싱
  const normalized = input.replace(/#/g, ' #').trim();

  // 해시태그 패턴: # 뒤에 공백과 #이 아닌 문자들
  const tagPattern = /#[^\s#]+/g;
  const tagMatches = normalized.match(tagPattern);

  // 태그 추출 (# 제거, 중복 제거)
  const tags = tagMatches
    ? [...new Set(tagMatches.map((t) => t.slice(1)))]
    : [];

  // 메모에서 태그 제거 후 정리
  const memo = normalized
    .replace(tagPattern, '')
    .replace(/\s+/g, ' ') // 연속 공백을 하나로
    .trim();

  return { memo, tags };
}

/**
 * 메모와 태그를 다시 하나의 문자열로 합침 (수정 시 사용)
 * 태그가 앞에, 메모가 뒤에 오도록 순서 고정 (입력 UX와 일관성 유지)
 * @param memo 메모 텍스트
 * @param tags 태그 배열
 * @returns 합쳐진 문자열 (예: "#회식 #팀 점심 맛집")
 */
export function combineMemoWithTags(memo: string, tags: string[]): string {
  const memoText = memo?.trim() || '';
  const tagsText = tags?.length ? tags.map((t) => `#${t}`).join(' ') : '';

  // 태그가 앞에, 메모가 뒤에 (입력 필드 표시 순서와 일관성 유지)
  if (memoText && tagsText) {
    return `${tagsText} ${memoText}`;
  }
  return tagsText || memoText;
}

/**
 * 목록 표시용 메모 미리보기 (태그 제외, 길이 제한)
 * @param memo 메모 텍스트 (태그 제외된 순수 텍스트)
 * @param maxLength 최대 길이 (기본 10자)
 * @returns 축약된 메모
 */
export function getMemoPreview(memo: string | undefined, maxLength = 10): string {
  if (!memo) return '';

  const trimmed = memo.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.slice(0, maxLength) + '…';
}

/**
 * 태그 유효성 검사
 * - 빈 문자열 제외
 * - 특수문자 제한 (알파벳, 한글, 숫자, _, - 만 허용)
 * @param tag 검사할 태그
 * @returns 유효 여부
 */
export function isValidTag(tag: string): boolean {
  if (!tag || typeof tag !== 'string') return false;

  const trimmed = tag.trim();
  if (trimmed.length === 0 || trimmed.length > 20) return false;

  // 알파벳, 한글, 숫자, _, - 만 허용
  const validPattern = /^[\w가-힣-]+$/;
  return validPattern.test(trimmed);
}

/**
 * 태그 배열 정규화 (중복 제거, 유효성 검사, 정렬)
 * @param tags 원본 태그 배열
 * @returns 정규화된 태그 배열
 */
export function normalizeTags(tags: string[]): string[] {
  if (!tags || !Array.isArray(tags)) return [];

  return [...new Set(tags.map((t) => t.trim()).filter(isValidTag))].sort();
}
