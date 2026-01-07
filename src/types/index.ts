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

// Default Categories - icon values are Lucide icon names
export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: '식비', icon: 'Utensils', color: '#FF6B6B', type: 'expense', order: 0, isDefault: true },
  { name: '교통', icon: 'Car', color: '#4ECDC4', type: 'expense', order: 1, isDefault: true },
  { name: '쇼핑', icon: 'ShoppingBag', color: '#45B7D1', type: 'expense', order: 2, isDefault: true },
  { name: '문화/여가', icon: 'Film', color: '#96CEB4', type: 'expense', order: 3, isDefault: true },
  { name: '의료/건강', icon: 'Heart', color: '#FFEAA7', type: 'expense', order: 4, isDefault: true },
  { name: '주거/통신', icon: 'Home', color: '#DDA0DD', type: 'expense', order: 5, isDefault: true },
  { name: '기타', icon: 'MoreHorizontal', color: '#B8B8B8', type: 'expense', order: 6, isDefault: true },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: '급여', icon: 'Wallet', color: '#4A7C59', type: 'income', order: 0, isDefault: true },
  { name: '용돈', icon: 'Gift', color: '#FDA7DF', type: 'income', order: 1, isDefault: true },
  { name: '기타수입', icon: 'TrendingUp', color: '#74B9FF', type: 'income', order: 2, isDefault: true },
];

export const DEFAULT_PAYMENT_METHODS: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: '현금', icon: 'Banknote', color: '#4CAF50', order: 0, isDefault: true },
  { name: '카드', icon: 'CreditCard', color: '#2196F3', order: 1, isDefault: true },
  { name: '계좌이체', icon: 'Building', color: '#9C27B0', order: 2, isDefault: true },
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

export interface AnnualTrend {
  year: number;
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
}

export interface CategoryTrend {
  year: number;
  month: number;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
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

// =========================================
// Budget Wizard Types
// =========================================

export interface BudgetRecommendation {
  avgExpense3Months: number;           // 최근 3개월 평균 지출
  maxExpenseMonth: number;             // 가장 많이 쓴 달 금액
  minExpenseMonth: number;             // 가장 적게 쓴 달 금액
  totalExpense3Months: number;         // 3개월 총 지출
  dataMonths: number;                  // 분석에 사용된 월 수
  categoryBreakdown: CategoryBudgetRecommendation[];
}

export interface CategoryBudgetRecommendation {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  avgAmount: number;                   // 3개월 평균
  percentage: number;                  // 전체 대비 비율
  recommendedBudget: number;           // 추천 예산
}

// =========================================
// Annual Expense Pattern Types
// =========================================

export interface AnnualExpensePattern {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  description: string;                 // "자동차보험", "재산세" 등
  month: number;                       // 발생 월 (1-12)
  day: number;                         // 발생 일 (1-31)
  amount: number;                      // 작년 금액
  year: number;                        // 발생 연도
  isEnabled: boolean;                  // 알림 활성화 여부
  notifyDaysBefore: number;            // 며칠 전 알림 (기본 14일)
  lastNotifiedYear?: number;           // 마지막 알림 연도
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAnnualExpenseInput = Omit<AnnualExpensePattern, 'id' | 'createdAt' | 'updatedAt'>;

// =========================================
// Monthly Review Types
// =========================================

export interface MonthlyReview {
  year: number;
  month: number;
  totalExpense: number;
  totalIncome: number;
  budgetUsedPercent: number;
  insights: ReviewInsight[];
  categoryComparison: CategoryComparison[];
}

export interface ReviewInsight {
  type: 'over_budget' | 'under_budget' | 'increase' | 'decrease' | 'trend';
  categoryName?: string;
  message: string;
  amount?: number;
  percentChange?: number;
}

export interface CategoryComparison {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  currentAmount: number;
  previousAmount: number;
  budgetAmount?: number;
  percentChange: number;
  isOverBudget: boolean;
}
