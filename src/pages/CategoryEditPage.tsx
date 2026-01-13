import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Bell, BellOff } from 'lucide-react';
import { useCategoryStore, selectExpenseCategories, selectIncomeCategories } from '@/stores/categoryStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useFabStore } from '@/stores/fabStore';
import { Icon } from '@/components/common';
import { DEFAULT_CATEGORY_ALERT_THRESHOLDS } from '@/types';
import type { TransactionType, CategoryAlertSetting } from '@/types';

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

// 알림 임계값 옵션
const THRESHOLD_OPTIONS = [50, 60, 70, 80, 90, 100];

export function CategoryEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') as TransactionType | null;
  const isEditing = !!id;

  const { fetchCategories, addCategory, updateCategory } = useCategoryStore();
  const { fetchSettings, settings, updateSettings } = useSettingsStore();
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
  const [budgetInput, setBudgetInput] = useState(''); // 천단위 구분 표시용
  const [isSaving, setIsSaving] = useState(false);

  // 알림 설정 상태
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alertThresholds, setAlertThresholds] = useState<number[]>([...DEFAULT_CATEGORY_ALERT_THRESHOLDS]);

  // 예산 표시 포맷 (천단위 콤마)
  const formatBudgetDisplay = (value: string) => {
    const num = parseInt(value.replace(/,/g, '')) || 0;
    return num > 0 ? num.toLocaleString() : '';
  };

  // 예산 입력값에서 숫자만 추출
  const parseBudgetInput = (value: string) => {
    return parseInt(value.replace(/[^0-9]/g, '')) || 0;
  };

  useEffect(() => {
    fetchCategories();
    fetchSettings();
  }, [fetchCategories, fetchSettings]);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (isEditing && settings) {
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
        // 예산 입력 필드에 천단위 구분 표시
        setBudgetInput(category.budget && category.budget > 0 ? category.budget.toLocaleString() : '');

        // 기존 알림 설정 로드
        const categoryAlertSettings = settings.categoryAlertSettings || {};
        const existingSetting = categoryAlertSettings[category.id];
        if (existingSetting) {
          setAlertEnabled(existingSetting.enabled);
          setAlertThresholds(existingSetting.thresholds);
        } else {
          // 기본값
          setAlertEnabled(true);
          setAlertThresholds([...DEFAULT_CATEGORY_ALERT_THRESHOLDS]);
        }
      }
    }
  }, [isEditing, id, expenseCategories, incomeCategories, settings]);

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      let categoryId = id;

      if (isEditing && id) {
        await updateCategory(id, {
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          budget: formData.budget,
        });
      } else {
        const categories = categoryType === 'expense' ? expenseCategories : incomeCategories;
        const newCategory = await addCategory({
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          type: categoryType,
          order: categories.length,
          budget: formData.budget,
        });
        categoryId = newCategory.id;
      }

      // 예산이 설정된 경우 알림 설정도 저장
      if (formData.budget && formData.budget > 0 && categoryId && settings) {
        const newAlertSetting: CategoryAlertSetting = {
          enabled: alertEnabled,
          thresholds: alertThresholds,
        };

        await updateSettings({
          categoryAlertSettings: {
            ...settings.categoryAlertSettings,
            [categoryId]: newAlertSetting,
          },
        });
      }

      navigate(-1);
    } finally {
      setIsSaving(false);
    }
  }, [formData, isEditing, id, categoryType, expenseCategories, incomeCategories, updateCategory, addCategory, navigate, isSaving, alertEnabled, alertThresholds, settings, updateSettings]);

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
                type="text"
                inputMode="numeric"
                value={budgetInput}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/[^0-9]/g, '');
                  const formatted = formatBudgetDisplay(rawValue);
                  setBudgetInput(formatted);
                  setFormData((prev) => ({
                    ...prev,
                    budget: rawValue ? parseBudgetInput(rawValue) : undefined,
                  }));
                }}
                placeholder="0"
                className="flex-1 px-4 py-3 bg-paper-light rounded-md text-body text-ink-black outline-none border border-transparent focus:border-ink-mid dark:focus:border-paper-mid text-right"
              />
              <span className="ml-2 text-body text-ink-mid">원</span>
            </div>
          </div>
        )}

        {/* Alert Settings (예산이 설정된 지출 카테고리만) */}
        {categoryType === 'expense' && formData.budget && formData.budget > 0 && (
          <div className="bg-paper-light rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {alertEnabled ? (
                  <Bell size={18} className="text-ink-mid" />
                ) : (
                  <BellOff size={18} className="text-ink-light" />
                )}
                <span className="text-body text-ink-black">예산 알림</span>
              </div>
              <button
                type="button"
                onClick={() => setAlertEnabled(!alertEnabled)}
                className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                  alertEnabled ? 'bg-ink-black' : 'bg-paper-mid'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-paper-white shadow transition-transform ${
                    alertEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {alertEnabled && (
              <div>
                <p className="text-caption text-ink-light mb-2">알림 받을 시점</p>
                <div className="flex flex-wrap gap-2">
                  {THRESHOLD_OPTIONS.map((threshold) => {
                    const isSelected = alertThresholds.includes(threshold);
                    return (
                      <button
                        key={threshold}
                        type="button"
                        onClick={() => {
                          if (isSelected && alertThresholds.length > 1) {
                            setAlertThresholds(alertThresholds.filter((t) => t !== threshold));
                          } else if (!isSelected) {
                            setAlertThresholds([...alertThresholds, threshold].sort((a, b) => a - b));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-caption transition-colors ${
                          isSelected
                            ? 'bg-ink-black text-paper-white'
                            : 'bg-paper-white text-ink-mid border border-paper-dark'
                        }`}
                      >
                        {threshold}%
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
