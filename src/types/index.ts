// =========================================
// PinPig 타입 정의
// =========================================

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  paymentMethodId?: string;      // 지출 시 결제수단
  incomeSourceId?: string;       // 수입 시 수입수단
  memo?: string;                 // 메모 (태그 제외된 순수 텍스트)
  tags?: string[];               // 태그 배열 (예: ["회식", "팀점심"])
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

// =========================================
// Insight Widget Types (홈 인사이트 카드)
// =========================================

export type InsightWidgetType =
  | 'caution'       // 주의 포인트 (카테고리 예산 70%+)
  | 'room'          // 여유 영역 (카테고리 예산 <50%)
  | 'compare'       // 전월 대비 변화
  | 'interest'      // 이번 달 관심 (TOP 카테고리)
  | 'upcoming';     // 예정 알림

export const INSIGHT_WIDGET_CONFIG: Record<InsightWidgetType, {
  label: string;
  description: string;
  requiresCategoryBudget: boolean;
  requiresLastMonthData: boolean;
  requiresUpcoming: boolean;
}> = {
  caution: {
    label: '주의 포인트',
    description: '예산 70% 이상 카테고리',
    requiresCategoryBudget: true,
    requiresLastMonthData: false,
    requiresUpcoming: false,
  },
  room: {
    label: '여유 영역',
    description: '예산 50% 미만 카테고리',
    requiresCategoryBudget: true,
    requiresLastMonthData: false,
    requiresUpcoming: false,
  },
  compare: {
    label: '전월 대비',
    description: '지난달과 비교',
    requiresCategoryBudget: false,
    requiresLastMonthData: true,
    requiresUpcoming: false,
  },
  interest: {
    label: '이번 달 관심',
    description: '가장 많이 쓴 카테고리',
    requiresCategoryBudget: false,
    requiresLastMonthData: false,
    requiresUpcoming: false,
  },
  upcoming: {
    label: '예정 알림',
    description: '이번 달 예정된 거래',
    requiresCategoryBudget: false,
    requiresLastMonthData: false,
    requiresUpcoming: true,
  },
};

export const DEFAULT_INSIGHT_WIDGETS: InsightWidgetType[] = ['caution', 'room', 'interest'];

// 카테고리별 알림 설정
export interface CategoryAlertSetting {
  enabled: boolean;
  thresholds: number[];              // 알림 임계값 (예: [70, 100])
  lastAlertedThreshold?: number;     // 마지막 알림 임계값 (중복 방지)
  lastAlertedMonth?: string;         // 마지막 알림 월 (YYYY-MM)
}

// 반복 거래별 알림 설정
export interface RecurringAlertSetting {
  enabled: boolean;
  daysBefore?: number;               // 개별 설정 (없으면 전역 설정 사용)
  lastAlertedDate?: string;          // 마지막 알림 날짜 (YYYY-MM-DD, 중복 방지)
}

// 결제수단별 알림 설정
export interface PaymentMethodAlertSetting {
  enabled: boolean;
  thresholds: number[];              // 알림 임계값 (예: [70, 100])
  lastAlertedThreshold?: number;     // 마지막 알림 임계값 (중복 방지)
  lastAlertedMonth?: string;         // 마지막 알림 월 (YYYY-MM)
}

export interface Settings {
  id: string;
  monthlyBudget: number;
  currency: string;
  currencySymbol: string;
  startDayOfMonth: number;
  payday: number;                    // 급여일 (1-31)
  isOnboardingComplete: boolean;     // 온보딩 완료 여부
  theme: ThemeMode;
  // Coach mark (투어) 완료 플래그
  hasSeenHomeTour: boolean;
  hasSeenAddTour: boolean;
  hasSeenStatsTour: boolean;
  hasSeenSettingsTour: boolean;
  hasSeenHistoryTour: boolean;
  // 앱 내 알림 마스터 토글
  notificationEnabled: boolean;      // 앱 내 알림 전체 활성화
  // 예산 알림 설정
  budgetAlertEnabled: boolean;       // 예산 알림 활성화
  budgetAlertThresholds: number[];   // 알림 임계값 [50, 80, 100]
  categoryAlertEnabled: boolean;     // 카테고리 알림 마스터 토글
  categoryAlertSettings: Record<string, CategoryAlertSetting>;  // 카테고리별 개별 설정
  lastAlertedThreshold?: number;     // 마지막 알림 임계값 (중복 방지)
  lastAlertedMonth?: string;         // 마지막 알림 월 (YYYY-MM 형식, 월 1회)
  // 반복 거래 알림 설정
  recurringAlertEnabled: boolean;    // 반복 거래 알림 마스터 토글
  recurringAlertDaysBefore: number;  // 기본 며칠 전 알림 (0=당일, 1, 3, 7 등)
  recurringAlertSettings: Record<string, RecurringAlertSetting>;  // 개별 반복거래 설정
  // 결제수단 알림 설정
  paymentMethodAlertEnabled: boolean;  // 결제수단 알림 마스터 토글
  paymentMethodAlertSettings: Record<string, PaymentMethodAlertSetting>;  // 결제수단별 개별 설정
  // 홈 인사이트 설정
  insightWidgets: InsightWidgetType[];  // 최대 3개 선택
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
  hasSeenHomeTour: false,
  hasSeenAddTour: false,
  hasSeenStatsTour: false,
  hasSeenSettingsTour: false,
  hasSeenHistoryTour: false,
  // 앱 내 알림 기본값
  notificationEnabled: true,         // 앱 내 알림 기본 활성화
  // 예산 알림 기본값
  budgetAlertEnabled: true,
  budgetAlertThresholds: [50, 80, 100],
  categoryAlertEnabled: true,
  categoryAlertSettings: {},         // 카테고리별 개별 설정 (빈 객체 = 전체 기본값 사용)
  // 반복 거래 알림 기본값
  recurringAlertEnabled: true,
  recurringAlertDaysBefore: 1,       // 기본 1일 전 알림
  recurringAlertSettings: {},        // 개별 반복거래 설정 (빈 객체 = 전체 기본값 사용)
  // 결제수단 알림 기본값
  paymentMethodAlertEnabled: true,
  paymentMethodAlertSettings: {},    // 결제수단별 개별 설정 (빈 객체 = 전체 기본값 사용)
  // 홈 인사이트 기본값
  insightWidgets: DEFAULT_INSIGHT_WIDGETS,
};

