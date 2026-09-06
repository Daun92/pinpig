/**
 * PinPig 백업 복원 테스트
 *
 * 재현 대상: 설정 > 전체 백업(JSON)을 데이터 가져오기에 넣으면
 * 타 앱용 파서(parseJSON)가 빈 배열을 돌려주고, 래핑을 풀어도
 * 카테고리 id·type이 유실되던 문제. 전용 복원 경로가 이를 해결한다.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { db } from '@/services/database';
import { parseJSON } from '@/services/excelImport';
import {
  parsePinPigBackup,
  isPinPigBackup,
  getBackupSummary,
  restorePinPigBackup,
  type PinPigBackup,
} from '@/services/backupRestore';
import type {
  Transaction,
  Category,
  PaymentMethod,
  IncomeSource,
  Settings,
  RecurringTransaction,
} from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

const NOW = new Date(2026, 8, 7, 10, 0, 0);

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-food',
    name: '식비',
    icon: 'Utensils',
    color: '#FF9800',
    type: 'expense',
    order: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as Category;
}

function makePaymentMethod(overrides: Partial<PaymentMethod> = {}): PaymentMethod {
  return {
    id: 'pm-card',
    name: '카드',
    icon: 'CreditCard',
    color: '#2196F3',
    order: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as PaymentMethod;
}

function makeIncomeSource(overrides: Partial<IncomeSource> = {}): IncomeSource {
  return {
    id: 'is-cash',
    name: '현금',
    icon: 'Banknote',
    color: '#4CAF50',
    order: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as IncomeSource;
}

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    type: 'expense',
    amount: 12000,
    categoryId: 'cat-food',
    paymentMethodId: 'pm-card',
    memo: '점심',
    date: new Date(2026, 8, 3),
    time: '12:30',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as Transaction;
}

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    id: 'default',
    ...DEFAULT_SETTINGS,
    monthlyBudget: 1500000,
    isOnboardingComplete: true,
    updatedAt: NOW,
    ...overrides,
  } as Settings;
}

function makeRecurring(overrides: Partial<RecurringTransaction> = {}): RecurringTransaction {
  return {
    id: 'rec-1',
    type: 'expense',
    amount: 9900,
    categoryId: 'cat-food',
    paymentMethodId: 'pm-card',
    memo: '구독',
    frequency: 'monthly',
    dayOfMonth: 15,
    startDate: new Date(2026, 0, 15),
    isActive: true,
    nextExecutionDate: new Date(2026, 8, 15),
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as RecurringTransaction;
}

/** exportAllDataToJSON이 만드는 것과 같은 구조를 JSON 왕복시켜 만든다 */
function buildBackupJson(overrides: Partial<PinPigBackup['data']> = {}, version = '1.1'): string {
  const payload = {
    version,
    exportedAt: NOW.toISOString(),
    data: {
      transactions: [
        makeTx(),
        makeTx({ id: 'tx-2', type: 'income', amount: 3000000, categoryId: 'cat-salary', paymentMethodId: undefined, incomeSourceId: 'is-cash', memo: '월급', date: new Date(2026, 8, 25) }),
      ],
      categories: [makeCategory(), makeCategory({ id: 'cat-salary', name: '급여', type: 'income' })],
      paymentMethods: [makePaymentMethod()],
      settings: [makeSettings()],
      recurringTransactions: [makeRecurring()],
      incomeSources: [makeIncomeSource()],
      annualExpenses: [],
      ...overrides,
    },
  };
  return JSON.stringify(payload, null, 2);
}

async function clearDb() {
  await Promise.all([
    db.transactions.clear(),
    db.categories.clear(),
    db.paymentMethods.clear(),
    db.incomeSources.clear(),
    db.settings.clear(),
    db.recurringTransactions.clear(),
    db.annualExpenses.clear(),
  ]);
}

beforeEach(async () => {
  await clearDb();
});

afterAll(async () => {
  await clearDb();
});

describe('버그 재현: 기존 타 앱용 파서는 PinPig 백업을 읽지 못한다', () => {
  it('parseJSON은 전체 백업 JSON에서 빈 배열을 돌려준다', () => {
    expect(parseJSON(buildBackupJson())).toEqual([]);
  });
});

describe('parsePinPigBackup', () => {
  it('전체 백업 JSON을 판별해 구조를 돌려준다', () => {
    const backup = parsePinPigBackup(buildBackupJson());
    expect(backup).not.toBeNull();
    expect(backup!.version).toBe('1.1');
    expect(backup!.data.transactions).toHaveLength(2);
    expect(backup!.data.incomeSources).toHaveLength(1);
  });

  it('v1.0 백업(incomeSources·annualExpenses 없음)도 판별된다', () => {
    const json = JSON.stringify({
      version: '1.0',
      exportedAt: NOW.toISOString(),
      data: { transactions: [makeTx()], categories: [makeCategory()], paymentMethods: [], settings: [], recurringTransactions: [] },
    });
    const backup = parsePinPigBackup(json);
    expect(backup).not.toBeNull();
    expect(backup!.data.incomeSources).toBeUndefined();
    expect(backup!.data.annualExpenses).toBeUndefined();
  });

  it('타 앱 JSON(배열·{transactions:[]})은 null → 기존 파서로 넘어간다', () => {
    expect(parsePinPigBackup(JSON.stringify([{ date: '2026-09-01', amount: 100 }]))).toBeNull();
    expect(parsePinPigBackup(JSON.stringify({ transactions: [{ date: '2026-09-01', amount: 100 }] }))).toBeNull();
    expect(isPinPigBackup({ version: '1.0', data: { transactions: 'x' } })).toBe(false);
    expect(parsePinPigBackup('not json')).toBeNull();
  });
});

