import Dexie, { type Table } from 'dexie';
import type {
  Transaction,
  Category,
  PaymentMethod,
  IncomeSource,
  Settings,
  AnnualExpensePattern,
  RecurringTransaction,
} from '@/types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_INCOME_SOURCES,
  DEFAULT_SETTINGS,
} from '@/types';

class PinPigDatabase extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  paymentMethods!: Table<PaymentMethod>;
  incomeSources!: Table<IncomeSource>;
  settings!: Table<Settings>;
  annualExpenses!: Table<AnnualExpensePattern>;
  recurringTransactions!: Table<RecurringTransaction>;

  constructor() {
    super('PinPigDB');

    // Schema v1 with compound indexes for efficient queries
    this.version(1).stores({
      transactions: 'id, type, categoryId, paymentMethodId, date, [date+type], [categoryId+date], createdAt',
      categories: 'id, type, name, order, [type+order]',
      paymentMethods: 'id, name, order',
      settings: 'id',
    });

    // Schema v2: Add annual expenses table
    this.version(2).stores({
      transactions: 'id, type, categoryId, paymentMethodId, date, [date+type], [categoryId+date], createdAt',
      categories: 'id, type, name, order, [type+order]',
      paymentMethods: 'id, name, order',
      settings: 'id',
      annualExpenses: 'id, categoryId, month, year, isEnabled',
    });

    // Schema v3: Add recurring transactions table
    this.version(3).stores({
      transactions: 'id, type, categoryId, paymentMethodId, date, [date+type], [categoryId+date], createdAt',
      categories: 'id, type, name, order, [type+order]',
      paymentMethods: 'id, name, order',
      settings: 'id',
      annualExpenses: 'id, categoryId, month, year, isEnabled',
      recurringTransactions: 'id, type, categoryId, frequency, isActive, nextExecutionDate',
    });

    // Schema v4: Add budget field to paymentMethods (no schema change needed, just version bump)
    this.version(4).stores({
      transactions: 'id, type, categoryId, paymentMethodId, date, [date+type], [categoryId+date], createdAt',
      categories: 'id, type, name, order, [type+order]',
      paymentMethods: 'id, name, order',
      settings: 'id',
      annualExpenses: 'id, categoryId, month, year, isEnabled',
      recurringTransactions: 'id, type, categoryId, frequency, isActive, nextExecutionDate',
    });

    // Schema v5: Add incomeSources table (수입 수단)
    this.version(5).stores({
      transactions: 'id, type, categoryId, paymentMethodId, incomeSourceId, date, [date+type], [categoryId+date], createdAt',
      categories: 'id, type, name, order, [type+order]',
      paymentMethods: 'id, name, order',
      incomeSources: 'id, name, order',
      settings: 'id',
      annualExpenses: 'id, categoryId, month, year, isEnabled',
      recurringTransactions: 'id, type, categoryId, frequency, isActive, nextExecutionDate',
    });

    // Schema v6: Migrate incomeSources defaults (급여/용돈/부업/기타 → 현금/카드/계좌이체)
    this.version(6).stores({
      transactions: 'id, type, categoryId, paymentMethodId, incomeSourceId, date, [date+type], [categoryId+date], createdAt',
      categories: 'id, type, name, order, [type+order]',
      paymentMethods: 'id, name, order',
      incomeSources: 'id, name, order',
      settings: 'id',
      annualExpenses: 'id, categoryId, month, year, isEnabled',
      recurringTransactions: 'id, type, categoryId, frequency, isActive, nextExecutionDate',
    }).upgrade(async (tx) => {
      // 기존 기본 수입수단 매핑 (급여/용돈/부업/기타 → 현금/카드/계좌이체)
      const oldToNew: Record<string, { name: string; icon: string; color: string }> = {
        '급여': { name: '현금', icon: 'Banknote', color: '#4CAF50' },
        '용돈': { name: '카드', icon: 'CreditCard', color: '#2196F3' },
        '부업': { name: '계좌이체', icon: 'Building', color: '#9C27B0' },
      };

      const incomeSources = await tx.table('incomeSources').toArray();

      for (const source of incomeSources) {
        const mapping = oldToNew[source.name];
        if (mapping) {
          await tx.table('incomeSources').update(source.id, {
            name: mapping.name,
            icon: mapping.icon,
            color: mapping.color,
            updatedAt: new Date(),
          });
        } else if (source.name === '기타') {
          // '기타' 수입수단 삭제
          await tx.table('incomeSources').delete(source.id);
        }
      }
    });

    // Schema v7: Merge description into memo (description 필드 제거, memo로 통합)
    this.version(7).stores({
      transactions: 'id, type, categoryId, paymentMethodId, incomeSourceId, date, [date+type], [categoryId+date], createdAt',
      categories: 'id, type, name, order, [type+order]',
      paymentMethods: 'id, name, order',
      incomeSources: 'id, name, order',
      settings: 'id',
      annualExpenses: 'id, categoryId, month, year, isEnabled',
      recurringTransactions: 'id, type, categoryId, frequency, isActive, nextExecutionDate',
    }).upgrade(async (tx) => {
      // 모든 트랜잭션의 description을 memo로 병합
      const transactions = await tx.table('transactions').toArray();

      for (const transaction of transactions) {
        const description = transaction.description || '';
        const memo = transaction.memo || '';

        // description과 memo 병합: 둘 다 있으면 합치고, 하나만 있으면 그것 사용
        let mergedMemo = '';
        if (description && memo) {
          // 둘 다 있으면 합침 (중복 아닌 경우만)
          if (description === memo) {
            mergedMemo = memo;
          } else {
            mergedMemo = `${description} ${memo}`.trim();
          }
        } else {
          mergedMemo = description || memo;
        }

        // description 제거, memo 업데이트
        await tx.table('transactions').update(transaction.id, {
          memo: mergedMemo,
          description: undefined, // 필드 제거
          updatedAt: new Date(),
        });
      }

      // recurringTransactions에서도 description을 memo로 병합
      const recurringTxs = await tx.table('recurringTransactions').toArray();

      for (const recurring of recurringTxs) {
        const description = recurring.description || '';
        const memo = recurring.memo || '';

        let mergedMemo = '';
        if (description && memo) {
          if (description === memo) {
            mergedMemo = memo;
          } else {
            mergedMemo = `${description} ${memo}`.trim();
          }
        } else {
          mergedMemo = description || memo;
        }

        await tx.table('recurringTransactions').update(recurring.id, {
          memo: mergedMemo,
          description: undefined,
          updatedAt: new Date(),
        });
      }
    });
  }
}

