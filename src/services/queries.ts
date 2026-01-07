import { db, generateId } from './database';
import { endOfMonth, subMonths, startOfYear, endOfYear, format } from 'date-fns';
import type {
  Transaction,
  MonthSummary,
  CategorySummary,
  MonthlyTrend,
  AnnualTrend,
  CategoryTrend,
  TransactionExportRow,
  BudgetRecommendation,
  CategoryBudgetRecommendation,
  AnnualExpensePattern,
  CreateAnnualExpenseInput,
  MonthlyReview,
  ReviewInsight,
  CategoryComparison,
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
    description: tx.description,
    amount: tx.amount,
    memo: tx.memo || '',
  }));

  // CSV Header (Korean)
  const header = '날짜,시간,구분,카테고리,내용,금액,메모';

  // CSV Rows with proper escaping
  const csvRows = rows.map(
    (row) =>
      `${row.date},${row.time},${row.type},${row.category},"${row.description.replace(/"/g, '""')}",${row.amount},"${row.memo.replace(/"/g, '""')}"`
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
 * Search transactions by description or memo
 */
export async function searchTransactions(query: string): Promise<Transaction[]> {
  const lowerQuery = query.toLowerCase();

  return db.transactions
    .filter(
      (tx) =>
        tx.description.toLowerCase().includes(lowerQuery) ||
        (tx.memo ? tx.memo.toLowerCase().includes(lowerQuery) : false)
    )
    .reverse()
    .sortBy('date');
}

// =========================================
// Budget Wizard Queries
// =========================================

/**
 * Get budget recommendation based on past 3 months spending
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

  // Get category details
  const categories = await db.categories.where('type').equals('expense').toArray();
  const categoryBreakdown: CategoryBudgetRecommendation[] = [];

  for (const cat of categories) {
    const data = categoryTotals.get(cat.id);
    if (data && data.amount > 0) {
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
    }
  }

  // Sort by amount descending
  categoryBreakdown.sort((a, b) => b.avgAmount - a.avgAmount);

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

      // Check if we already have this pattern (same description, same month)
      const exists = largeExpenses.some(
        (e) => e.description === tx.description && e.month === tx.date.getMonth() + 1
      );
      if (exists) continue;

      largeExpenses.push({
        id: generateId(),
        categoryId: tx.categoryId,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        description: tx.description,
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
