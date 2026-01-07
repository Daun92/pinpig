import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, GripVertical, Trash2, Edit2 } from 'lucide-react';
import { useCategoryStore, selectExpenseCategories, selectIncomeCategories } from '@/stores/categoryStore';
import { Icon } from '@/components/common/Icon';
import type { Category, TransactionType } from '@/types';

// Lucide 아이콘 선택용 리스트
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

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  budget?: number;
}

export function CategoryManagePage() {
  const navigate = useNavigate();
  const { fetchCategories, addCategory, updateCategory, deleteCategory, error, clearError } = useCategoryStore();
  const expenseCategories = useCategoryStore(selectExpenseCategories);
  const incomeCategories = useCategoryStore(selectIncomeCategories);

  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    icon: 'MoreHorizontal',
    color: '#B8B8B8',
    budget: undefined
  });

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const displayCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  const handleOpenForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        icon: category.icon,
        color: category.color,
        budget: category.budget
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        icon: 'MoreHorizontal',
        color: AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)],
        budget: undefined
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', icon: 'MoreHorizontal', color: '#B8B8B8', budget: undefined });
    clearError();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          budget: formData.budget
        });
      } else {
        await addCategory({
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          type: activeTab,
          order: displayCategories.length,
          budget: formData.budget
        });
      }
      handleCloseForm();
    } catch (err) {
      // Error is handled in store
    }
  };

  const handleDelete = async (category: Category) => {
    if (category.isDefault) {
      alert('기본 카테고리는 삭제할 수 없습니다.');
      return;
    }

    const confirmed = window.confirm(`"${category.name}" 카테고리를 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      await deleteCategory(category.id);
    } catch (err) {
      // Error is handled in store
    }
  };

  return (
    <div className="min-h-screen bg-paper-white pb-20">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center"
        >
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <h1 className="text-title text-ink-black">카테고리 관리</h1>
        <button
          onClick={() => handleOpenForm()}
          className="w-10 h-10 flex items-center justify-center"
        >
          <Plus size={24} className="text-ink-black" />
        </button>
      </header>

      {/* Tab Bar */}
      <div className="flex border-b border-paper-mid">
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-3 text-center text-body ${
            activeTab === 'expense' ? 'text-ink-black border-b-2 border-ink-black' : 'text-ink-mid'
          }`}
        >
          지출
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-3 text-center text-body ${
            activeTab === 'income' ? 'text-ink-black border-b-2 border-ink-black' : 'text-ink-mid'
          }`}
        >
          수입
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sub text-red-600">{error}</p>
        </div>
      )}

      {/* Category List */}
      <div className="px-6 pt-4">
        {displayCategories.map((category) => (
          <div
            key={category.id}
            className="flex items-center py-4 border-b border-paper-mid"
          >
            <GripVertical size={20} className="text-ink-light mr-3" />

            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: category.color + '20' }}
            >
              <Icon name={category.icon} size={20} className="text-ink-dark" />
            </div>

            <div className="flex-1">
              <p className="text-body text-ink-black">{category.name}</p>
              {category.budget && category.budget > 0 && (
                <p className="text-caption text-ink-mid">
                  예산: {category.budget.toLocaleString()}원
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenForm(category)}
                className="w-8 h-8 flex items-center justify-center"
              >
                <Edit2 size={16} className="text-ink-mid" />
              </button>
              {!category.isDefault && (
                <button
                  onClick={() => handleDelete(category)}
                  className="w-8 h-8 flex items-center justify-center"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              )}
            </div>
          </div>
        ))}

        {displayCategories.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-body text-ink-light">카테고리가 없습니다</p>
            <p className="text-sub text-ink-light mt-2">+ 버튼을 눌러 추가해보세요</p>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseForm}
          />

          <div className="relative w-full max-w-lg bg-paper-white rounded-t-2xl animate-slide-up">
            <div className="p-6">
              <h2 className="text-title text-ink-black mb-6">
                {editingCategory ? '카테고리 수정' : '새 카테고리'}
              </h2>

              {/* Name Input */}
              <div className="mb-6">
                <label className="text-sub text-ink-mid block mb-2">이름</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="카테고리 이름"
                  className="w-full px-4 py-3 bg-paper-light rounded-md text-body text-ink-black outline-none"
                  autoFocus
                />
              </div>

              {/* Budget Input (지출 카테고리만) */}
              {activeTab === 'expense' && (
                <div className="mb-6">
                  <label className="text-sub text-ink-mid block mb-2">예산 (선택)</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={formData.budget || ''}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="0"
                      className="flex-1 px-4 py-3 bg-paper-light rounded-md text-body text-ink-black outline-none"
                    />
                    <span className="ml-2 text-body text-ink-mid">원</span>
                  </div>
                </div>
              )}

              {/* Icon Picker */}
              <div className="mb-6">
                <label className="text-sub text-ink-mid block mb-2">아이콘</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        formData.icon === icon ? 'bg-ink-black' : 'bg-paper-light'
                      }`}
                    >
                      <Icon
                        name={icon}
                        size={20}
                        className={formData.icon === icon ? 'text-paper-white' : 'text-ink-mid'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div className="mb-8">
                <label className="text-sub text-ink-mid block mb-2">색상</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-ink-black' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseForm}
                  className="flex-1 py-3 bg-paper-light rounded-md text-body text-ink-mid"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.name.trim()}
                  className={`flex-1 py-3 rounded-md text-body ${
                    formData.name.trim()
                      ? 'bg-ink-black text-paper-white'
                      : 'bg-paper-mid text-ink-light'
                  }`}
                >
                  {editingCategory ? '수정' : '추가'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
