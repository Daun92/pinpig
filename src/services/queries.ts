import { db, generateId } from './database';
import { endOfMonth, subMonths, startOfYear, endOfYear, format, addDays, addWeeks, addMonths, addYears, isBefore, isAfter, isSameDay, differenceInDays } from 'date-fns';
import type {
  Transaction,
  MonthSummary,
  CategorySummary,
  PaymentMethodSummary,
  MonthlyTrend,
  AnnualTrend,
  CategoryTrend,
  PaymentMethodTrend,
  TransactionExportRow,
  BudgetRecommendation,
  CategoryBudgetRecommendation,
  AnnualExpensePattern,
  CreateAnnualExpenseInput,
  MonthlyReview,
  ReviewInsight,
  CategoryComparison,
  RecurringTransaction,
  CreateRecurringTransactionInput,
  ProjectedTransaction,
  MonthlyBudgetStructure,
  CategoryBudgetSummary,
  RecurrenceFrequency,
  InsightType,
  CautionDetailData,
  RoomDetailData,
  InterestDetailData,
  CompareDetailData,
  UpcomingDetailData,
  UpcomingDetailItem,
  InsightDetailData,
} from '@/types';

/**
 * Get transactions for a specific month
 */
export async function getTransactionsByMonth(
  year: number,
  month: number
): Promise<Transaction[]> {
  const start = new Date(year, month - 1, 1);
  const end = endOfMonth(start);

  return db.transactions
    .where('date')
    .between(start, end, true, true)
    .reverse()
    .sortBy('date');
}

/**
 * Get recent transactions with limit
 */
export async function getRecentTransactions(
  limit: number = 10
): Promise<Transaction[]> {
  return db.transactions
    .orderBy('createdAt')
    .reverse()
    .limit(limit)
    .toArray();
}

/**
 * Calculate monthly summary (income, expense, balance)
 */
export async function getMonthlySummary(
  year: number,
  month: number
): Promise<MonthSummary> {
  const transactions = await getTransactionsByMonth(year, month);

  const income = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return {
    income,
    expense,
    balance: income - expense,
    transactionCount: transactions.length,
  };
}

/**
 * Get category breakdown for a month
 */
