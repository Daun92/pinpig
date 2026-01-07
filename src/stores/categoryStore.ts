import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db, generateId } from '@/services/database';
import type { Category, CreateCategoryInput, TransactionType } from '@/types';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

interface CategoryActions {
  fetchCategories: (type?: TransactionType) => Promise<void>;
  addCategory: (input: CreateCategoryInput) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;
  clearError: () => void;
}

type CategoryStore = CategoryState & CategoryActions;

export const useCategoryStore = create<CategoryStore>()(
  devtools(
    (set, get) => ({
      categories: [],
      isLoading: false,
      error: null,

      fetchCategories: async (type?: TransactionType) => {
        set({ isLoading: true, error: null });
        try {
          let categories: Category[];
          if (type) {
            categories = await db.categories.where('type').equals(type).sortBy('order');
          } else {
            categories = await db.categories.orderBy('order').toArray();
          }
          set({ categories, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch categories:', error);
          set({ error: '카테고리를 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      addCategory: async (input: CreateCategoryInput) => {
        set({ isLoading: true, error: null });
        try {
          const now = new Date();
          const existingCategories = get().categories.filter((c) => c.type === input.type);
          const maxOrder = existingCategories.length > 0
            ? Math.max(...existingCategories.map((c) => c.order))
            : -1;

          const newCategory: Category = {
            ...input,
            id: generateId(),
            order: maxOrder + 1,
            createdAt: now,
            updatedAt: now,
          };

          await db.categories.add(newCategory);

          set((state) => ({
            categories: [...state.categories, newCategory],
            isLoading: false,
          }));

          return newCategory;
        } catch (error) {
          console.error('Failed to add category:', error);
          set({ error: '카테고리 추가에 실패했습니다.', isLoading: false });
          throw error;
        }
      },

      updateCategory: async (id: string, updates: Partial<Category>) => {
        set({ isLoading: true, error: null });
        try {
          const updateData = { ...updates, updatedAt: new Date() };
          await db.categories.update(id, updateData);

          set((state) => ({
            categories: state.categories.map((cat) =>
              cat.id === id ? { ...cat, ...updateData } : cat
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to update category:', error);
          set({ error: '카테고리 수정에 실패했습니다.', isLoading: false });
          throw error;
        }
      },

      deleteCategory: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // Check if category is default (system category)
          const category = get().categories.find((c) => c.id === id);
          if (category?.isDefault) {
            throw new Error('기본 카테고리는 삭제할 수 없습니다.');
          }

          // Check if category has transactions
          const hasTransactions = await db.transactions
            .where('categoryId')
            .equals(id)
            .count();

          if (hasTransactions > 0) {
            throw new Error('이 카테고리에 거래가 있어 삭제할 수 없습니다.');
          }

          await db.categories.delete(id);

          set((state) => ({
            categories: state.categories.filter((cat) => cat.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to delete category:', error);
          set({
            error: error instanceof Error ? error.message : '카테고리 삭제에 실패했습니다.',
            isLoading: false,
          });
          throw error;
        }
      },

      reorderCategories: async (orderedIds: string[]) => {
        set({ isLoading: true, error: null });
        try {
          const now = new Date();
          const updates = orderedIds.map((id, index) => ({
            key: id,
            changes: { order: index, updatedAt: now },
          }));

          await db.categories.bulkUpdate(updates);

          set((state) => ({
            categories: state.categories
              .map((cat) => {
                const newOrder = orderedIds.indexOf(cat.id);
                return newOrder >= 0 ? { ...cat, order: newOrder, updatedAt: now } : cat;
              })
              .sort((a, b) => a.order - b.order),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to reorder categories:', error);
          set({ error: '카테고리 순서 변경에 실패했습니다.', isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'CategoryStore' }
  )
);

// Selectors
export const selectExpenseCategories = (state: CategoryStore) =>
  state.categories.filter((c) => c.type === 'expense');

export const selectIncomeCategories = (state: CategoryStore) =>
  state.categories.filter((c) => c.type === 'income');

export const selectCategoryById = (id: string) => (state: CategoryStore) =>
  state.categories.find((c) => c.id === id);

export const selectCategoryMap = (state: CategoryStore) =>
  new Map(state.categories.map((c) => [c.id, c]));
