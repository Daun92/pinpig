import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db, generateId } from '@/services/database';
import type { PaymentMethod, CreatePaymentMethodInput } from '@/types';

interface PaymentMethodState {
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  error: string | null;
}

interface PaymentMethodActions {
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (input: CreatePaymentMethodInput) => Promise<PaymentMethod>;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  reorderPaymentMethods: (reorderedMethods: PaymentMethod[]) => Promise<void>;
  clearError: () => void;
}

type PaymentMethodStore = PaymentMethodState & PaymentMethodActions;

export const usePaymentMethodStore = create<PaymentMethodStore>()(
  devtools(
    (set, get) => ({
      paymentMethods: [],
      isLoading: false,
      error: null,

      fetchPaymentMethods: async () => {
        set({ isLoading: true, error: null });
        try {
          const paymentMethods = await db.paymentMethods.orderBy('order').toArray();
          set({ paymentMethods, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch payment methods:', error);
          set({ error: '결제수단을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      addPaymentMethod: async (input: CreatePaymentMethodInput) => {
        set({ isLoading: true, error: null });
        try {
          const now = new Date();
          const existing = get().paymentMethods;
          const maxOrder = existing.length > 0 ? Math.max(...existing.map((p) => p.order)) : -1;

          const newMethod: PaymentMethod = {
            ...input,
            id: generateId(),
            order: maxOrder + 1,
            createdAt: now,
            updatedAt: now,
          };

          await db.paymentMethods.add(newMethod);

          set((state) => ({
            paymentMethods: [...state.paymentMethods, newMethod],
            isLoading: false,
          }));

          return newMethod;
        } catch (error) {
          console.error('Failed to add payment method:', error);
          set({ error: '결제수단 추가에 실패했습니다.', isLoading: false });
          throw error;
        }
      },

      updatePaymentMethod: async (id: string, updates: Partial<PaymentMethod>) => {
        set({ isLoading: true, error: null });
        try {
          const updateData = { ...updates, updatedAt: new Date() };
          await db.paymentMethods.update(id, updateData);

          set((state) => ({
            paymentMethods: state.paymentMethods.map((pm) =>
              pm.id === id ? { ...pm, ...updateData } : pm
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to update payment method:', error);
          set({ error: '결제수단 수정에 실패했습니다.', isLoading: false });
          throw error;
        }
      },

      deletePaymentMethod: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const method = get().paymentMethods.find((p) => p.id === id);
          if (method?.isDefault) {
            throw new Error('기본 결제수단은 삭제할 수 없습니다.');
          }

          await db.paymentMethods.delete(id);

          set((state) => ({
            paymentMethods: state.paymentMethods.filter((pm) => pm.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to delete payment method:', error);
          set({
            error: error instanceof Error ? error.message : '결제수단 삭제에 실패했습니다.',
            isLoading: false,
          });
          throw error;
        }
      },

      reorderPaymentMethods: async (reorderedMethods: PaymentMethod[]) => {
        set({ isLoading: true, error: null });
        try {
          const now = new Date();
          const updates = reorderedMethods.map((pm, index) => ({
            ...pm,
            order: index,
            updatedAt: now,
          }));

          // Batch update in database
          await db.transaction('rw', db.paymentMethods, async () => {
            for (const pm of updates) {
              await db.paymentMethods.update(pm.id, { order: pm.order, updatedAt: pm.updatedAt });
            }
          });

          set({ paymentMethods: updates, isLoading: false });
        } catch (error) {
          console.error('Failed to reorder payment methods:', error);
          set({ error: '순서 변경에 실패했습니다.', isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'PaymentMethodStore' }
  )
);

// Selectors
export const selectPaymentMethods = (state: PaymentMethodStore) => state.paymentMethods;

export const selectPaymentMethodById = (id: string) => (state: PaymentMethodStore) =>
  state.paymentMethods.find((p) => p.id === id);

export const selectDefaultPaymentMethod = (state: PaymentMethodStore) =>
  state.paymentMethods.find((p) => p.isDefault) || state.paymentMethods[0];
