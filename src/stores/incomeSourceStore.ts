import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db, generateId } from '@/services/database';
import type { IncomeSource, CreateIncomeSourceInput } from '@/types';

interface IncomeSourceState {
  incomeSources: IncomeSource[];
  isLoading: boolean;
  error: string | null;
}

interface IncomeSourceActions {
  fetchIncomeSources: () => Promise<void>;
  addIncomeSource: (input: CreateIncomeSourceInput) => Promise<IncomeSource>;
  updateIncomeSource: (id: string, updates: Partial<IncomeSource>) => Promise<void>;
  deleteIncomeSource: (id: string) => Promise<void>;
  reorderIncomeSources: (reorderedSources: IncomeSource[]) => Promise<void>;
  clearError: () => void;
}

type IncomeSourceStore = IncomeSourceState & IncomeSourceActions;

export const useIncomeSourceStore = create<IncomeSourceStore>()(
  devtools(
    (set, get) => ({
      incomeSources: [],
      isLoading: false,
      error: null,

      fetchIncomeSources: async () => {
        set({ isLoading: true, error: null });
        try {
          const incomeSources = await db.incomeSources.orderBy('order').toArray();
          set({ incomeSources, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch income sources:', error);
          set({ error: '수입수단을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      addIncomeSource: async (input: CreateIncomeSourceInput) => {
        set({ isLoading: true, error: null });
        try {
          const now = new Date();
          const existing = get().incomeSources;
          const maxOrder = existing.length > 0 ? Math.max(...existing.map((s) => s.order)) : -1;

          const newSource: IncomeSource = {
            ...input,
            id: generateId(),
            order: maxOrder + 1,
            createdAt: now,
            updatedAt: now,
          };

          await db.incomeSources.add(newSource);

          set((state) => ({
            incomeSources: [...state.incomeSources, newSource],
            isLoading: false,
          }));

          return newSource;
        } catch (error) {
          console.error('Failed to add income source:', error);
          set({ error: '수입수단 추가에 실패했습니다.', isLoading: false });
          throw error;
        }
      },

      updateIncomeSource: async (id: string, updates: Partial<IncomeSource>) => {
        set({ isLoading: true, error: null });
        try {
          const updateData = { ...updates, updatedAt: new Date() };
          await db.incomeSources.update(id, updateData);

          set((state) => ({
            incomeSources: state.incomeSources.map((s) =>
              s.id === id ? { ...s, ...updateData } : s
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to update income source:', error);
          set({ error: '수입수단 수정에 실패했습니다.', isLoading: false });
          throw error;
        }
      },

      deleteIncomeSource: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const source = get().incomeSources.find((s) => s.id === id);
          if (source?.isDefault) {
            throw new Error('기본 수입수단은 삭제할 수 없습니다.');
          }

          await db.incomeSources.delete(id);

          set((state) => ({
            incomeSources: state.incomeSources.filter((s) => s.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to delete income source:', error);
          set({
            error: error instanceof Error ? error.message : '수입수단 삭제에 실패했습니다.',
            isLoading: false,
          });
          throw error;
        }
      },

      reorderIncomeSources: async (reorderedSources: IncomeSource[]) => {
        set({ isLoading: true, error: null });
        try {
          const now = new Date();
          const updates = reorderedSources.map((s, index) => ({
            ...s,
            order: index,
            updatedAt: now,
          }));

          // Batch update in database
          await db.transaction('rw', db.incomeSources, async () => {
            for (const s of updates) {
              await db.incomeSources.update(s.id, { order: s.order, updatedAt: s.updatedAt });
            }
          });

          set({ incomeSources: updates, isLoading: false });
        } catch (error) {
          console.error('Failed to reorder income sources:', error);
          set({ error: '순서 변경에 실패했습니다.', isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'IncomeSourceStore' }
  )
);

// Selectors
export const selectIncomeSources = (state: IncomeSourceStore) => state.incomeSources;

export const selectIncomeSourceById = (id: string) => (state: IncomeSourceStore) =>
  state.incomeSources.find((s) => s.id === id);

export const selectDefaultIncomeSource = (state: IncomeSourceStore) =>
  state.incomeSources.find((s) => s.isDefault) || state.incomeSources[0];

export const selectIncomeSourceMap = (state: IncomeSourceStore) =>
  new Map(state.incomeSources.map((s) => [s.id, s]));
