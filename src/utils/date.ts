/**
 * date.ts - 날짜 기반 거래 상태 판별
 *
 * 예정 거래는 별도 상태 필드 없이 날짜로 파생한다.
 * 날짜가 도래하면 자동으로 확정 거래가 되므로 확정 처리가 필요 없다.
 *
 * 상세 설계: docs/UPCOMING_TRANSACTIONS.md
 */

import { isAfter, startOfDay } from 'date-fns';
import type { Transaction } from '@/types';

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
