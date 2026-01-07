import Dexie, { type Table } from 'dexie';
import type {
  Transaction,
  Category,
  PaymentMethod,
  Settings,
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

  constructor() {
    super('PinPigDB');

    this.version(1).stores({
      transactions: 'id, type, categoryId, paymentMethodId, date, createdAt',
      categories: 'id, type, name, order',
      paymentMethods: 'id, name, order',
      settings: 'id',
    });
  }
}

export const db = new PinPigDatabase();

export function generateId(): string {
  return crypto.randomUUID();
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
