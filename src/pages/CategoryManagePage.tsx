import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, GripVertical } from 'lucide-react';
import { useCategoryStore, selectExpenseCategories, selectIncomeCategories } from '@/stores/categoryStore';
import { Icon, SwipeToDelete } from '@/components/common';
import type { Category, TransactionType } from '@/types';

export function CategoryManagePage() {
  const navigate = useNavigate();
  const { fetchCategories, deleteCategory, reorderCategories, error } = useCategoryStore();
  const expenseCategories = useCategoryStore(selectExpenseCategories);
  const incomeCategories = useCategoryStore(selectIncomeCategories);

  const [activeTab, setActiveTab] = useState<TransactionType>('expense');

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const dragStartY = useRef<number>(0);
  const draggedElement = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const displayCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  useEffect(() => {
    setLocalCategories(displayCategories);
  }, [displayCategories]);

  const goToAdd = () => {
    navigate(`/settings/categories/new?type=${activeTab}`);
  };

  const goToEdit = (category: Category) => {
    navigate(`/settings/categories/${category.id}/edit`);
  };

  const handleDelete = async (category: Category, skipConfirm = false) => {
    if (category.isDefault) {
      alert('기본 카테고리는 삭제할 수 없습니다.');
      return;
    }

    if (!skipConfirm) {
      const confirmed = window.confirm(`"${category.name}" 카테고리를 삭제하시겠습니까?`);
      if (!confirmed) return;
    }

    try {
      await deleteCategory(category.id);
    } catch {
      // Error is handled in store
    }
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent, category: Category) => {
    const target = e.currentTarget as HTMLDivElement;
    const touch = e.touches[0];

    // Only start drag if touching the grip handle area (first 44px)
    const rect = target.getBoundingClientRect();
    if (touch.clientX - rect.left > 44) return;

    setDraggedId(category.id);
    dragStartY.current = touch.clientY;
    draggedElement.current = target;
    target.style.opacity = '0.7';
    target.style.transform = 'scale(1.02)';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedId) return;

    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);

    for (const el of elements) {
      const id = (el as HTMLElement).dataset?.categoryId;
      if (id && id !== draggedId) {
        setDragOverId(id);
        break;
      }
    }
  };

  const handleTouchEnd = async () => {
    if (draggedElement.current) {
      draggedElement.current.style.opacity = '1';
      draggedElement.current.style.transform = '';
    }

    if (draggedId && dragOverId && draggedId !== dragOverId) {
      const fromIndex = localCategories.findIndex(c => c.id === draggedId);
      const toIndex = localCategories.findIndex(c => c.id === dragOverId);

      if (fromIndex !== -1 && toIndex !== -1) {
        const newCategories = [...localCategories];
        const [removed] = newCategories.splice(fromIndex, 1);
        newCategories.splice(toIndex, 0, removed);
        setLocalCategories(newCategories);
        await reorderCategories(newCategories.map(c => c.id));
      }
    }

    setDraggedId(null);
    setDragOverId(null);
    draggedElement.current = null;
  };

  // Mouse drag handlers
  const handleDragStart = (e: React.DragEvent, category: Category) => {
    setDraggedId(category.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', category.id);
    (e.currentTarget as HTMLDivElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLDivElement).style.opacity = '1';
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, category: Category) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && category.id !== draggedId) {
      setDragOverId(category.id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault();

    if (!draggedId || draggedId === targetCategory.id) {
      setDragOverId(null);
      return;
    }

    const fromIndex = localCategories.findIndex(c => c.id === draggedId);
    const toIndex = localCategories.findIndex(c => c.id === targetCategory.id);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newCategories = [...localCategories];
      const [removed] = newCategories.splice(fromIndex, 1);
      newCategories.splice(toIndex, 0, removed);
      setLocalCategories(newCategories);
      await reorderCategories(newCategories.map(c => c.id));
    }

    setDragOverId(null);
  };

  return (
    <div className="min-h-screen bg-paper-white dark:bg-ink-black pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid dark:border-ink-dark">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center"
        >
          <ArrowLeft size={24} className="text-ink-black dark:text-paper-white" />
        </button>
        <h1 className="text-title text-ink-black dark:text-paper-white">카테고리 관리</h1>
        <button
          onClick={goToAdd}
          className="w-10 h-10 flex items-center justify-center"
        >
          <Plus size={24} className="text-ink-black dark:text-paper-white" />
        </button>
      </header>

      {/* Tab Bar */}
      <div className="flex border-b border-paper-mid dark:border-ink-dark">
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-3 text-center text-body transition-colors ${
            activeTab === 'expense'
              ? 'text-ink-black dark:text-paper-white border-b-2 border-ink-black dark:border-paper-white'
              : 'text-ink-mid'
          }`}
        >
          지출
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-3 text-center text-body transition-colors ${
            activeTab === 'income'
              ? 'text-ink-black dark:text-paper-white border-b-2 border-ink-black dark:border-paper-white'
              : 'text-ink-mid'
          }`}
        >
          수입
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sub text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Drag instruction */}
      {localCategories.length > 1 && (
        <div className="px-6 py-2 bg-paper-light dark:bg-ink-dark">
          <p className="text-caption text-ink-mid text-center">
            ≡ 아이콘을 드래그하여 순서를 변경할 수 있습니다
          </p>
        </div>
      )}

      {/* Category List */}
      <div className="px-6 pt-4">
        {localCategories.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-body text-ink-light">카테고리가 없습니다</p>
            <button
              onClick={goToAdd}
              className="mt-4 px-4 py-2 bg-ink-black dark:bg-pig-pink text-paper-white rounded-md text-body"
            >
              카테고리 추가
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {localCategories.map((category) => (
              <SwipeToDelete
                key={category.id}
                onDelete={() => handleDelete(category, true)}
                confirmMessage={`"${category.name}" 카테고리를 삭제하시겠습니까?`}
                disabled={category.isDefault}
              >
                <div
                  data-category-id={category.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, category)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, category)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, category)}
                  onTouchStart={(e) => handleTouchStart(e, category)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`flex items-center gap-3 p-4 bg-paper-light dark:bg-ink-dark rounded-md transition-all cursor-grab active:cursor-grabbing ${
                    draggedId === category.id ? 'opacity-50 scale-[1.02]' : ''
                  } ${
                    dragOverId === category.id ? 'ring-2 ring-ink-black dark:ring-paper-white' : ''
                  }`}
                >
                  <div
                    data-grip
                    className="touch-none cursor-grab active:cursor-grabbing p-1"
                  >
                    <GripVertical size={20} className="text-ink-light" />
                  </div>

                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    <Icon name={category.icon} size={20} style={{ color: category.color }} />
                  </div>

                  <div className="flex-1 min-w-0" onClick={() => goToEdit(category)}>
                    <p className="text-body text-ink-black dark:text-paper-white truncate">{category.name}</p>
                    {category.budget && category.budget > 0 && (
                      <p className="text-caption text-ink-mid">
                        예산: {category.budget.toLocaleString()}원
                      </p>
                    )}
                    {category.isDefault && (
                      <p className="text-caption text-ink-light">기본</p>
                    )}
                  </div>
                </div>
              </SwipeToDelete>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <section className="px-6 py-4 mt-4">
        <div className="p-4 bg-paper-light dark:bg-ink-dark rounded-md">
          <p className="text-caption text-ink-mid">
            카테고리 순서를 변경하면 거래 입력 시 표시되는 순서가 바뀝니다.
            {activeTab === 'expense' && ' 지출 카테고리에는 예산을 설정할 수 있습니다.'}
          </p>
        </div>
      </section>
    </div>
  );
}
