import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db, generateId } from '@/services/database';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput, MonthSummary } from '@/types';
import { startOfMonth, endOfMonth } from 'date-fns';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

interface TransactionActions {
  fetchTransactions: (month: Date) => Promise<void>;
  addTransaction: (input: CreateTransactionInput) => Promise<Transaction>;
  updateTransaction: (id: string, input: UpdateTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearError: () => void;
}

type TransactionStore = TransactionState & TransactionActions;

export const useTransactionStore = create<TransactionStore>()(
  devtools(
    (set) => ({
      transactions: [],
      isLoading: false,
      error: null,

      fetchTransactions: async (month: Date) => {
        set({ isLoading: true, error: null });
        try {
          const start = startOfMonth(month);
          const end = endOfMonth(month);

          const transactions = await db.transactions
            .where('date')
            .between(start, end, true, true)
            .reverse()
            .sortBy('date');

          set({ transactions, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch transactions:', error);
          set({
            error: '거래 내역을 불러오는데 실패했습니다.',
            isLoading: false,
          });
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

          set((state) => ({
            transactions: [newTransaction, ...state.transactions],
            isLoading: false,
          }));

          return newTransaction;
        } catch (error) {
          console.error('Failed to add transaction:', error);
          set({
            error: '거래 추가에 실패했습니다.',
            isLoading: false,
          });
          throw error;
        }
      },

      updateTransaction: async (id: string, input: UpdateTransactionInput) => {
        set({ isLoading: true, error: null });
        try {
          const updates = {
            ...input,
            updatedAt: new Date(),
          };

          await db.transactions.update(id, updates);

          set((state) => ({
            transactions: state.transactions.map((tx) =>
              tx.id === id ? { ...tx, ...updates } : tx
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to update transaction:', error);
          set({
            error: '거래 수정에 실패했습니다.',
            isLoading: false,
          });
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
          set({
            error: '거래 삭제에 실패했습니다.',
            isLoading: false,
          });
          throw error;
        }
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