describe('getBackupSummary', () => {
  it('건수와 날짜 범위를 계산한다', () => {
    const summary = getBackupSummary(parsePinPigBackup(buildBackupJson())!);
    expect(summary.transactions).toBe(2);
    expect(summary.categories).toBe(2);
    expect(summary.incomeSources).toBe(1);
    expect(summary.exportedAt?.getTime()).toBe(NOW.getTime());
    expect(summary.dateRange.oldest?.getDate()).toBe(3);
    expect(summary.dateRange.newest?.getDate()).toBe(25);
  });
});

describe('restorePinPigBackup — replace', () => {
  it('7개 테이블을 백업 내용으로 교체하고 Date 필드를 되살린다', async () => {
    // 홈화면 PWA의 초기 상태: 기본 카테고리·설정이 이미 있는 상황
    await db.categories.add(makeCategory({ id: 'cat-default-1', name: '기본' }));
    await db.settings.add(makeSettings({ monthlyBudget: 0, isOnboardingComplete: false }));
    await db.transactions.add(makeTx({ id: 'tx-old' }));

    const backup = parsePinPigBackup(buildBackupJson())!;
    const result = await restorePinPigBackup(backup, { mode: 'replace' });

    expect(result.success).toBe(true);
    expect(result.restored.transactions).toBe(2);
    expect(result.restored.categories).toBe(2);
    expect(result.restored.settings).toBe(1);
    expect(result.restored.recurringTransactions).toBe(1);
    expect(result.restored.incomeSources).toBe(1);

    // 기존 데이터는 사라지고 백업 데이터만 남는다
    expect(await db.transactions.get('tx-old')).toBeUndefined();
    expect(await db.categories.get('cat-default-1')).toBeUndefined();
    expect(await db.transactions.count()).toBe(2);

    // id·type·카테고리 참조가 그대로 보존된다 (타 앱 파서에서 유실되던 부분)
    const income = await db.transactions.get('tx-2');
    expect(income?.type).toBe('income');
    expect(income?.categoryId).toBe('cat-salary');
    expect(income?.incomeSourceId).toBe('is-cash');
    expect(income?.paymentMethodId).toBeUndefined();

    // 문자열이 된 날짜가 Date로 돌아온다
    expect(income?.date).toBeInstanceOf(Date);
    expect(income?.date.getDate()).toBe(25);
    expect(income?.createdAt).toBeInstanceOf(Date);

    const rec = await db.recurringTransactions.get('rec-1');
    expect(rec?.startDate).toBeInstanceOf(Date);
    expect(rec?.nextExecutionDate).toBeInstanceOf(Date);
    expect(rec?.endDate).toBeUndefined();
    expect('endDate' in (rec ?? {})).toBe(false);

    // 설정은 백업 값으로 바뀐다 (온보딩 완료 상태 포함)
    const settings = await db.settings.get('default');
    expect(settings?.monthlyBudget).toBe(1500000);
    expect(settings?.isOnboardingComplete).toBe(true);
    expect(settings?.updatedAt).toBeInstanceOf(Date);
  });

  it('v1.0 백업은 incomeSources·annualExpenses 테이블을 건드리지 않는다', async () => {
    await db.incomeSources.add(makeIncomeSource({ id: 'is-keep' }));
    const json = JSON.stringify({
      version: '1.0',
      exportedAt: NOW.toISOString(),
      data: { transactions: [makeTx()], categories: [makeCategory()], paymentMethods: [makePaymentMethod()], settings: [makeSettings()], recurringTransactions: [] },
    });
    const result = await restorePinPigBackup(parsePinPigBackup(json)!, { mode: 'replace' });
    expect(result.success).toBe(true);
    expect(result.restored.incomeSources).toBe(0);
    expect(await db.incomeSources.get('is-keep')).toBeDefined();
  });

  it('id 없는 레코드는 건너뛰고 나머지는 복원한다', async () => {
    const backup = parsePinPigBackup(
      buildBackupJson({ transactions: [makeTx(), { ...makeTx({ id: 'tx-2' }), id: undefined } as unknown as Transaction] })
    )!;
    const result = await restorePinPigBackup(backup, { mode: 'replace' });
    expect(result.success).toBe(true);
    expect(result.restored.transactions).toBe(1);
    expect(result.skipped).toBe(1);
  });
});

describe('restorePinPigBackup — merge', () => {
  it('같은 id는 덮어쓰고 다른 id는 유지한다', async () => {
    await db.transactions.add(makeTx({ id: 'tx-local', amount: 500 }));
    await db.transactions.add(makeTx({ id: 'tx-1', amount: 1 })); // 백업과 같은 id, 다른 금액
    await db.categories.add(makeCategory({ id: 'cat-local', name: '로컬' }));

    const backup = parsePinPigBackup(buildBackupJson())!;
    const result = await restorePinPigBackup(backup, { mode: 'merge' });

    expect(result.success).toBe(true);
    expect(await db.transactions.count()).toBe(3); // tx-local + tx-1(덮어씀) + tx-2
    expect((await db.transactions.get('tx-1'))?.amount).toBe(12000);
    expect((await db.transactions.get('tx-local'))?.amount).toBe(500);
    expect(await db.categories.get('cat-local')).toBeDefined();
    expect(await db.categories.count()).toBe(3);
  });
});