export async function getCategoryBreakdown(
  year: number,
  month: number,
  type: 'income' | 'expense' = 'expense'
): Promise<CategorySummary[]> {
  const transactions = await getTransactionsByMonth(year, month);
  const categories = await db.categories.where('type').equals(type).toArray();

  // Filter by type and group by category
  const typeTransactions = transactions.filter((tx) => tx.type === type);
  const totalAmount = typeTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const categoryMap = new Map<string, { amount: number; count: number }>();

  for (const tx of typeTransactions) {
    const current = categoryMap.get(tx.categoryId) || { amount: 0, count: 0 };
    categoryMap.set(tx.categoryId, {
      amount: current.amount + tx.amount,
      count: current.count + 1,
    });
  }

  return categories
    .map((cat) => {
      const data = categoryMap.get(cat.id) || { amount: 0, count: 0 };
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        count: data.count,
      };
    })
    .filter((summary) => summary.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Get payment method breakdown for a month
 */
export async function getPaymentMethodBreakdown(
  year: number,
  month: number,
  type: 'income' | 'expense' = 'expense'
): Promise<PaymentMethodSummary[]> {
  const transactions = await getTransactionsByMonth(year, month);
  const paymentMethods = await db.paymentMethods.orderBy('order').toArray();

  // Filter by type and group by payment method
  const typeTransactions = transactions.filter((tx) => tx.type === type);
  const totalAmount = typeTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const methodMap = new Map<string, { amount: number; count: number }>();

  for (const tx of typeTransactions) {
    const pmId = tx.paymentMethodId || 'none';
    const current = methodMap.get(pmId) || { amount: 0, count: 0 };
    methodMap.set(pmId, {
      amount: current.amount + tx.amount,
      count: current.count + 1,
    });
  }

  return paymentMethods
    .map((pm) => {
      const data = methodMap.get(pm.id) || { amount: 0, count: 0 };
      const percentage = totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0;
      const budgetPercent = pm.budget && pm.budget > 0
        ? Math.round((data.amount / pm.budget) * 100)
        : undefined;

      return {
        paymentMethodId: pm.id,
        paymentMethodName: pm.name,
        paymentMethodIcon: pm.icon,
        paymentMethodColor: pm.color,
        amount: data.amount,
        percentage,
        count: data.count,
        budget: pm.budget,
        budgetPercent,
      };
    })
    .filter((summary) => summary.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Get monthly trend data for reports
 */
export async function getMonthlyTrend(months: number = 6): Promise<MonthlyTrend[]> {
  const trends: MonthlyTrend[] = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const targetDate = subMonths(now, i);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;

    const summary = await getMonthlySummary(year, month);

    trends.push({
      year,
      month,
      ...summary,
    });
  }

  return trends.reverse(); // Oldest first
}

/**
 * Get annual trend data for reports (yearly aggregation)
 */
export async function getAnnualTrend(years: number = 3): Promise<AnnualTrend[]> {
  const trends: AnnualTrend[] = [];
  const currentYear = new Date().getFullYear();

  for (let i = 0; i < years; i++) {
    const year = currentYear - i;
    const transactions = await getTransactionsByYear(year);

    const income = transactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expense = transactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    trends.push({
      year,
      income,
      expense,
      balance: income - expense,
      transactionCount: transactions.length,
    });
  }

  return trends.reverse(); // Oldest first
}

/**
 * Get category-specific trend data for reports
 */
export async function getCategoryTrend(
  categoryId: string,
  months: number = 6
): Promise<CategoryTrend[]> {
  const trends: CategoryTrend[] = [];
  const now = new Date();

  // Get category info
  const category = await db.categories.get(categoryId);
  if (!category) {
    return [];
  }

  for (let i = 0; i < months; i++) {
    const targetDate = subMonths(now, i);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;

    const transactions = await getTransactionsByCategory(year, month, categoryId);
    const amount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    trends.push({
      year,
      month,
      categoryId,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
      amount,
      transactionCount: transactions.length,
    });
  }

  return trends.reverse(); // Oldest first
}

/**
 * Get yearly summary (income, expense, balance for entire year)
 */
export async function getYearlySummary(year: number): Promise<MonthSummary> {
  const transactions = await getTransactionsByYear(year);

  const income = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return {
    income,
    expense,
    balance: income - expense,
    transactionCount: transactions.length,
  };
}

/**
 * Get category breakdown for entire year
 */
export async function getYearlyCategoryBreakdown(
  year: number,
  type: 'income' | 'expense' = 'expense'
): Promise<CategorySummary[]> {
  const transactions = await getTransactionsByYear(year);
  const categories = await db.categories.where('type').equals(type).toArray();

  const typeTransactions = transactions.filter((tx) => tx.type === type);
  const totalAmount = typeTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const categoryMap = new Map<string, { amount: number; count: number }>();

  for (const tx of typeTransactions) {
    const current = categoryMap.get(tx.categoryId) || { amount: 0, count: 0 };
    categoryMap.set(tx.categoryId, {
      amount: current.amount + tx.amount,
      count: current.count + 1,
    });
  }

  return categories
    .map((cat) => {
      const data = categoryMap.get(cat.id) || { amount: 0, count: 0 };
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        count: data.count,
      };
    })
    .filter((summary) => summary.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Get payment method breakdown for entire year
 */
export async function getYearlyPaymentMethodBreakdown(
  year: number,
  type: 'income' | 'expense' = 'expense'
): Promise<PaymentMethodSummary[]> {
  const transactions = await getTransactionsByYear(year);
  const paymentMethods = await db.paymentMethods.orderBy('order').toArray();

  const typeTransactions = transactions.filter((tx) => tx.type === type);
  const totalAmount = typeTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const methodMap = new Map<string, { amount: number; count: number }>();

  for (const tx of typeTransactions) {
    const pmId = tx.paymentMethodId || 'none';
    const current = methodMap.get(pmId) || { amount: 0, count: 0 };
    methodMap.set(pmId, {
      amount: current.amount + tx.amount,
      count: current.count + 1,
    });
  }

  return paymentMethods
    .map((pm) => {
      const data = methodMap.get(pm.id) || { amount: 0, count: 0 };
      const percentage = totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0;

      return {
        paymentMethodId: pm.id,
        paymentMethodName: pm.name,
        paymentMethodIcon: pm.icon,
        paymentMethodColor: pm.color,
        amount: data.amount,
        percentage,
        count: data.count,
        budget: pm.budget,
        budgetPercent: undefined,
      };
    })
    .filter((summary) => summary.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Get payment method trend data for reports (6 months)
 */
export async function getPaymentMethodTrend(
  paymentMethodId: string,
  months: number = 6,
  type: 'expense' | 'income' = 'expense'
): Promise<PaymentMethodTrend[]> {
  const trends: PaymentMethodTrend[] = [];
  const now = new Date();

  const paymentMethod = await db.paymentMethods.get(paymentMethodId);
  if (!paymentMethod) {
    return [];
  }

  for (let i = 0; i < months; i++) {
    const targetDate = subMonths(now, i);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;

    const transactions = await getTransactionsByPaymentMethod(year, month, paymentMethodId, type);
    const amount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    trends.push({
      year,
      month,
      paymentMethodId,
      paymentMethodName: paymentMethod.name,
      paymentMethodIcon: paymentMethod.icon,
      paymentMethodColor: paymentMethod.color,
      amount,
      transactionCount: transactions.length,
    });
  }

  return trends.reverse();
}

/**
 * Get transactions by payment method for a specific month
 */
export async function getTransactionsByPaymentMethod(
  year: number,
  month: number,
  paymentMethodId: string,
  type: 'expense' | 'income' = 'expense'
): Promise<Transaction[]> {
  const start = new Date(year, month - 1, 1);
  const end = endOfMonth(start);

  return db.transactions
    .where('date')
    .between(start, end, true, true)
    .filter((tx) => tx.paymentMethodId === paymentMethodId && tx.type === type)
    .toArray();
}

/**
 * Get top N transactions by amount for a payment method in a specific month
 */
export async function getTopTransactionsByPaymentMethod(
  year: number,
  month: number,
  paymentMethodId: string,
  limit: number = 5,
  type: 'expense' | 'income' = 'expense'
): Promise<Transaction[]> {
  const transactions = await getTransactionsByPaymentMethod(year, month, paymentMethodId, type);
  return transactions.sort((a, b) => b.amount - a.amount).slice(0, limit);
}

/**
 * Export transactions to CSV format
 */
export async function exportTransactionsToCSV(
  year: number,
  month: number
): Promise<string> {
  const transactions = await getTransactionsByMonth(year, month);
  const categories = await db.categories.toArray();

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const rows: TransactionExportRow[] = transactions.map((tx) => ({
    date: format(tx.date, 'yyyy-MM-dd'),
    time: tx.time,
    type: tx.type === 'income' ? '수입' : '지출',
    category: categoryMap.get(tx.categoryId) || '미분류',
    amount: tx.amount,
    memo: tx.memo || '',
  }));

  // CSV Header (Korean)
  const header = '날짜,시간,구분,카테고리,금액,메모';

  // CSV Rows with proper escaping
  const csvRows = rows.map(
    (row) =>
      `${row.date},${row.time},${row.type},${row.category},${row.amount},"${row.memo.replace(/"/g, '""')}"`
  );

  return [header, ...csvRows].join('\n');
}

/**
 * Get transactions by category for a specific month
 */
export async function getTransactionsByCategory(
  year: number,
  month: number,
  categoryId: string
): Promise<Transaction[]> {
  const start = new Date(year, month - 1, 1);
  const end = endOfMonth(start);

  return db.transactions
    .where('[categoryId+date]')
    .between([categoryId, start], [categoryId, end], true, true)
    .reverse()
    .sortBy('date');
}

/**
 * Get top N transactions by amount for a category in a specific month
 */
export async function getTopTransactionsByCategory(
  year: number,
  month: number,
  categoryId: string,
  limit: number = 5
): Promise<Transaction[]> {
  const transactions = await getTransactionsByCategory(year, month, categoryId);
  return transactions.sort((a, b) => b.amount - a.amount).slice(0, limit);
}

/**
 * Search transactions by memo, tags, or amount
 * Supports:
 * - Text search in memo
 * - Tag search (with or without #)
 * - Amount search (exact or partial match)
 */
export async function searchTransactions(query: string): Promise<Transaction[]> {
  const lowerQuery = query.toLowerCase().trim();

  // # prefix means tag-only search
  const isTagOnlySearch = lowerQuery.startsWith('#');
  const searchTerm = isTagOnlySearch ? lowerQuery.slice(1) : lowerQuery;

  return db.transactions
    .filter((tx) => {
      // Tag search
      if (tx.tags && tx.tags.length > 0) {
        const tagMatch = tx.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm)
        );
        if (tagMatch) return true;
      }

      // If tag-only search, don't check other fields
      if (isTagOnlySearch) return false;

      // Memo search
      if (tx.memo && tx.memo.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Amount search (if query is numeric)
      if (/^\d+$/.test(lowerQuery)) {
        const amountStr = tx.amount.toString();
        if (amountStr.includes(lowerQuery)) {
          return true;
        }
      }

      return false;
    })
    .reverse()
    .sortBy('date');
}

// =========================================
// Budget Wizard Queries
// =========================================

// 기본 예산 비율 (지출 데이터가 없을 때 사용)
const DEFAULT_BUDGET_RATIOS: Record<string, number> = {
  '식비': 30,
  '교통': 10,
  '쇼핑': 15,
  '문화/여가': 10,
  '의료/건강': 5,
  '주거/통신': 20,
  '기타': 10,
};

/**
 * Get budget recommendation based on past 3 months spending
 * If no spending data, returns all expense categories with default ratios
 */
export async function getBudgetRecommendation(): Promise<BudgetRecommendation> {
  const now = new Date();
  const monthlyExpenses: number[] = [];
  const categoryTotals = new Map<string, { amount: number; count: number }>();

  // Analyze last 3 months (excluding current month)
  for (let i = 1; i <= 3; i++) {
    const targetDate = subMonths(now, i);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;

    const summary = await getMonthlySummary(year, month);
    if (summary.transactionCount > 0) {
      monthlyExpenses.push(summary.expense);
    }

    // Get category breakdown for this month
    const breakdown = await getCategoryBreakdown(year, month, 'expense');
    for (const cat of breakdown) {
      const current = categoryTotals.get(cat.categoryId) || { amount: 0, count: 0 };
      categoryTotals.set(cat.categoryId, {
        amount: current.amount + cat.amount,
        count: current.count + 1,
      });
    }
  }

  const dataMonths = monthlyExpenses.length;
  const totalExpense3Months = monthlyExpenses.reduce((sum, e) => sum + e, 0);
  const avgExpense3Months = dataMonths > 0 ? Math.round(totalExpense3Months / dataMonths) : 0;
  const maxExpenseMonth = monthlyExpenses.length > 0 ? Math.max(...monthlyExpenses) : 0;
  const minExpenseMonth = monthlyExpenses.length > 0 ? Math.min(...monthlyExpenses) : 0;

  // Get all expense categories
  const categories = await db.categories.where('type').equals('expense').toArray();
  const categoryBreakdown: CategoryBudgetRecommendation[] = [];

  // 기본 예산 (데이터 없을 때 사용)
  const defaultBudget = 2000000;
  const baseBudget = avgExpense3Months > 0 ? avgExpense3Months : defaultBudget;

  for (const cat of categories) {
    const data = categoryTotals.get(cat.id);

    if (data && data.amount > 0) {
      // 실제 지출 데이터가 있는 경우
      const avgAmount = Math.round(data.amount / dataMonths);
      const percentage = avgExpense3Months > 0 ? (avgAmount / avgExpense3Months) * 100 : 0;

      categoryBreakdown.push({
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        avgAmount,
        percentage: Math.round(percentage * 10) / 10,
        recommendedBudget: avgAmount,
      });
    } else {
      // 지출 데이터가 없는 경우: 기본 비율 적용
      const defaultRatio = DEFAULT_BUDGET_RATIOS[cat.name] || 5;
      const recommendedBudget = Math.round((defaultRatio / 100) * baseBudget);

      categoryBreakdown.push({
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        avgAmount: 0,
        percentage: defaultRatio,
        recommendedBudget,
      });
    }
  }

  // Sort by percentage descending (not avgAmount, to keep sensible order when no data)
  categoryBreakdown.sort((a, b) => b.percentage - a.percentage);

  return {
    avgExpense3Months,
    maxExpenseMonth,
    minExpenseMonth,
    totalExpense3Months,
    dataMonths,
    categoryBreakdown,
  };
}

/**
 * Apply budget to settings and categories
 */
export async function applyBudgetRecommendation(
  totalBudget: number,
  categoryBudgets: { categoryId: string; budget: number }[]
): Promise<void> {
  // Update settings
  await db.settings.update('default', {
    monthlyBudget: totalBudget,
    updatedAt: new Date(),
  });

  // Update category budgets
  const now = new Date();
  for (const { categoryId, budget } of categoryBudgets) {
    await db.categories.update(categoryId, {
      budget,
      updatedAt: now,
    });
  }
}

// =========================================
// Annual Expense Detection Queries
// =========================================

/**
 * Get transactions for a specific year
 */
export async function getTransactionsByYear(year: number): Promise<Transaction[]> {
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 0, 1));

  return db.transactions
    .where('date')
    .between(start, end, true, true)
    .toArray();
}

/**
 * Detect large annual expenses from last year
 * Criteria: >= 500,000원 and >= 3x monthly average for that category
 */
export async function detectAnnualLargeExpenses(): Promise<AnnualExpensePattern[]> {
  const lastYear = new Date().getFullYear() - 1;
  const transactions = await getTransactionsByYear(lastYear);
  const categories = await db.categories.where('type').equals('expense').toArray();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Calculate monthly average per category
  const categoryMonthlyTotals = new Map<string, number[]>();

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;

    const month = tx.date.getMonth();
    const key = tx.categoryId;

    if (!categoryMonthlyTotals.has(key)) {
      categoryMonthlyTotals.set(key, Array(12).fill(0));
    }
    categoryMonthlyTotals.get(key)![month] += tx.amount;
  }

  // Find large expenses
  const largeExpenses: AnnualExpensePattern[] = [];
  const minAmount = 500000; // 50만원 이상

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (tx.amount < minAmount) continue;

    const monthlyTotals = categoryMonthlyTotals.get(tx.categoryId);
    if (!monthlyTotals) continue;

    const nonZeroMonths = monthlyTotals.filter((t) => t > 0);
    const monthlyAvg = nonZeroMonths.length > 0
      ? nonZeroMonths.reduce((sum, t) => sum + t, 0) / nonZeroMonths.length
      : 0;

    // Check if this is significantly larger than monthly average
    if (tx.amount >= monthlyAvg * 2.5) {
      const category = categoryMap.get(tx.categoryId);
      if (!category) continue;

      // Check if we already have this pattern (same memo, same month)
      const txMemo = tx.memo || '';
      const exists = largeExpenses.some(
        (e) => e.description === txMemo && e.month === tx.date.getMonth() + 1
      );
      if (exists) continue;

      largeExpenses.push({
        id: generateId(),
        categoryId: tx.categoryId,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        description: tx.memo || '',
        month: tx.date.getMonth() + 1,
        day: tx.date.getDate(),
        amount: tx.amount,
        year: lastYear,
        isEnabled: true,
        notifyDaysBefore: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // Sort by month
  largeExpenses.sort((a, b) => a.month - b.month);

  return largeExpenses;
}

/**
 * Get saved annual expense patterns
 */
export async function getAnnualExpensePatterns(): Promise<AnnualExpensePattern[]> {
  return db.annualExpenses.orderBy('month').toArray();
}

/**
 * Save annual expense patterns
 */
export async function saveAnnualExpensePatterns(
  patterns: CreateAnnualExpenseInput[]
): Promise<void> {
  const now = new Date();
  const patternsWithId: AnnualExpensePattern[] = patterns.map((p) => ({
    ...p,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }));

  await db.annualExpenses.bulkPut(patternsWithId);
}

/**
 * Update annual expense pattern
 */
export async function updateAnnualExpensePattern(
  id: string,
  updates: Partial<AnnualExpensePattern>
): Promise<void> {
  await db.annualExpenses.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

/**
 * Delete annual expense pattern
 */
export async function deleteAnnualExpensePattern(id: string): Promise<void> {
  await db.annualExpenses.delete(id);
}

/**
 * Get upcoming annual expenses (within next N days)
 */
export async function getUpcomingAnnualExpenses(
  daysAhead: number = 30
): Promise<AnnualExpensePattern[]> {
  const patterns = await db.annualExpenses.where('isEnabled').equals(1).toArray();
  const now = new Date();
  const currentYear = now.getFullYear();

  return patterns.filter((p) => {
    const targetDate = new Date(currentYear, p.month - 1, p.day);

    // If date has passed this year, check next year
    if (targetDate < now) {
      targetDate.setFullYear(currentYear + 1);
    }

    const daysUntil = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= daysAhead && daysUntil >= 0;
  });
}

// =========================================
// Monthly Review Queries
// =========================================

/**
 * Generate monthly review data
 */
export async function generateMonthlyReview(
  year: number,
  month: number
): Promise<MonthlyReview> {
  const currentSummary = await getMonthlySummary(year, month);
  const currentBreakdown = await getCategoryBreakdown(year, month, 'expense');

  // Get previous month data
  const prevDate = subMonths(new Date(year, month - 1, 1), 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const prevBreakdown = await getCategoryBreakdown(prevYear, prevMonth, 'expense');

  // Get settings for budget
  const settings = await db.settings.get('default');
  const monthlyBudget = settings?.monthlyBudget || 0;
  const budgetUsedPercent = monthlyBudget > 0
    ? Math.round((currentSummary.expense / monthlyBudget) * 100)
    : 0;

  // Get category budgets
  const categories = await db.categories.where('type').equals('expense').toArray();
  const categoryBudgetMap = new Map(categories.map((c) => [c.id, c.budget || 0]));

  // Build category comparison
  const prevBreakdownMap = new Map(prevBreakdown.map((b) => [b.categoryId, b]));
  const categoryComparison: CategoryComparison[] = currentBreakdown.map((curr) => {
    const prev = prevBreakdownMap.get(curr.categoryId);
    const prevAmount = prev?.amount || 0;
    const budgetAmount = categoryBudgetMap.get(curr.categoryId) || 0;
    const percentChange = prevAmount > 0
      ? Math.round(((curr.amount - prevAmount) / prevAmount) * 100)
      : 0;

    return {
      categoryId: curr.categoryId,
      categoryName: curr.categoryName,
      categoryIcon: curr.categoryIcon,
      categoryColor: curr.categoryColor,
      currentAmount: curr.amount,
      previousAmount: prevAmount,
      budgetAmount,
      percentChange,
      isOverBudget: budgetAmount > 0 && curr.amount > budgetAmount,
    };
  });

  // Generate insights
  const insights: ReviewInsight[] = [];

  // Budget insight
  if (budgetUsedPercent > 100) {
    insights.push({
      type: 'over_budget',
      message: `예산을 ${budgetUsedPercent - 100}% 초과했어요`,
      percentChange: budgetUsedPercent - 100,
    });
  } else if (budgetUsedPercent > 0 && budgetUsedPercent <= 80) {
    insights.push({
      type: 'under_budget',
      message: `예산의 ${budgetUsedPercent}%만 사용했어요`,
      percentChange: budgetUsedPercent,
    });
  }

  // Category insights (over budget)
  for (const cat of categoryComparison) {
    if (cat.isOverBudget) {
      const overPercent = Math.round(((cat.currentAmount - cat.budgetAmount!) / cat.budgetAmount!) * 100);
      insights.push({
        type: 'over_budget',
        categoryName: cat.categoryName,
        message: `${cat.categoryName}가 예산보다 ${overPercent}% 초과했어요`,
        amount: cat.currentAmount - cat.budgetAmount!,
      });
    }
  }

  // Increase/decrease insights
  const significantChanges = categoryComparison
    .filter((c) => Math.abs(c.percentChange) >= 20 && c.previousAmount > 0)
    .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
    .slice(0, 2);

  for (const cat of significantChanges) {
    const diff = cat.currentAmount - cat.previousAmount;
    if (diff > 0) {
      insights.push({
        type: 'increase',
        categoryName: cat.categoryName,
        message: `${cat.categoryName}가 지난달보다 ${Math.abs(diff).toLocaleString()}원 늘었어요`,
        amount: diff,
        percentChange: cat.percentChange,
      });
    } else {
      insights.push({
        type: 'decrease',
        categoryName: cat.categoryName,
        message: `${cat.categoryName}가 지난달보다 ${Math.abs(diff).toLocaleString()}원 줄었어요`,
        amount: Math.abs(diff),
        percentChange: cat.percentChange,
      });
    }
  }

  return {
    year,
    month,
    totalExpense: currentSummary.expense,
    totalIncome: currentSummary.income,
    budgetUsedPercent,
    insights,
    categoryComparison,
  };
}

// =========================================
// Recurring Transaction Queries (반복 거래)
// =========================================

/**
 * Get all recurring transactions
 */
export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  return db.recurringTransactions.orderBy('nextExecutionDate').toArray();
}

/**
 * Get active recurring transactions
 */
export async function getActiveRecurringTransactions(): Promise<RecurringTransaction[]> {
  return db.recurringTransactions.where('isActive').equals(1).toArray();
}

/**
 * Get recurring transactions by type
 */
export async function getRecurringTransactionsByType(
  type: 'income' | 'expense'
): Promise<RecurringTransaction[]> {
  return db.recurringTransactions
    .where('type')
    .equals(type)
    .filter((rt) => rt.isActive)
    .toArray();
}

/**
 * Create a recurring transaction
 */
export async function createRecurringTransaction(
  input: CreateRecurringTransactionInput
): Promise<RecurringTransaction> {
  const now = new Date();
  const recurring: RecurringTransaction = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  await db.recurringTransactions.add(recurring);
  return recurring;
}

/**
 * Update a recurring transaction
 */
export async function updateRecurringTransaction(
  id: string,
  updates: Partial<RecurringTransaction>
): Promise<void> {
  await db.recurringTransactions.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

/**
 * Delete a recurring transaction
 */
export async function deleteRecurringTransaction(id: string): Promise<void> {
  await db.recurringTransactions.delete(id);
}

/**
 * Calculate next execution date based on frequency
 */
export function calculateNextExecutionDate(
  frequency: RecurrenceFrequency,
  currentDate: Date,
  dayOfMonth?: number
): Date {
  switch (frequency) {
    case 'daily':
      return addDays(currentDate, 1);

    case 'weekly':
      return addWeeks(currentDate, 1);

    case 'biweekly':
      return addWeeks(currentDate, 2);

    case 'monthly': {
      const nextMonth = addMonths(currentDate, 1);
      const targetDay = dayOfMonth || currentDate.getDate();
      const lastDayOfMonth = endOfMonth(nextMonth).getDate();
      const day = Math.min(targetDay, lastDayOfMonth);
      return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day);
    }

    case 'yearly':
      return addYears(currentDate, 1);

    default:
      return addMonths(currentDate, 1);
  }
}

/**
 * Get projected transactions for a date range
 * Generates virtual transactions based on recurring patterns
 */
export async function getProjectedTransactions(
  startDate: Date,
  endDate: Date
): Promise<ProjectedTransaction[]> {
  const recurringList = await getActiveRecurringTransactions();
  const categories = await db.categories.toArray();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const projections: ProjectedTransaction[] = [];

  for (const recurring of recurringList) {
    const category = categoryMap.get(recurring.categoryId);
    if (!category) continue;

    let currentDate = new Date(recurring.nextExecutionDate);

    // Generate projections within the date range
    while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
      // Skip if before start date
      if (isBefore(currentDate, startDate) && !isSameDay(currentDate, startDate)) {
        currentDate = calculateNextExecutionDate(
          recurring.frequency,
          currentDate,
          recurring.dayOfMonth
        );
        continue;
      }

      // Skip if after end date for recurring
      if (recurring.endDate && isAfter(currentDate, recurring.endDate)) {
        break;
      }

      projections.push({
        id: `recurring-${recurring.id}-${format(currentDate, 'yyyy-MM-dd')}`,
        recurringId: recurring.id,
        type: recurring.type,
        amount: recurring.amount,
        categoryId: recurring.categoryId,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        paymentMethodId: recurring.paymentMethodId,
        memo: recurring.memo,
        scheduledDate: new Date(currentDate),
        isProjected: true,
      });

      // Move to next occurrence
      currentDate = calculateNextExecutionDate(
        recurring.frequency,
        currentDate,
        recurring.dayOfMonth
      );
    }
  }

  // Sort by date
  projections.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  return projections;
}

/**
 * Get projected transactions for current month
 */
export async function getMonthlyProjectedTransactions(
  year: number,
  month: number
): Promise<ProjectedTransaction[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = endOfMonth(startDate);
  return getProjectedTransactions(startDate, endDate);
}

// =========================================
// Budget Structure Queries (예산 구조)
// =========================================

/**
 * Get monthly budget structure with projections
 */
export async function getMonthlyBudgetStructure(
  year: number,
  month: number
): Promise<MonthlyBudgetStructure> {
  const settings = await db.settings.get('default');
  const totalBudget = settings?.monthlyBudget || 0;

  // Get actual transactions
  const transactions = await getTransactionsByMonth(year, month);
  const categories = await db.categories.where('type').equals('expense').toArray();

  // Get projected transactions for remaining month
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const isCurrentMonth = year === currentYear && month === currentMonth;

  let projectedTransactions: ProjectedTransaction[] = [];

  if (isCurrentMonth) {
    // Only get projections from tomorrow onwards
    const tomorrow = addDays(today, 1);
    tomorrow.setHours(0, 0, 0, 0);
    const monthEnd = endOfMonth(new Date(year, month - 1, 1));
    projectedTransactions = await getProjectedTransactions(tomorrow, monthEnd);
  }

  // Calculate fixed expenses (from recurring transactions)
  const fixedExpenseProjections = projectedTransactions.filter((p) => p.type === 'expense');
  const fixedExpenses = fixedExpenseProjections.reduce((sum, p) => sum + p.amount, 0);

  // Calculate expected income (from recurring transactions)
  const incomeProjections = projectedTransactions.filter((p) => p.type === 'income');
  const expectedIncome = incomeProjections.reduce((sum, p) => sum + p.amount, 0);

  // Calculate current spending by category
  const categorySpending = new Map<string, number>();
  for (const tx of transactions.filter((t) => t.type === 'expense')) {
    const current = categorySpending.get(tx.categoryId) || 0;
    categorySpending.set(tx.categoryId, current + tx.amount);
  }

  // Calculate projected spending by category
  const categoryProjected = new Map<string, number>();
  for (const proj of fixedExpenseProjections) {
    const current = categoryProjected.get(proj.categoryId) || 0;
    categoryProjected.set(proj.categoryId, current + proj.amount);
  }

  // Build category budget summaries
  const categoryBudgets: CategoryBudgetSummary[] = categories.map((cat) => {
    const currentSpent = categorySpending.get(cat.id) || 0;
    const projectedSpent = (categoryProjected.get(cat.id) || 0) + currentSpent;
    const budgetAmount = cat.budget || 0;
    const remainingBudget = budgetAmount - projectedSpent;
    const percentUsed = budgetAmount > 0 ? Math.round((projectedSpent / budgetAmount) * 100) : 0;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      budgetAmount,
      currentSpent,
      projectedSpent,
      remainingBudget,
      percentUsed,
    };
  });

  // Calculate totals
  const actualExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const actualIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const variableBudget = totalBudget - fixedExpenses;
  const projectedBalance = actualIncome + expectedIncome - actualExpense - fixedExpenses;

  return {
    totalBudget,
    fixedExpenses,
    expectedIncome,
    variableBudget,
    projectedBalance,
    categoryBudgets,
  };
}

/**
 * Get upcoming recurring transactions (next N days)
 */
export async function getUpcomingRecurringTransactions(
  daysAhead: number = 7
): Promise<RecurringTransaction[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = addDays(today, daysAhead);

  const recurring = await getActiveRecurringTransactions();

  return recurring.filter((rt) => {
    const nextDate = new Date(rt.nextExecutionDate);
    return (
      (isAfter(nextDate, today) || isSameDay(nextDate, today)) &&
      (isBefore(nextDate, futureDate) || isSameDay(nextDate, futureDate))
    );
  });
}

/**
 * Execute a recurring transaction (create actual transaction from recurring)
 */
export async function executeRecurringTransaction(
  recurringId: string
): Promise<Transaction | null> {
  const recurring = await db.recurringTransactions.get(recurringId);
  if (!recurring || !recurring.isActive) return null;

  const now = new Date();
  const transaction: Transaction = {
    id: generateId(),
    type: recurring.type,
    amount: recurring.amount,
    categoryId: recurring.categoryId,
    paymentMethodId: recurring.paymentMethodId,
    incomeSourceId: recurring.incomeSourceId,
    memo: recurring.memo,
    tags: recurring.tags,
    date: now,
    time: format(now, 'HH:mm'),
    createdAt: now,
    updatedAt: now,
  };

  // Add transaction
  await db.transactions.add(transaction);

  // Update recurring transaction's next execution date
  const nextDate = calculateNextExecutionDate(
    recurring.frequency,
    now,
    recurring.dayOfMonth
  );

  await db.recurringTransactions.update(recurringId, {
    lastExecutedDate: now,
    nextExecutionDate: nextDate,
    updatedAt: now,
  });

  return transaction;
}

/**
 * Get recent unique memos for tag suggestions
 * Returns unique non-empty memos from recent transactions, most recent first
 */
export async function getRecentMemos(limit: number = 10): Promise<string[]> {
  const transactions = await db.transactions
    .orderBy('createdAt')
    .reverse()
    .limit(200) // Scan recent 200 transactions
    .toArray();

  const memoSet = new Set<string>();
  const result: string[] = [];

  for (const tx of transactions) {
    const memoText = tx.memo;
    if (memoText && !memoSet.has(memoText)) {
      memoSet.add(memoText);
      result.push(memoText);
      if (result.length >= limit) break;
    }
  }

  return result;
}

// 기본 추천 태그 (데이터가 없을 때 표시)
const DEFAULT_SUGGESTED_TAGS = ['정기', '회식', '선물', '카페', '구독', '배달', '외식', '대중교통'];

/**
 * Get recent tags from tags field with frequency
 * Returns unique tags sorted by frequency, most used first
 * Falls back to default tags if no tag data exists
 * Uses the new tags[] field (v8 schema)
 */
export async function getRecentTags(limit: number = 15): Promise<string[]> {
  const transactions = await db.transactions
    .orderBy('createdAt')
    .reverse()
    .limit(300)
    .toArray();

  const tagFrequency = new Map<string, number>();

  for (const tx of transactions) {
    // tags 필드에서 직접 가져오기
    const txTags = tx.tags || [];

    for (const tag of txTags) {
      const count = tagFrequency.get(tag) || 0;
      tagFrequency.set(tag, count + 1);
    }
  }

  // Sort by frequency and return top tags
  const sortedTags = Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);

  // 태그 데이터가 없으면 기본 추천 태그 반환
  if (sortedTags.length === 0) {
    return DEFAULT_SUGGESTED_TAGS.slice(0, limit);
  }

  return sortedTags;
}

/**
 * Get tags specific to a category (most used in that category)
 * Returns tags sorted by frequency within the category
 * Uses the new tags[] field (v8 schema)
 */
export async function getTagsByCategory(
  categoryId: string,
  limit: number = 8
): Promise<string[]> {
  const transactions = await db.transactions
    .where('categoryId')
    .equals(categoryId)
    .reverse()
    .sortBy('createdAt');

  const tagFrequency = new Map<string, number>();

  for (const tx of transactions.slice(0, 100)) {
    // tags 필드에서 직접 가져오기
    const txTags = tx.tags || [];

    for (const tag of txTags) {
      const count = tagFrequency.get(tag) || 0;
      tagFrequency.set(tag, count + 1);
    }
  }

  // Sort by frequency and return top tags
  const sortedTags = Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);

  return sortedTags;
}

/**
 * Get combined tag suggestions: category-specific first, then general
 * Removes duplicates and prioritizes category-specific tags
 */
export async function getTagSuggestions(
  categoryId: string | null,
  limit: number = 12
): Promise<{ categoryTags: string[]; recentTags: string[] }> {
  // Get category-specific tags if category is selected
  const categoryTags = categoryId
    ? await getTagsByCategory(categoryId, 6)
    : [];

  // Get general recent tags
  const allRecentTags = await getRecentTags(limit);

  // Filter out tags already in categoryTags
  const recentTags = allRecentTags
    .filter(tag => !categoryTags.includes(tag))
    .slice(0, limit - categoryTags.length);

  return { categoryTags, recentTags };
}

/**
 * Search transactions by tag
 * Uses the MultiEntry index on tags field for efficient querying
 */
export async function getTransactionsByTag(tag: string): Promise<Transaction[]> {
  return db.transactions
    .where('tags')
    .equals(tag)
    .reverse()
    .sortBy('date');
}

/**
 * Get all unique tags used in transactions
 * Returns tags sorted by frequency
 */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const transactions = await db.transactions.toArray();
  const tagFrequency = new Map<string, number>();

  for (const tx of transactions) {
    const txTags = tx.tags || [];
    for (const tag of txTags) {
      const count = tagFrequency.get(tag) || 0;
      tagFrequency.set(tag, count + 1);
    }
  }

  return Array.from(tagFrequency.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get suggested memos and tags for a category
 * Returns frequently used memos and tags for the given category
 */
export async function getCategorySuggestions(
  categoryId: string,
  memoLimit: number = 6,
  tagLimit: number = 6
): Promise<{ memos: string[]; tags: string[] }> {
  const transactions = await db.transactions
    .where('categoryId')
    .equals(categoryId)
    .reverse()
    .sortBy('createdAt');

  // Count memo frequency
  const memoFrequency = new Map<string, number>();
  const tagFrequency = new Map<string, number>();

  for (const tx of transactions.slice(0, 200)) {
    // Count memos
    if (tx.memo && tx.memo.trim()) {
      const memo = tx.memo.trim();
      memoFrequency.set(memo, (memoFrequency.get(memo) || 0) + 1);
    }

    // Count tags
    for (const tag of tx.tags || []) {
      tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
    }
  }

  // Sort by frequency
  const memos = Array.from(memoFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, memoLimit)
    .map(([memo]) => memo);

  const tags = Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, tagLimit)
    .map(([tag]) => tag);

  return { memos, tags };
}

// =========================================
// Insight Card Queries (홈 인사이트)
// =========================================

export interface CategoryBudgetStatus {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;
  currentSpent: number;
  percentUsed: number;
  remaining: number;
}

export interface MonthCompareItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  currentAmount: number;
  previousAmount: number;
  difference: number;
  percentChange: number;
}

