import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useCategoryStore, selectExpenseCategories, selectIncomeCategories } from '@/stores/categoryStore';
import { useFabStore } from '@/stores/fabStore';
import { Icon } from '@/components/common';
import type { TransactionType } from '@/types';

const AVAILABLE_ICONS = [
  'Utensils', 'Coffee', 'Car', 'ShoppingBag', 'Film', 'Heart', 'Home',
  'Smartphone', 'Plane', 'Gift', 'Book', 'Music', 'Gamepad2', 'Dumbbell',
  'Wallet', 'TrendingUp', 'Building', 'CreditCard', 'Banknote', 'MoreHorizontal'
];

const AVAILABLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#FDA7DF', '#74B9FF', '#A29BFE', '#FD79A8', '#00B894', '#E17055',
  '#4A7C59', '#B8B8B8'
];

export function CategoryEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') as TransactionType | null;
  const isEditing = !!id;

  const { fetchCategories, addCategory, updateCategory } = useCategoryStore();
  const expenseCategories = useCategoryStore(selectExpenseCategories);
  const incomeCategories = useCategoryStore(selectIncomeCategories);
  const { setSubmitHandler, setCanSubmit, reset: resetFab } = useFabStore();

  const [categoryType, setCategoryType] = useState<TransactionType>(typeParam || 'expense');
  const [formData, setFormData] = useState({
    name: '',
    icon: 'MoreHorizontal',
    color: AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)],
    budget: undefined as number | undefined,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (isEditing) {
      const allCategories = [...expenseCategories, ...incomeCategories];
      const category = allCategories.find((c) => c.id === id);
      if (category) {
        setCategoryType(category.type);
        setFormData({
          name: category.name,
          icon: category.icon,
          color: category.color,
          budget: category.budget,
        });
      }
    }
  }, [isEditing, id, expenseCategories, incomeCategories]);

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      if (isEditing && id) {
        await updateCategory(id, {
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          budget: formData.budget,
        });
      } else {
        const categories = categoryType === 'expense' ? expenseCategories : incomeCategories;
        await addCategory({
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          type: categoryType,
          order: categories.length,
          budget: formData.budget,
        });
      }
      navigate(-1);
    } finally {
      setIsSaving(false);
    }
  }, [formData, isEditing, id, categoryType, expenseCategories, incomeCategories, updateCategory, addCategory, navigate, isSaving]);

  const canSubmit = formData.name.trim().length > 0 && !isSaving;

  // FAB 저장 버튼 연동
  useEffect(() => {
    setCanSubmit(canSubmit);
    setSubmitHandler(canSubmit ? handleSubmit : null);

    return () => {
      resetFab();
    };
  }, [canSubmit, handleSubmit, setCanSubmit, setSubmitHandler, resetFab]);

  return (
    <div className="min-h-screen bg-paper-white pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <h1 className="text-title text-ink-black">
          {isEditing ? '카테고리 수정' : '새 카테고리'}
        </h1>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-10 h-10 flex items-center justify-center ${
            canSubmit ? 'text-ink-black' : 'text-ink-light'
          }`}
        >
          <Check size={24} />
        </button>
      </header>

      {/* Form */}
      <div className="p-6 pb-24 space-y-6">
        {/* Name Input */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">이름</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="카테고리 이름"
            className="w-full px-4 py-3 bg-paper-light rounded-md text-body text-ink-black outline-none border border-transparent focus:border-ink-mid dark:focus:border-paper-mid"
            autoFocus
          />
        </div>

        {/* Budget Input (지출 카테고리만) */}
        {categoryType === 'expense' && (
          <div>
            <label className="text-sub text-ink-mid block mb-2">예산 (선택)</label>
            <div className="flex items-center">
              <input
                type="number"
                value={formData.budget || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="0"
                className="flex-1 px-4 py-3 bg-paper-light rounded-md text-body text-ink-black outline-none border border-transparent focus:border-ink-mid dark:focus:border-paper-mid"
              />
              <span className="ml-2 text-body text-ink-mid">원</span>
            </div>
          </div>
        )}

        {/* Icon Picker */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">아이콘</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_ICONS.map((iconName) => (
              <button
                key={iconName}
                onClick={() => setFormData((prev) => ({ ...prev, icon: iconName }))}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  formData.icon === iconName
                    ? 'bg-ink-black dark:bg-pig-pink'
                    : 'bg-paper-light'
                }`}
              >
                <Icon
                  name={iconName}
                  size={24}
                  className={formData.icon === iconName
                    ? 'text-paper-white'
                    : 'text-ink-mid'
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">색상</label>
          <div className="flex flex-wrap gap-3">
            {AVAILABLE_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setFormData((prev) => ({ ...prev, color }))}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  formData.color === color
                    ? 'ring-2 ring-offset-2 ring-ink-black dark:ring-paper-white dark:ring-offset-ink-black'
                    : ''
                }`}
                style={{ backgroundColor: color }}
              >
                {formData.color === color && <Check size={18} className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">미리보기</label>
          <div className="flex items-center gap-3 p-4 bg-paper-light rounded-md">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: formData.color + '20' }}
            >
              <Icon name={formData.icon} size={20} style={{ color: formData.color }} />
            </div>
            <div>
              <p className="text-body text-ink-black">
                {formData.name || '카테고리 이름'}
              </p>
              {categoryType === 'expense' && formData.budget && formData.budget > 0 && (
                <p className="text-caption text-ink-mid">
                  예산: {formData.budget.toLocaleString()}원
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
