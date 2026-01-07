import Dexie, { type Table } from 'dexie';
import type {
  Transaction,
  Category,
  PaymentMethod,
  Settings,
  AnnualExpensePattern,
  RecurringTransaction,
} from '@/types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_SETTINGS,
} from '@/types';

class PinPigDatabase extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  paymentMethods!: Table<PaymentMethod>;
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
  await db.settings.clear();
  await initializeDatabase();
}