export interface UpcomingItem {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  memo?: string;
  scheduledDate: Date;
  daysUntil: number;
}

/**
 * Get category budget status for insight cards
 * Returns categories with budget set, sorted by percentUsed
 */
export async function getCategoryBudgetStatus(
  year: number,
  month: number
): Promise<{
  caution: CategoryBudgetStatus[];  // 70%+
  room: CategoryBudgetStatus[];     // <50%
  hasCategoryBudget: boolean;
}> {
  const categories = await db.categories.where('type').equals('expense').toArray();
  const categoriesWithBudget = categories.filter((c) => c.budget && c.budget > 0);

  if (categoriesWithBudget.length === 0) {
    return { caution: [], room: [], hasCategoryBudget: false };
  }

  const transactions = await getTransactionsByMonth(year, month);
  const expenseTransactions = transactions.filter((tx) => tx.type === 'expense');

  // Calculate spending per category
  const spendingMap = new Map<string, number>();
  for (const tx of expenseTransactions) {
    const current = spendingMap.get(tx.categoryId) || 0;
    spendingMap.set(tx.categoryId, current + tx.amount);
  }

  const statuses: CategoryBudgetStatus[] = categoriesWithBudget.map((cat) => {
    const currentSpent = spendingMap.get(cat.id) || 0;
    const budgetAmount = cat.budget!;
    const percentUsed = Math.round((currentSpent / budgetAmount) * 100);
    const remaining = budgetAmount - currentSpent;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      budgetAmount,
      currentSpent,
      percentUsed,
      remaining,
    };
  });

  // Split into caution (70%+) and room (<50%)
  const caution = statuses
    .filter((s) => s.percentUsed >= 70)
    .sort((a, b) => b.percentUsed - a.percentUsed)
    .slice(0, 3);

  const room = statuses
    .filter((s) => s.percentUsed < 50)
    .sort((a, b) => a.percentUsed - b.percentUsed)
    .slice(0, 3);

  return { caution, room, hasCategoryBudget: true };
}

