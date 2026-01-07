import { db } from './database';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import type {
  Transaction,
  MonthSummary,
  CategorySummary,
  MonthlyTrend,
  TransactionExportRow,
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
 * Search transactions by description or memo
 */
export async function searchTransactions(query: string): Promise<Transaction[]> {
  const lowerQuery = query.toLowerCase();

  return db.transactions
    .filter(
      (tx) =>
        tx.description.toLowerCase().includes(lowerQuery) ||
        (tx.memo && tx.memo.toLowerCase().includes(lowerQuery))
    )
    .reverse()
    .sortBy('date');
}
