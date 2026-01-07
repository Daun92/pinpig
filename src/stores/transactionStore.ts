import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db, generateId } from '@/services/database';
import {
  getTransactionsByMonth,
  getRecentTransactions,
  getMonthlySummary,
  getCategoryBreakdown,
  getMonthlyTrend,
  exportTransactionsToCSV,
} from '@/services/queries';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  MonthSummary,
  CategorySummary,
  MonthlyTrend,
  BudgetStatus,
} from '@/types';
import { endOfMonth, differenceInDays } from 'date-fns';

interface TransactionState {
  transactions: Transaction[];
  currentMonth: Date;
  monthSummary: MonthSummary | null;
  categoryBreakdown: CategorySummary[];
  monthlyTrend: MonthlyTrend[];
  isLoading: boolean;
  error: string | null;
}

interface TransactionActions {
  // CRUD
  fetchTransactions: (month?: Date) => Promise<void>;
  fetchRecentTransactions: (limit?: number) => Promise<void>;
  addTransaction: (input: CreateTransactionInput) => Promise<Transaction>;
  updateTransaction: (id: string, input: UpdateTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Reports
  fetchMonthSummary: (year: number, month: number) => Promise<void>;
  fetchCategoryBreakdown: (year: number, month: number, type?: 'income' | 'expense') => Promise<void>;
  fetchMonthlyTrend: (months?: number) => Promise<void>;

  // Export
  exportToCSV: (year: number, month: number) => Promise<string>;

  // Navigation
  setCurrentMonth: (month: Date) => void;

  // Utility
  clearError: () => void;
}

type TransactionStore = TransactionState & TransactionActions;

export const useTransactionStore = create<TransactionStore>()(
  devtools(
    (set, get) => ({
      transactions: [],
      currentMonth: new Date(),
      monthSummary: null,
      categoryBreakdown: [],
      monthlyTrend: [],
      isLoading: false,
      error: null,

      fetchTransactions: async (month?: Date) => {
        const targetMonth = month || get().currentMonth;
        set({ isLoading: true, error: null });
        try {
          const year = targetMonth.getFullYear();
          const monthNum = targetMonth.getMonth() + 1;

          const transactions = await getTransactionsByMonth(year, monthNum);
          set({ transactions, currentMonth: targetMonth, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch transactions:', error);
          set({ error: '거래 내역을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      fetchRecentTransactions: async (limit: number = 10) => {
        set({ isLoading: true, error: null });
        try {
          const transactions = await getRecentTransactions(limit);
          set({ transactions, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch recent transactions:', error);
          set({ error: '최근 거래를 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      addTransaction: async (input: CreateTransactionInput) => {
        set({ isLoading: true, error: null });
        try {
          const now = new Date();
          const newTransaction: Transaction = {
            ...input,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
          };

          await db.transactions.add(newTransaction);

          // Update local state if transaction is in current month
          const current = get().currentMonth;
          const txMonth = input.date.getMonth();
          const txYear = input.date.getFullYear();

          if (txMonth === current.getMonth() && txYear === current.getFullYear()) {
            set((state) => ({
              transactions: [newTransaction, ...state.transactions],
              isLoading: false,
            }));
          } else {
            set({ isLoading: false });
          }

          return newTransaction;
        } catch (error) {
          console.error('Failed to add transaction:', error);
          set({ error: '거래 추가에 실패했습니다.', isLoading: false });
          throw error;
        }
      },

      updateTransaction: async (id: string, input: UpdateTransactionInput) => {
        set({ isLoading: true, error: null });
        try {
          const updates = { ...input, updatedAt: new Date() };
          await db.transactions.update(id, updates);

          set((state) => ({
            transactions: state.transactions.map((tx) =>
              tx.id === id ? { ...tx, ...updates } : tx
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to update transaction:', error);
          set({ error: '거래 수정에 실패했습니다.', isLoading: false });
          throw error;
        }
      },

      deleteTransaction: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await db.transactions.delete(id);

          set((state) => ({
            transactions: state.transactions.filter((tx) => tx.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to delete transaction:', error);
          set({ error: '거래 삭제에 실패했습니다.', isLoading: false });
          throw error;
        }
      },

      fetchMonthSummary: async (year: number, month: number) => {
        try {
          const summary = await getMonthlySummary(year, month);
          set({ monthSummary: summary });
        } catch (error) {
          console.error('Failed to fetch month summary:', error);
        }
      },

      fetchCategoryBreakdown: async (
        year: number,
        month: number,
        type: 'income' | 'expense' = 'expense'
      ) => {
        try {
          const breakdown = await getCategoryBreakdown(year, month, type);
          set({ categoryBreakdown: breakdown });
        } catch (error) {
          console.error('Failed to fetch category breakdown:', error);
        }
      },

      fetchMonthlyTrend: async (months: number = 6) => {
        try {
          const trend = await getMonthlyTrend(months);
          set({ monthlyTrend: trend });
        } catch (error) {
          console.error('Failed to fetch monthly trend:', error);
        }
      },

      exportToCSV: async (year: number, month: number) => {
        return exportTransactionsToCSV(year, month);
      },

      setCurrentMonth: (month: Date) => {
        set({ currentMonth: month });
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'TransactionStore' }
  )
);

// Selectors
export const selectMonthSummary = (state: TransactionStore): MonthSummary => {
  const { transactions } = state;

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
};

export const selectBudgetStatus =
  (monthlyBudget: number) =>
  (state: TransactionStore): BudgetStatus => {
    const { transactions, currentMonth } = state;

    const totalExpense = transactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const remaining = monthlyBudget - totalExpense;
    const today = new Date();
    const monthEnd = endOfMonth(currentMonth);
    const remainingDays = Math.max(1, differenceInDays(monthEnd, today) + 1);
    const dailyRecommended = remaining > 0 ? remaining / remainingDays : 0;
    const percentUsed = monthlyBudget > 0 ? (totalExpense / monthlyBudget) * 100 : 0;

    return {
      monthlyBudget,
      totalExpense,
      remaining,
      remainingDays,
      dailyRecommended: Math.round(dailyRecommended),
      percentUsed: Math.round(percentUsed * 10) / 10,
      isOverBudget: remaining < 0,
    };
  };

export const selectTransactionsByDate = (state: TransactionStore) => {
  const grouped: Record<string, Transaction[]> = {};

  for (const tx of state.transactions) {
    const dateKey = tx.date.toDateString();
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(tx);
  }

  return grouped;
};

export const selectCurrentMonth = (state: TransactionStore) => state.currentMonth;
export const selectCategoryBreakdown = (state: TransactionStore) => state.categoryBreakdown;
export const selectMonthlyTrend = (state: TransactionStore) => state.monthlyTrend;