/**
 * Compare current month with previous month
 * Returns categories with significant changes
 */
export async function getMonthComparison(
  year: number,
  month: number
): Promise<{
  increases: MonthCompareItem[];
  decreases: MonthCompareItem[];
  hasLastMonthData: boolean;
}> {
  // Current month breakdown
  const currentBreakdown = await getCategoryBreakdown(year, month, 'expense');

  // Previous month breakdown
  const prevDate = subMonths(new Date(year, month - 1, 1), 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const prevBreakdown = await getCategoryBreakdown(prevYear, prevMonth, 'expense');

  if (prevBreakdown.length === 0) {
    return { increases: [], decreases: [], hasLastMonthData: false };
  }

  const prevMap = new Map(prevBreakdown.map((b) => [b.categoryId, b]));

  const comparisons: MonthCompareItem[] = [];

  for (const curr of currentBreakdown) {
    const prev = prevMap.get(curr.categoryId);
    const previousAmount = prev?.amount || 0;
    const difference = curr.amount - previousAmount;
    const percentChange = previousAmount > 0
      ? Math.round((difference / previousAmount) * 100)
      : (curr.amount > 0 ? 100 : 0);

    comparisons.push({
      categoryId: curr.categoryId,
      categoryName: curr.categoryName,
      categoryIcon: curr.categoryIcon,
      categoryColor: curr.categoryColor,
      currentAmount: curr.amount,
      previousAmount,
      difference,
      percentChange,
    });
  }

  // Also add categories that existed last month but not this month
  for (const prev of prevBreakdown) {
    if (!currentBreakdown.find((c) => c.categoryId === prev.categoryId)) {
      comparisons.push({
        categoryId: prev.categoryId,
        categoryName: prev.categoryName,
        categoryIcon: prev.categoryIcon,
        categoryColor: prev.categoryColor,
        currentAmount: 0,
        previousAmount: prev.amount,
        difference: -prev.amount,
        percentChange: -100,
      });
    }
  }

  // Split into increases and decreases (significant changes only: >= 20% or >= 10,000원)
  const significant = comparisons.filter(
    (c) => Math.abs(c.percentChange) >= 20 || Math.abs(c.difference) >= 10000
  );

  const increases = significant
    .filter((c) => c.difference > 0)
    .sort((a, b) => b.difference - a.difference)
    .slice(0, 2);

  const decreases = significant
    .filter((c) => c.difference < 0)
    .sort((a, b) => a.difference - b.difference)
    .slice(0, 2);

  return { increases, decreases, hasLastMonthData: true };
}

/**
 * Get upcoming scheduled transactions for this month
 * Returns transactions scheduled for the remaining days of the month
 */
export async function getUpcomingThisMonth(
  year: number,
  month: number
): Promise<{
  items: UpcomingItem[];
  totalExpense: number;
  totalIncome: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthEnd = endOfMonth(new Date(year, month - 1, 1));

  // Only get upcoming if we're in the current or future month
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { items: [], totalExpense: 0, totalIncome: 0 };
  }

  const startDate = year === currentYear && month === currentMonth
    ? addDays(today, 1)
    : new Date(year, month - 1, 1);

  const projections = await getProjectedTransactions(startDate, monthEnd);

  const items: UpcomingItem[] = projections.map((p) => ({
    id: p.id,
    type: p.type,
    amount: p.amount,
    categoryName: p.categoryName,
    categoryIcon: p.categoryIcon,
    categoryColor: p.categoryColor,
    memo: p.memo,
    scheduledDate: p.scheduledDate,
    daysUntil: Math.ceil((p.scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  }));

  const totalExpense = items
    .filter((i) => i.type === 'expense')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalIncome = items
    .filter((i) => i.type === 'income')
    .reduce((sum, i) => sum + i.amount, 0);

  return { items: items.slice(0, 5), totalExpense, totalIncome };
}

/**
 * Get current month record summary (for first-time users)
 */
export async function getCurrentMonthRecordSummary(
  year: number,
  month: number
): Promise<{
  transactionCount: number;
  totalExpense: number;
  totalIncome: number;
}> {
  const summary = await getMonthlySummary(year, month);

  return {
    transactionCount: summary.transactionCount,
    totalExpense: summary.expense,
    totalIncome: summary.income,
  };
}

// ============================================
// Insight Detail Queries (인사이트 상세 뷰)
// ============================================

/**
 * Calculate remaining days in the current month
 */
function getRemainingDaysInMonth(): number {
  const now = new Date();
  const lastDay = endOfMonth(now);
  return differenceInDays(lastDay, now) + 1;
}

/**
 * Get day of week label in Korean
 */
function getDayOfWeekLabel(dayIndex: number): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[dayIndex] + '요일';
}

/**
 * Get time range label based on hour
 */
function getTimeRangeLabel(hour: number): string {
  if (hour >= 6 && hour < 11) return '아침';
  if (hour >= 11 && hour < 14) return '점심';
  if (hour >= 14 && hour < 18) return '오후';
  if (hour >= 18 && hour < 22) return '저녁';
  return '밤';
}

/**
 * 1. Caution Detail - 주의 카테고리 상세 데이터
 */
export async function getCautionDetail(
  categoryId: string,
  year: number,
  month: number
): Promise<CautionDetailData | null> {
  const category = await db.categories.get(categoryId);
  if (!category || !category.budget || category.budget <= 0) {
    return null;
  }

  const transactions = await getTransactionsByMonth(year, month);
  const categoryTransactions = transactions.filter(
    (tx) => tx.type === 'expense' && tx.categoryId === categoryId
  );

  const currentSpent = categoryTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const budgetAmount = category.budget;
  const percentUsed = Math.round((currentSpent / budgetAmount) * 100);
  const remaining = Math.max(budgetAmount - currentSpent, 0);
  const remainingDays = getRemainingDaysInMonth();
  const dailyRecommended = remainingDays > 0 ? Math.round(remaining / remainingDays) : 0;

  // Top 3 transactions by amount
  const sortedByAmount = [...categoryTransactions].sort((a, b) => b.amount - a.amount);
  const topTransactionIds = sortedByAmount.slice(0, 3).map((tx) => tx.id);

  // Generate insight message
  let insightMessage: string;
  if (percentUsed >= 100) {
    insightMessage = `${category.name} 예산을 초과했어요. 남은 기간 지출을 줄여보세요.`;
  } else if (remainingDays > 0 && dailyRecommended > 0) {
    insightMessage = `하루 ${dailyRecommended.toLocaleString()}원 이내로 쓰면 예산 내 마무리할 수 있어요.`;
  } else {
    insightMessage = `${category.name} 예산의 ${percentUsed}%를 사용했어요.`;
  }

  return {
    categoryId,
    categoryName: category.name,
    categoryIcon: category.icon,
    categoryColor: category.color,
    budgetAmount,
    currentSpent,
    percentUsed,
    remaining,
    remainingDays,
    dailyRecommended,
    topTransactionIds,
    insightMessage,
  };
}

/**
 * 2. Room Detail - 여유 카테고리 상세 데이터
 */
export async function getRoomDetail(
  categoryId: string,
  year: number,
  month: number
): Promise<RoomDetailData | null> {
  const category = await db.categories.get(categoryId);
  if (!category || !category.budget || category.budget <= 0) {
    return null;
  }

  const transactions = await getTransactionsByMonth(year, month);
  const categoryTransactions = transactions.filter(
    (tx) => tx.type === 'expense' && tx.categoryId === categoryId
  );

  const currentSpent = categoryTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const budgetAmount = category.budget;
  const percentUsed = Math.round((currentSpent / budgetAmount) * 100);
  const remaining = Math.max(budgetAmount - currentSpent, 0);

  // Last month same point comparison (optional)
  let lastMonthSamePoint: number | undefined;
  const today = new Date();
  const currentDay = today.getDate();

  const prevDate = subMonths(new Date(year, month - 1, 1), 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const lastMonthTransactions = await getTransactionsByMonth(prevYear, prevMonth);
  const lastMonthCategoryTx = lastMonthTransactions.filter(
    (tx) =>
      tx.type === 'expense' &&
      tx.categoryId === categoryId &&
      tx.date.getDate() <= currentDay
  );
  if (lastMonthCategoryTx.length > 0) {
    lastMonthSamePoint = lastMonthCategoryTx.reduce((sum, tx) => sum + tx.amount, 0);
  }

  const insightMessage = `${category.name}에 ${remaining.toLocaleString()}원 여유가 있어요. 이 흐름 유지해봐요.`;

  return {
    categoryId,
    categoryName: category.name,
    categoryIcon: category.icon,
    categoryColor: category.color,
    budgetAmount,
    currentSpent,
    percentUsed,
    remaining,
    lastMonthSamePoint,
    insightMessage,
  };
}

/**
 * 3. Interest Detail - 관심 카테고리 상세 데이터
 */
export async function getInterestDetail(
  categoryId: string,
  year: number,
  month: number
): Promise<InterestDetailData | null> {
  const category = await db.categories.get(categoryId);
  if (!category) {
    return null;
  }

  const transactions = await getTransactionsByMonth(year, month);
  const categoryTransactions = transactions.filter(
    (tx) => tx.type === 'expense' && tx.categoryId === categoryId
  );

  if (categoryTransactions.length === 0) {
    return null;
  }

  const totalCount = categoryTransactions.length;
  const totalAmount = categoryTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const averageAmount = Math.round(totalAmount / totalCount);

  // Analyze peak day of week
  const dayOfWeekCounts = new Map<number, number>();
  for (const tx of categoryTransactions) {
    const dow = tx.date.getDay();
    dayOfWeekCounts.set(dow, (dayOfWeekCounts.get(dow) || 0) + 1);
  }
  let peakDayOfWeek: string | undefined;
  let maxDayCount = 0;
  for (const [dow, count] of dayOfWeekCounts) {
    if (count > maxDayCount) {
      maxDayCount = count;
      peakDayOfWeek = getDayOfWeekLabel(dow);
    }
  }

  // Analyze peak time range
  const timeRangeCounts = new Map<string, number>();
  for (const tx of categoryTransactions) {
    if (tx.time) {
      const hour = parseInt(tx.time.split(':')[0], 10);
      const range = getTimeRangeLabel(hour);
      timeRangeCounts.set(range, (timeRangeCounts.get(range) || 0) + 1);
    }
  }
  let peakTimeRange: string | undefined;
  let maxTimeCount = 0;
  for (const [range, count] of timeRangeCounts) {
    if (count > maxTimeCount) {
      maxTimeCount = count;
      peakTimeRange = range;
    }
  }

  // Generate insight message
  let insightMessage: string;
  if (peakDayOfWeek) {
    insightMessage = `주로 ${peakDayOfWeek}에 많이 쓰고 있어요. 평균 ${averageAmount.toLocaleString()}원씩이에요.`;
  } else {
    insightMessage = `${totalCount}번, 평균 ${averageAmount.toLocaleString()}원씩 썼어요.`;
  }

  return {
    categoryId,
    categoryName: category.name,
    categoryIcon: category.icon,
    categoryColor: category.color,
    totalCount,
    totalAmount,
    averageAmount,
    peakDayOfWeek,
    peakTimeRange,
    insightMessage,
  };
}

/**
 * 4. Compare Detail - 전월 대비 상세 데이터
 */
export async function getCompareDetail(
  categoryId: string,
  year: number,
  month: number
): Promise<CompareDetailData | null> {
  const category = await db.categories.get(categoryId);
  if (!category) {
    return null;
  }

  // Current month
  const currentTransactions = await getTransactionsByMonth(year, month);
  const currentCategoryTx = currentTransactions.filter(
    (tx) => tx.type === 'expense' && tx.categoryId === categoryId
  );
  const currentAmount = currentCategoryTx.reduce((sum, tx) => sum + tx.amount, 0);
  const currentCount = currentCategoryTx.length;

  // Last month
  const prevDate = subMonths(new Date(year, month - 1, 1), 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const lastMonthTransactions = await getTransactionsByMonth(prevYear, prevMonth);
  const lastMonthCategoryTx = lastMonthTransactions.filter(
    (tx) => tx.type === 'expense' && tx.categoryId === categoryId
  );
  const lastMonthAmount = lastMonthCategoryTx.reduce((sum, tx) => sum + tx.amount, 0);
  const lastMonthCount = lastMonthCategoryTx.length;

  const difference = currentAmount - lastMonthAmount;
  const percentChange =
    lastMonthAmount > 0
      ? Math.round((difference / lastMonthAmount) * 100)
      : currentAmount > 0
        ? 100
        : 0;
  const isIncrease = difference > 0;

  // Generate insight message
  let insightMessage: string;
  if (isIncrease) {
    insightMessage = `지난달보다 ${Math.abs(difference).toLocaleString()}원 늘었어요. 어떤 지출이 늘었는지 확인해보세요.`;
  } else if (difference < 0) {
    insightMessage = `지난달보다 ${Math.abs(difference).toLocaleString()}원 줄었어요. 이 흐름 유지해봐요.`;
  } else {
    insightMessage = `지난달과 비슷한 수준이에요.`;
  }

  return {
    categoryId,
    categoryName: category.name,
    categoryIcon: category.icon,
    categoryColor: category.color,
    currentMonth: {
      year,
      month,
      amount: currentAmount,
      count: currentCount,
    },
    lastMonth: {
      year: prevYear,
      month: prevMonth,
      amount: lastMonthAmount,
      count: lastMonthCount,
    },
    difference,
    percentChange,
    isIncrease,
    insightMessage,
  };
}

/**
 * 5. Upcoming Detail - 예정 거래 상세 데이터
 */
export async function getUpcomingDetail(
  year: number,
  month: number
): Promise<UpcomingDetailData> {
  const upcoming = await getUpcomingThisMonth(year, month);

  const items: UpcomingDetailItem[] = upcoming.items.map((item) => ({
    id: item.id,
    type: item.type,
    amount: item.amount,
    categoryId: '', // Not available in UpcomingItem, will be resolved if needed
    categoryName: item.categoryName,
    categoryIcon: item.categoryIcon,
    categoryColor: item.categoryColor,
    memo: item.memo,
    scheduledDate: item.scheduledDate,
    daysUntil: item.daysUntil,
  }));

  const totalCount = items.length;
  const totalExpense = upcoming.totalExpense;
  const totalIncome = upcoming.totalIncome;
  const netImpact = totalIncome - totalExpense;

  const nextItem = items.length > 0 ? items[0] : undefined;

  // Generate insight message
  let insightMessage: string;
  if (nextItem) {
    const daysText = nextItem.daysUntil === 1 ? '내일' : `${nextItem.daysUntil}일 후`;
    insightMessage = `다음 예정: ${daysText} ${nextItem.memo || nextItem.categoryName} ${nextItem.amount.toLocaleString()}원`;
  } else {
    insightMessage = `이번 달 예정된 거래가 없어요.`;
  }

  return {
    totalCount,
    totalExpense,
    totalIncome,
    netImpact,
    items,
    nextItem,
    insightMessage,
  };
}

/**
 * 6. 통합 인사이트 상세 데이터 조회
 */
export async function getInsightDetail(
  insightType: InsightType,
  categoryId?: string,
  year?: number,
  month?: number
): Promise<InsightDetailData | null> {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;

  switch (insightType) {
    case 'caution': {
      if (!categoryId) return null;
      const cautionData = await getCautionDetail(categoryId, y, m);
      return cautionData ? { type: 'caution', data: cautionData } : null;
    }

    case 'room': {
      if (!categoryId) return null;
      const roomData = await getRoomDetail(categoryId, y, m);
      return roomData ? { type: 'room', data: roomData } : null;
    }

    case 'interest': {
      if (!categoryId) return null;
      const interestData = await getInterestDetail(categoryId, y, m);
      return interestData ? { type: 'interest', data: interestData } : null;
    }

    case 'compare': {
      if (!categoryId) return null;
      const compareData = await getCompareDetail(categoryId, y, m);
      return compareData ? { type: 'compare', data: compareData } : null;
    }

    case 'upcoming': {
      const upcomingData = await getUpcomingDetail(y, m);
      return { type: 'upcoming', data: upcomingData };
    }

    default:
      return null;
  }
}
