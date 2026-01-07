// =========================================
// PinPig 타입 정의
// =========================================

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  paymentMethodId?: string;
  description: string;           // 가맹점/상호명
  memo?: string;
  date: Date;
  time: string;                  // HH:mm 형식
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTransactionInput = Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>;

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  budget?: number;
  order: number;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePaymentMethodInput = Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>;

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  id: string;
  monthlyBudget: number;
  currency: string;
  currencySymbol: string;
  startDayOfMonth: number;
  payday: number;                    // 급여일 (1-31)
  isOnboardingComplete: boolean;     // 온보딩 완료 여부
  theme: ThemeMode;
  updatedAt: Date;
}

export const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'updatedAt'> = {
  monthlyBudget: 0,
  currency: 'KRW',
  currencySymbol: '원',
  startDayOfMonth: 1,
  payday: 25,
  isOnboardingComplete: false,
  theme: 'system',
};

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthSummary {
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
}

// Default Categories
export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: '식비', icon: '🍚', color: '#FF6B6B', type: 'expense', order: 0, isDefault: true },
  { name: '교통', icon: '🚇', color: '#4ECDC4', type: 'expense', order: 1, isDefault: true },
  { name: '쇼핑', icon: '🛍️', color: '#45B7D1', type: 'expense', order: 2, isDefault: true },
  { name: '문화/여가', icon: '🎬', color: '#96CEB4', type: 'expense', order: 3, isDefault: true },
  { name: '의료/건강', icon: '💊', color: '#FFEAA7', type: 'expense', order: 4, isDefault: true },
  { name: '주거/통신', icon: '🏠', color: '#DDA0DD', type: 'expense', order: 5, isDefault: true },
  { name: '기타', icon: '📦', color: '#B8B8B8', type: 'expense', order: 6, isDefault: true },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: '급여', icon: '💰', color: '#4A7C59', type: 'income', order: 0, isDefault: true },
  { name: '용돈', icon: '🎁', color: '#FDA7DF', type: 'income', order: 1, isDefault: true },
  { name: '기타수입', icon: '💵', color: '#74B9FF', type: 'income', order: 2, isDefault: true },
];

export const DEFAULT_PAYMENT_METHODS: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: '현금', icon: '💵', color: '#4CAF50', order: 0, isDefault: true },
  { name: '카드', icon: '💳', color: '#2196F3', order: 1, isDefault: true },
  { name: '계좌이체', icon: '🏦', color: '#9C27B0', order: 2, isDefault: true },
];

// =========================================
// Report & Analytics Types
// =========================================

export interface MonthlyTrend {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
}

export interface BudgetStatus {
  monthlyBudget: number;
  totalExpense: number;
  remaining: number;
  remainingDays: number;
  dailyRecommended: number;
  percentUsed: number;
  isOverBudget: boolean;
}

export interface TransactionExportRow {
  date: string;           // YYYY-MM-DD
  time: string;           // HH:mm
  type: string;           // '수입' | '지출'
  category: string;       // Category name
  description: string;
  amount: number;
  memo: string;
}