export const db = new PinPigDatabase();

export function generateId(): string {
  // crypto.randomUUID 지원 여부 확인 (구형 브라우저/HTTP 환경 대응)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // 폴백: 랜덤 UUID v4 생성
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function initializeDatabase(): Promise<void> {
  try {
    await initializeCategories();
    await initializePaymentMethods();
    await initializeIncomeSources();
    await initializeSettings();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

async function initializeCategories(): Promise<void> {
  const count = await db.categories.count();
  if (count > 0) return;

  const now = new Date();
  const categories: Category[] = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...DEFAULT_INCOME_CATEGORIES,
  ].map((cat) => ({
    ...cat,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }));

  await db.categories.bulkAdd(categories);
}

async function initializePaymentMethods(): Promise<void> {
  const count = await db.paymentMethods.count();
  if (count > 0) return;

  const now = new Date();
  const methods: PaymentMethod[] = DEFAULT_PAYMENT_METHODS.map((method) => ({
    ...method,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }));

  await db.paymentMethods.bulkAdd(methods);
}

async function initializeIncomeSources(): Promise<void> {
  const count = await db.incomeSources.count();
  if (count > 0) return;

  const now = new Date();
  const sources: IncomeSource[] = DEFAULT_INCOME_SOURCES.map((source) => ({
    ...source,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }));

  await db.incomeSources.bulkAdd(sources);
}

async function initializeSettings(): Promise<void> {
  const count = await db.settings.count();
  if (count > 0) return;

  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    id: 'default',
    updatedAt: new Date(),
  };

  await db.settings.add(settings);
}

// Query helpers
export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  if (type) {
    return db.categories.where('type').equals(type).sortBy('order');
  }
  return db.categories.orderBy('order').toArray();
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return db.paymentMethods.orderBy('order').toArray();
}

export async function getIncomeSources(): Promise<IncomeSource[]> {
  return db.incomeSources.orderBy('order').toArray();
}

export async function getSettings(): Promise<Settings | undefined> {
  return db.settings.get('default');
}

export async function updateSettings(updates: Partial<Settings>): Promise<void> {
  await db.settings.update('default', {
    ...updates,
    updatedAt: new Date(),
  });
}

/**
 * Reset database (development only)
 * Clears all data and re-initializes with defaults
 */
export async function resetDatabase(): Promise<void> {
  await db.transactions.clear();
  await db.categories.clear();
  await db.paymentMethods.clear();
  await db.incomeSources.clear();
  await db.settings.clear();
  await initializeDatabase();
}
