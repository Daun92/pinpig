/**
 * 예정 거래(미래 날짜 선입력) 정합성 테스트
 *
 * 설계: docs/UPCOMING_TRANSACTIONS.md
 * - 홈 남은 예산: 확정 + 예정 차감 (현행 유지)
 * - 분석·카테고리 예산 사용률: 확정만
 * - 반복 선반영분과 수동 예정분이 이중계상되지 않을 것
 */

import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { db } from '@/services/database';
import { getCategoryBreakdown, getMonthlyBudgetStructure } from '@/services/queries';
import { selectBudgetStatus } from '@/stores/transactionStore';
import { isUpcoming, createDayChangeGuard } from '@/utils/date';
import type { Transaction } from '@/types';

// 기준일: 2026-08-07 (월 중반 — 확정과 예정이 같은 달에 공존하는 시점)
const TODAY = new Date(2026, 7, 7, 9, 0, 0);

let seq = 0;
function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  seq += 1;
  return {
    id: `tx-test-${seq}`,
    type: 'expense',
    amount: 10000,
    categoryId: 'cat-food',
    date: new Date(2026, 7, 5),
    time: '12:00',
    createdAt: TODAY,
    updatedAt: TODAY,
    ...overrides,
  };
}

/** selectBudgetStatus는 스토어의 transactions·currentMonth만 읽는다 */
function budgetStatusOf(monthlyBudget: number, transactions: Transaction[]) {
  const state = { transactions, currentMonth: new Date(2026, 7, 1) };
  return selectBudgetStatus(monthlyBudget)(
    state as unknown as Parameters<ReturnType<typeof selectBudgetStatus>>[0]
  );
}

beforeEach(async () => {
  vi.useFakeTimers({ now: TODAY, toFake: ['Date'] });
  await db.transactions.clear();
  await db.categories.clear();
  await db.recurringTransactions.clear();
  await db.settings.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  await db.transactions.clear();
  await db.categories.clear();
  await db.recurringTransactions.clear();
  await db.settings.clear();
  db.close();
});

describe('isUpcoming — 경계', () => {
  it('오늘은 예정이 아니다 (23:59 포함)', () => {
    expect(isUpcoming(new Date(2026, 7, 7, 0, 0, 0))).toBe(false);
    expect(isUpcoming(new Date(2026, 7, 7, 23, 59, 59))).toBe(false);
  });

  it('내일 00:00부터 예정이다', () => {
    expect(isUpcoming(new Date(2026, 7, 8, 0, 0, 0))).toBe(true);
  });

  it('과거는 예정이 아니다', () => {
    expect(isUpcoming(new Date(2026, 7, 6, 23, 59, 59))).toBe(false);
  });
});

describe('createDayChangeGuard — PWA 장기 체류 대응', () => {
  it('같은 날 안에서는 계속 false다', () => {
    const changed = createDayChangeGuard();
    expect(changed()).toBe(false);
    vi.setSystemTime(new Date(2026, 7, 7, 23, 59, 59));
    expect(changed()).toBe(false);
  });

  it('자정을 넘기면 한 번만 true를 준다', () => {
    const changed = createDayChangeGuard();
    vi.setSystemTime(new Date(2026, 7, 8, 0, 0, 1));
    expect(changed()).toBe(true);
    expect(changed()).toBe(false);
  });

  it('월이 바뀌어도 감지한다', () => {
    vi.setSystemTime(new Date(2026, 7, 31, 23, 0, 0));
    const changed = createDayChangeGuard();
    vi.setSystemTime(new Date(2026, 8, 1, 9, 0, 0));
    expect(changed()).toBe(true);
  });

  it('며칠을 건너뛰어도 감지한다', () => {
    const changed = createDayChangeGuard();
    vi.setSystemTime(new Date(2026, 7, 12, 8, 0, 0));
    expect(changed()).toBe(true);
  });
});

describe('selectBudgetStatus — 확정/예정 분리', () => {
  it('확정과 예정을 나눠 노출하되 totalExpense·remaining은 합산 기준을 유지한다', () => {
    const status = budgetStatusOf(2_000_000, [
      makeTx({ amount: 300_000, date: new Date(2026, 7, 5) }),  // 확정
      makeTx({ amount: 500_000, date: new Date(2026, 7, 25) }), // 예정
    ]);

    expect(status.actualExpense).toBe(300_000);
    expect(status.upcomingExpense).toBe(500_000);
    expect(status.totalExpense).toBe(800_000);
    // 회귀 고정: 남은 예산은 종전과 동일하게 예정까지 차감한 값
    expect(status.remaining).toBe(1_200_000);
    expect(status.percentUsed).toBe(40);
  });

  it('예정이 없으면 upcomingExpense는 0이고 remaining은 변하지 않는다', () => {
    const status = budgetStatusOf(2_000_000, [
      makeTx({ amount: 300_000, date: new Date(2026, 7, 5) }),
    ]);

    expect(status.upcomingExpense).toBe(0);
    expect(status.actualExpense).toBe(300_000);
    expect(status.remaining).toBe(1_700_000);
  });

  it('수입은 지출 집계에 섞이지 않는다', () => {
    const status = budgetStatusOf(2_000_000, [
      makeTx({ type: 'income', amount: 3_000_000, date: new Date(2026, 7, 25) }),
      makeTx({ amount: 100_000, date: new Date(2026, 7, 5) }),
    ]);

    expect(status.actualExpense).toBe(100_000);
    expect(status.upcomingExpense).toBe(0);
    expect(status.remaining).toBe(1_900_000);
  });
});

