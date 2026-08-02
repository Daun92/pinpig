import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { format } from 'date-fns';
import { db } from '@/services/database';
import { processRecurringTransactions, processSingleRecurringTransaction } from '@/services/budgetAlert';
import { executeRecurringTransaction, calculateNextExecutionDate } from '@/services/queries';
import type { RecurringTransaction } from '@/types';

// 기준일: 2026-08-02 (월 초, 이번 달 실행일들이 아직 오지 않은 시점)
const TODAY = new Date(2026, 7, 2);

let seq = 0;
function makeRecurring(overrides: Partial<RecurringTransaction> = {}): RecurringTransaction {
  seq += 1;
  return {
    id: `rt-test-${seq}`,
    type: 'expense',
    amount: 15000,
    categoryId: 'cat-test',
    frequency: 'monthly',
    dayOfMonth: 25,
    startDate: new Date(2026, 0, 25),
    isActive: true,
    executionMode: 'on_date',
    nextExecutionDate: new Date(2026, 7, 25),
    createdAt: new Date(2026, 0, 25),
    updatedAt: new Date(2026, 0, 25),
    ...overrides,
  };
}

async function getRecurring(id: string): Promise<RecurringTransaction> {
  const rt = await db.recurringTransactions.get(id);
  if (!rt) throw new Error(`반복거래 ${id}가 존재하지 않음`);
  return rt;
}

async function getSortedTxDates(): Promise<string[]> {
  const txs = await db.transactions.toArray();
  return txs
    .map((t) => format(t.date, 'yyyy-MM-dd'))
    .sort();
}

beforeEach(async () => {
  vi.useFakeTimers({ now: TODAY, toFake: ['Date'] });
  await db.transactions.clear();
  await db.recurringTransactions.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  await db.transactions.clear();
  await db.recurringTransactions.clear();
  db.close();
});

describe('processRecurringTransactions — 실행 모드별 생성 범위', () => {
  it('start_of_month: 실행일이 아직 안 왔어도 당월 거래를 미리 생성한다', async () => {
    const rt = makeRecurring({ executionMode: 'start_of_month' }); // 다음 실행일 08-25
    await db.recurringTransactions.add(rt);

    const created = await processRecurringTransactions();

    expect(created).toBe(1);
    expect(await getSortedTxDates()).toEqual(['2026-08-25']);

    const updated = await getRecurring(rt.id);
    expect(format(updated.nextExecutionDate, 'yyyy-MM-dd')).toBe('2026-09-25');
  });

  it('start_of_month + weekly: 당월 남은 회차 전체를 선반영하고 다음 달 회차는 만들지 않는다', async () => {
    const rt = makeRecurring({
      executionMode: 'start_of_month',
      frequency: 'weekly',
      dayOfMonth: undefined,
      nextExecutionDate: new Date(2026, 7, 5),
    });
    await db.recurringTransactions.add(rt);

    const created = await processRecurringTransactions();

    expect(created).toBe(4);
    expect(await getSortedTxDates()).toEqual([
      '2026-08-05',
      '2026-08-12',
      '2026-08-19',
      '2026-08-26',
    ]);

    const updated = await getRecurring(rt.id);
    expect(format(updated.nextExecutionDate, 'yyyy-MM-dd')).toBe('2026-09-02');
  });

  it('on_date: 실행일이 오기 전에는 생성하지 않는다', async () => {
    const rt = makeRecurring({ executionMode: 'on_date' }); // 다음 실행일 08-25
    await db.recurringTransactions.add(rt);

    const created = await processRecurringTransactions();

    expect(created).toBe(0);
    expect(await db.transactions.count()).toBe(0);

    const updated = await getRecurring(rt.id);
    expect(format(updated.nextExecutionDate, 'yyyy-MM-dd')).toBe('2026-08-25');
  });

  it('on_date: 지난 실행일은 catch-up으로 생성한다 (기존 동작 유지)', async () => {
    const rt = makeRecurring({
      executionMode: 'on_date',
      dayOfMonth: 1,
      nextExecutionDate: new Date(2026, 7, 1),
    });
    await db.recurringTransactions.add(rt);

    const created = await processRecurringTransactions();

    expect(created).toBe(1);
    expect(await getSortedTxDates()).toEqual(['2026-08-01']);

    const updated = await getRecurring(rt.id);
    expect(format(updated.nextExecutionDate, 'yyyy-MM-dd')).toBe('2026-09-01');
  });

  it('executionMode 미지정(기존 데이터): on_date와 동일하게 동작한다', async () => {
    const rt = makeRecurring({ executionMode: undefined }); // 다음 실행일 08-25
    await db.recurringTransactions.add(rt);

    const created = await processRecurringTransactions();

    expect(created).toBe(0);
    expect(await db.transactions.count()).toBe(0);
  });

  it('start_of_month: endDate 이후 회차는 선반영하지 않는다', async () => {
    const rt = makeRecurring({
      executionMode: 'start_of_month',
      endDate: new Date(2026, 7, 10), // 다음 실행일 08-25 > 종료일 08-10
    });
    await db.recurringTransactions.add(rt);

    const created = await processRecurringTransactions();

    expect(created).toBe(0);
    expect(await db.transactions.count()).toBe(0);
  });

  it('start_of_month: 당월 회차 실행 후 다음 회차가 endDate를 넘으면 비활성화된다', async () => {
    const rt = makeRecurring({
      executionMode: 'start_of_month',
      endDate: new Date(2026, 7, 31),
    });
    await db.recurringTransactions.add(rt);

    const created = await processRecurringTransactions();

    expect(created).toBe(1);
    const updated = await getRecurring(rt.id);
    expect(updated.isActive).toBe(false);
  });
});

