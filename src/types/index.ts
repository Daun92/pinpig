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
  budget?: number;           // 월 예산 한도 (선택)
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

// =========================================
// History Page Grouping Types
// =========================================

export interface DateGroup {
  label: string;
  date: Date;
  transactions: Transaction[];
  dailyTotal: number;
}

export interface MonthGroup {
  year: number;
  month: number;
  label: string;              // "2025년 1월" 또는 "1월" (현재년도)
  dateGroups: DateGroup[];
  summary: {
    income: number;
    expense: number;
    net: number;
    transactionCount: number;
  };
}

export interface PaymentMethodSummary {
  paymentMethodId: string;
  paymentMethodName: string;
  paymentMethodIcon: string;
  paymentMethodColor: string;
  amount: number;
  percentage: number;
  count: number;
  budget?: number;            // 설정된 예산 한도
  budgetPercent?: number;     // 예산 대비 사용 비율
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

// =========================================
// Recurring Transaction Types (반복 거래)
// =========================================

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  paymentMethodId?: string;
  description: string;                // 거래 설명 (예: "넷플릭스", "월급")
  memo?: string;

  // Recurrence settings
  frequency: RecurrenceFrequency;     // 반복 주기
  dayOfMonth?: number;                // monthly일 때 매월 몇 일 (1-31)
  dayOfWeek?: number;                 // weekly일 때 무슨 요일 (0-6, 일요일=0)
  startDate: Date;                    // 시작일
  endDate?: Date;                     // 종료일 (없으면 무기한)
  isActive: boolean;                  // 활성화 여부

  // Tracking
  lastExecutedDate?: Date;            // 마지막으로 실행된 날짜
  nextExecutionDate: Date;            // 다음 실행 예정일

  createdAt: Date;
  updatedAt: Date;
}

export type CreateRecurringTransactionInput = Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt' | 'lastExecutedDate'>;

// =========================================
// Projected Transaction Types (예상 거래)
// =========================================

export interface ProjectedTransaction {
  id: string;                         // 'recurring-{recurringId}-{date}' 형태
  recurringId: string;                // 원본 반복 거래 ID
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  paymentMethodId?: string;
  description: string;
  scheduledDate: Date;                // 예정일
  isProjected: true;                  // 항상 true (실제 거래와 구분)
}

// =========================================
// Budget Structure Types (예산 구조)
// =========================================

export interface MonthlyBudgetStructure {
  totalBudget: number;                // 총 예산
  fixedExpenses: number;              // 고정 지출 (반복 거래 기반)
  expectedIncome: number;             // 예상 수입 (반복 거래 기반)
  variableBudget: number;             // 가변 예산 (totalBudget - fixedExpenses)
  projectedBalance: number;           // 예상 잔액

  // By category
  categoryBudgets: CategoryBudgetSummary[];
}

export interface CategoryBudgetSummary {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;               // 설정된 예산
  currentSpent: number;               // 현재 지출
  projectedSpent: number;             // 예상 지출 (남은 반복 거래 포함)
  remainingBudget: number;            // 남은 예산
  percentUsed: number;                // 사용 비율
}