describe('getCategoryBreakdown — 분석은 확정만', () => {
  it('미래 날짜 거래는 분석 집계에서 빠진다', async () => {
    await db.categories.add({
      id: 'cat-food',
      name: '식비',
      icon: 'Utensils',
      color: '#FF6B6B',
      type: 'expense',
      order: 0,
      createdAt: TODAY,
      updatedAt: TODAY,
    });
    await db.transactions.bulkAdd([
      makeTx({ amount: 300_000, date: new Date(2026, 7, 5) }),  // 확정
      makeTx({ amount: 500_000, date: new Date(2026, 7, 25) }), // 예정
    ]);

    const breakdown = await getCategoryBreakdown(2026, 8, 'expense');
    const food = breakdown.find((c) => c.categoryId === 'cat-food');

    expect(food?.amount).toBe(300_000);
    expect(food?.count).toBe(1);
  });
});

describe('getMonthlyBudgetStructure — 이중계상 없음', () => {
  beforeEach(async () => {
    await db.settings.add({
      id: 'default',
      monthlyBudget: 2_000_000,
      currency: 'KRW',
      theme: 'system',
      createdAt: TODAY,
      updatedAt: TODAY,
    } as never);
    await db.categories.add({
      id: 'cat-food',
      name: '식비',
      icon: 'Utensils',
      color: '#FF6B6B',
      type: 'expense',
      budget: 600_000,
      order: 0,
      createdAt: TODAY,
      updatedAt: TODAY,
    });
  });

  it('카테고리 currentSpent는 확정만, projectedSpent는 예정을 더한 값이다', async () => {
    await db.transactions.bulkAdd([
      makeTx({ amount: 200_000, date: new Date(2026, 7, 5) }),  // 확정
      makeTx({ amount: 150_000, date: new Date(2026, 7, 25) }), // 예정 (수동 선입력)
    ]);

    const structure = await getMonthlyBudgetStructure(2026, 8);
    const food = structure.categoryBudgets.find((c) => c.categoryId === 'cat-food');

    expect(food?.currentSpent).toBe(200_000);
    expect(food?.projectedSpent).toBe(350_000);
    expect(food?.remainingBudget).toBe(250_000);
  });

  it('선반영된 반복거래와 수동 예정이 함께 있어도 한 번만 반영된다', async () => {
    // 월초 선반영으로 이미 실거래가 된 반복 건 — nextExecutionDate는 다음 달로 이동한 상태
    await db.recurringTransactions.add({
      id: 'rt-rent',
      type: 'expense',
      amount: 400_000,
      categoryId: 'cat-food',
      frequency: 'monthly',
      dayOfMonth: 20,
      startDate: new Date(2026, 0, 20),
      isActive: true,
      executionMode: 'start_of_month',
      nextExecutionDate: new Date(2026, 8, 20), // 9월 — 8월분은 이미 생성됨
      createdAt: new Date(2026, 0, 20),
      updatedAt: TODAY,
    });
    await db.transactions.bulkAdd([
      makeTx({ amount: 200_000, date: new Date(2026, 7, 5) }),                  // 확정
      makeTx({ id: 'tx-rent-08', amount: 400_000, date: new Date(2026, 7, 20) }), // 선반영된 반복분(미래)
      makeTx({ amount: 150_000, date: new Date(2026, 7, 25) }),                 // 수동 예정
    ]);

    const structure = await getMonthlyBudgetStructure(2026, 8);
    const food = structure.categoryBudgets.find((c) => c.categoryId === 'cat-food');

    // 반복 예상(fixedExpenses)에는 잡히지 않아야 한다 — 이미 거래로 존재하므로
    expect(structure.fixedExpenses).toBe(0);
    expect(food?.currentSpent).toBe(200_000);
    // 200,000(확정) + 400,000(선반영) + 150,000(수동예정) — 400,000이 두 번 세어지지 않는다
    expect(food?.projectedSpent).toBe(750_000);
    expect(structure.projectedBalance).toBe(-750_000);
  });

  it('아직 생성되지 않은 반복 예상은 fixedExpenses로 잡히고 거래와 겹치지 않는다', async () => {
    await db.recurringTransactions.add({
      id: 'rt-sub',
      type: 'expense',
      amount: 100_000,
      categoryId: 'cat-food',
      frequency: 'monthly',
      dayOfMonth: 20,
      startDate: new Date(2026, 0, 20),
      isActive: true,
      executionMode: 'on_date',
      nextExecutionDate: new Date(2026, 7, 20), // 8월분 아직 미생성
      createdAt: new Date(2026, 0, 20),
      updatedAt: TODAY,
    });
    await db.transactions.add(makeTx({ amount: 200_000, date: new Date(2026, 7, 5) }));

    const structure = await getMonthlyBudgetStructure(2026, 8);
    const food = structure.categoryBudgets.find((c) => c.categoryId === 'cat-food');

    expect(structure.fixedExpenses).toBe(100_000);
    expect(food?.currentSpent).toBe(200_000);
    expect(food?.projectedSpent).toBe(300_000);
  });
});