describe('processSingleRecurringTransaction — 등록·편집 직후 처리', () => {
  it('on_date + 미래 실행일: 미리 생성하지 않는다', async () => {
    const rt = makeRecurring({ executionMode: 'on_date' }); // 다음 실행일 08-25
    await db.recurringTransactions.add(rt);

    const created = await processSingleRecurringTransaction(rt.id);

    expect(created).toBe(0);
    expect(await db.transactions.count()).toBe(0);
  });

  it('start_of_month + 당월 미래 실행일: 당월 회차를 즉시 선반영한다', async () => {
    const rt = makeRecurring({ executionMode: 'start_of_month' }); // 다음 실행일 08-25
    await db.recurringTransactions.add(rt);

    const created = await processSingleRecurringTransaction(rt.id);

    expect(created).toBe(1);
    expect(await getSortedTxDates()).toEqual(['2026-08-25']);

    const updated = await getRecurring(rt.id);
    expect(format(updated.nextExecutionDate, 'yyyy-MM-dd')).toBe('2026-09-25');
  });

  it('on_date + 오늘 실행일: 오늘 회차만 생성한다', async () => {
    const rt = makeRecurring({
      executionMode: 'on_date',
      dayOfMonth: 2,
      nextExecutionDate: new Date(2026, 7, 2),
    });
    await db.recurringTransactions.add(rt);

    const created = await processSingleRecurringTransaction(rt.id);

    expect(created).toBe(1);
    expect(await getSortedTxDates()).toEqual(['2026-08-02']);

    const updated = await getRecurring(rt.id);
    expect(format(updated.nextExecutionDate, 'yyyy-MM-dd')).toBe('2026-09-02');
  });

  it('비활성 반복거래는 처리하지 않는다', async () => {
    const rt = makeRecurring({ executionMode: 'start_of_month', isActive: false });
    await db.recurringTransactions.add(rt);

    const created = await processSingleRecurringTransaction(rt.id);

    expect(created).toBe(0);
    expect(await db.transactions.count()).toBe(0);
  });
});

describe('executeRecurringTransaction — 동시 실행 안전성', () => {
  it('동일 회차 동시 실행 시 한 번만 생성된다 (멀티 탭 가드)', async () => {
    const rt = makeRecurring({
      executionMode: 'on_date',
      dayOfMonth: 1,
      nextExecutionDate: new Date(2026, 7, 1),
    });
    await db.recurringTransactions.add(rt);

    const target = new Date(2026, 7, 1);
    const [a, b] = await Promise.all([
      executeRecurringTransaction(rt.id, target),
      executeRecurringTransaction(rt.id, target),
    ]);

    expect([a, b].filter(Boolean)).toHaveLength(1);
    expect(await db.transactions.count()).toBe(1);

    const updated = await getRecurring(rt.id);
    expect(format(updated.nextExecutionDate, 'yyyy-MM-dd')).toBe('2026-09-01');
  });
});

describe('processRecurringTransactions — 에러 격리', () => {
  it('한 반복거래 처리 실패가 다른 항목 처리를 막지 않는다', async () => {
    const rt1 = makeRecurring({ dayOfMonth: 1, nextExecutionDate: new Date(2026, 7, 1) });
    const rt2 = makeRecurring({ dayOfMonth: 1, nextExecutionDate: new Date(2026, 7, 1) });
    await db.recurringTransactions.add(rt1);
    await db.recurringTransactions.add(rt2);

    // 첫 번째 거래 생성만 실패시킴 (둘 중 어느 항목이 먼저든 나머지는 처리돼야 함)
    const addSpy = vi.spyOn(db.transactions, 'add').mockRejectedValueOnce(new Error('boom'));
    const created = await processRecurringTransactions();
    addSpy.mockRestore();

    expect(created).toBe(1);
    expect(await db.transactions.count()).toBe(1);
  });
});

describe('calculateNextExecutionDate — 월말 경계', () => {
  it('매월 31일 기준: 2월엔 말일로 축소되고 이후 31일로 복원된다', () => {
    const jan31 = new Date(2026, 0, 31);
    const feb = calculateNextExecutionDate('monthly', jan31, 31);
    expect(format(feb, 'yyyy-MM-dd')).toBe('2026-02-28');

    const mar = calculateNextExecutionDate('monthly', feb, 31);
    expect(format(mar, 'yyyy-MM-dd')).toBe('2026-03-31');
  });

  it('윤년 2월은 29일까지 허용된다', () => {
    const jan31 = new Date(2028, 0, 31);
    expect(format(calculateNextExecutionDate('monthly', jan31, 31), 'yyyy-MM-dd')).toBe('2028-02-29');
  });
});