// 카테고리 알림 기본 임계값
export const DEFAULT_CATEGORY_ALERT_THRESHOLDS = [70, 100];

// 결제수단 알림 기본 임계값
export const DEFAULT_PAYMENT_METHOD_ALERT_THRESHOLDS = [70, 100];

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
// Income Source Types (수입 수단)
// =========================================

export interface IncomeSource {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateIncomeSourceInput = Omit<IncomeSource, 'id' | 'createdAt' | 'updatedAt'>;

export const DEFAULT_INCOME_SOURCES: Omit<IncomeSource, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: '현금', icon: 'Banknote', color: '#4CAF50', order: 0, isDefault: true },
  { name: '카드', icon: 'CreditCard', color: '#2196F3', order: 1 },
  { name: '계좌이체', icon: 'Building', color: '#9C27B0', order: 2 },
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

export interface PaymentMethodTrend {
  year: number;
  month: number;
  paymentMethodId: string;
  paymentMethodName: string;
  paymentMethodIcon: string;
  paymentMethodColor: string;
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

// 반복 거래 실행 모드
// - 'on_date': 해당 날짜가 되면 실제 거래로 자동 입력
// - 'start_of_month': 월 초에 해당 월의 모든 반복 거래를 미리 입력
export type RecurringExecutionMode = 'on_date' | 'start_of_month';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  paymentMethodId?: string;           // 지출 시 결제수단
  incomeSourceId?: string;            // 수입 시 수입수단
  memo?: string;                      // 메모 (태그 제외된 순수 텍스트)
  tags?: string[];                    // 태그 배열 (예: ["고정비", "구독"])

  // Recurrence settings
  frequency: RecurrenceFrequency;     // 반복 주기
  dayOfMonth?: number;                // monthly일 때 매월 몇 일 (1-31)
  dayOfWeek?: number;                 // weekly일 때 무슨 요일 (0-6, 일요일=0)
  startDate: Date;                    // 시작일
  endDate?: Date;                     // 종료일 (없으면 무기한)
  isActive: boolean;                  // 활성화 여부
  executionMode?: RecurringExecutionMode;  // 실행 모드 (기본값: 'on_date')

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
  memo?: string;
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

// =========================================
// Insight Detail Types (인사이트 상세 뷰)
// =========================================

// URL 파라미터용 인사이트 타입
export type InsightType = 'caution' | 'room' | 'interest' | 'compare' | 'upcoming';

// URL 파라미터 인터페이스
export interface InsightParams {
  insight?: InsightType;
  categoryId?: string;
  month?: string;       // 'YYYY-MM' or 'current'
}

// 1. Caution (주의 포인트) 상세 데이터
export interface CautionDetailData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;
  currentSpent: number;
  percentUsed: number;
  remaining: number;
  remainingDays: number;
  dailyRecommended: number;
  topTransactionIds: string[];  // 금액 상위 3건 ID (하이라이트용)
  insightMessage: string;
}

// 2. Room (여유 영역) 상세 데이터
export interface RoomDetailData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;
  currentSpent: number;
  percentUsed: number;
  remaining: number;
  lastMonthSamePoint?: number;  // 지난달 같은 일자까지의 지출
  insightMessage: string;
}

// 3. Interest (관심 카테고리) 상세 데이터
export interface InterestDetailData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalCount: number;
  totalAmount: number;
  averageAmount: number;
  peakDayOfWeek?: string;   // 가장 많이 쓴 요일 (월~일)
  peakTimeRange?: string;   // 가장 많이 쓴 시간대 (아침/점심/저녁/밤)
  insightMessage: string;
}

// 4. Compare (전월 대비) 상세 데이터
export interface CompareDetailData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  currentMonth: {
    year: number;
    month: number;
    amount: number;
    count: number;
  };
  lastMonth: {
    year: number;
    month: number;
    amount: number;
    count: number;
  };
  difference: number;
  percentChange: number;
  isIncrease: boolean;
  insightMessage: string;
}

// 5. Upcoming (예정 거래) 상세 데이터
export interface UpcomingDetailItem {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  memo?: string;
  scheduledDate: Date;
  daysUntil: number;
}

export interface UpcomingDetailData {
  totalCount: number;
  totalExpense: number;
  totalIncome: number;
  netImpact: number;
  items: UpcomingDetailItem[];
  nextItem?: UpcomingDetailItem;
  insightMessage: string;
}

// 통합 인사이트 상세 데이터 유니온 타입
export type InsightDetailData =
  | { type: 'caution'; data: CautionDetailData }
  | { type: 'room'; data: RoomDetailData }
  | { type: 'interest'; data: InterestDetailData }
  | { type: 'compare'; data: CompareDetailData }
  | { type: 'upcoming'; data: UpcomingDetailData };
