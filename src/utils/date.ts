/**
 * date.ts - 날짜 기반 거래 상태 판별
 *
 * 예정 거래는 별도 상태 필드 없이 날짜로 파생한다.
 * 날짜가 도래하면 자동으로 확정 거래가 되므로 확정 처리가 필요 없다.
 *
 * 상세 설계: docs/UPCOMING_TRANSACTIONS.md
 */

import { isAfter, isBefore, differenceInDays, startOfDay } from 'date-fns';
import type { Transaction } from '@/types';

/** 도래한 예정 거래에 '확인' 배지를 유지하는 기간(일). 지나면 조용히 확정으로 굳는다. */
export const SETTLEMENT_CHECK_WINDOW_DAYS = 7;

/**
 * 예정 거래 여부 — 오늘보다 뒤의 날짜인가
 *
 * 경계: 오늘은 예정이 아니다. 내일부터 예정.
 */
export function isUpcoming(date: Date): boolean {
  return isAfter(startOfDay(date), startOfDay(new Date()));
}

/**
 * 확정 거래만 남긴다 (예정 제외)
 *
 * 분석·집계 경로에서 사용한다. 홈 남은 예산과 예정 영역은 예정을 포함해야 하므로
 * 이 필터를 쓰지 않는다.
 */
export function filterSettled<T extends { date: Date }>(transactions: T[]): T[] {
  return transactions.filter((tx) => !isUpcoming(tx.date));
}

/**
 * 예정 거래만 남긴다
 */
export function filterUpcoming<T extends { date: Date }>(transactions: T[]): T[] {
  return transactions.filter((tx) => isUpcoming(tx.date));
}

/**
 * 도래한 예정 거래 중 아직 확인하지 않은 것인가 — 시한부 '확인' 배지의 판정.
 *
 * 선입력한 예정 거래는 날짜가 지나면 자동으로 확정 지출이 된다. 고지 금액이 예상과
 * 달랐어도 알아챌 방법이 없으므로, 도래 직후 일정 기간만 조용히 표시해 둔다.
 * 사용자가 손대지 않으면 기간이 지나 사라지고 그대로 확정된다 — 무응답 = 확정.
 *
 * 저장 필드를 늘리지 않고 기존 값만으로 판정한다.
 * - `createdAt < date`  : 발생 전에 미리 넣은 거래였다 (당일·소급 입력은 해당 없음)
 * - `updatedAt < date`  : 도래 후 손대지 않았다 (수정했다면 확인한 것으로 본다)
 * - '반복' 태그 제외    : 반복거래 자동 생성분은 금액이 고정이고 별도 알림이 있다
 */
export function needsSettlementCheck(
  tx: Pick<Transaction, 'date' | 'createdAt' | 'updatedAt' | 'tags'>,
  windowDays: number = SETTLEMENT_CHECK_WINDOW_DAYS
): boolean {
  const due = startOfDay(tx.date);
  if (isUpcoming(tx.date)) return false;
  if (!isBefore(startOfDay(tx.createdAt), due)) return false;
  if (!isBefore(startOfDay(tx.updatedAt), due)) return false;
  if (tx.tags?.includes('반복')) return false;
  return differenceInDays(startOfDay(new Date()), due) <= windowDays;
}

/**
 * 날짜가 바뀌었는지 감시하는 가드를 만든다.
 *
 * PWA는 탭이 메모리에 며칠 살아있을 수 있어, 백그라운드에 있는 동안 자정이나 월초를
 * 넘기면 화면의 "오늘"·"이번 달" 기준이 낡은 채로 남는다. 복귀 시점에 이 가드로
 * 날짜 변경을 감지해 데이터를 다시 읽는다.
 *
 * 생성 시점의 날짜를 기준으로 삼으므로, 만든 직후 첫 호출은 false다.
 */
export function createDayChangeGuard(): () => boolean {
  let last = new Date().toDateString();
  return () => {
    const today = new Date().toDateString();
    if (today === last) return false;
    last = today;
    return true;
  };
}

/**
 * 거래 목록을 확정/예정으로 나눈다
 */
export function splitByUpcoming(transactions: Transaction[]): {
  settled: Transaction[];
  upcoming: Transaction[];
} {
  const settled: Transaction[] = [];
  const upcoming: Transaction[] = [];

  for (const tx of transactions) {
    if (isUpcoming(tx.date)) {
      upcoming.push(tx);
    } else {
      settled.push(tx);
    }
  }

  return { settled, upcoming };
}
