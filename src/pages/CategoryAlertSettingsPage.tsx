import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, ChevronRight } from 'lucide-react';
import { useCategoryStore, selectExpenseCategories } from '@/stores/categoryStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Icon } from '@/components/common';
import { DEFAULT_CATEGORY_ALERT_THRESHOLDS } from '@/types';
import type { CategoryAlertSetting } from '@/types';

// 선택 가능한 임계값 옵션
const THRESHOLD_OPTIONS = [50, 60, 70, 80, 90, 100];

interface CategoryAlertEntry {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budget: number;
  alertSetting: CategoryAlertSetting;
}

export function CategoryAlertSettingsPage() {
  const navigate = useNavigate();

  // Stores
  const { fetchCategories } = useCategoryStore();
  const { fetchSettings, settings, updateSettings } = useSettingsStore();
  const expenseCategories = useCategoryStore(selectExpenseCategories);

  // Local state
  const [categoryData, setCategoryData] = useState<CategoryAlertEntry[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  // 마스터 토글 상태
  const masterEnabled = settings?.categoryAlertEnabled ?? true;

  useEffect(() => {
    fetchSettings();
    fetchCategories();
  }, [fetchSettings, fetchCategories]);

  // Initialize category data from store
  useEffect(() => {
    if (expenseCategories.length === 0 || !settings) return;

    const categoryAlertSettings = settings.categoryAlertSettings || {};

    // 예산이 설정된 카테고리만 필터링
    const categoriesWithBudget = expenseCategories.filter((cat) => cat.budget && cat.budget > 0);

    const data: CategoryAlertEntry[] = categoriesWithBudget.map((cat) => {
      const existingSetting = categoryAlertSettings[cat.id];
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        budget: cat.budget || 0,
        alertSetting: existingSetting || {
          enabled: true,
          thresholds: [...DEFAULT_CATEGORY_ALERT_THRESHOLDS],
        },
      };
    });

    setCategoryData(data);
  }, [expenseCategories, settings]);

  // 마스터 토글 변경
  const handleMasterToggle = async () => {
    const newValue = !masterEnabled;
    await updateSettings({ categoryAlertEnabled: newValue });
  };

  // 개별 카테고리 토글
  const handleCategoryToggle = async (categoryId: string) => {
    const category = categoryData.find((c) => c.categoryId === categoryId);
    if (!category) return;

    const newEnabled = !category.alertSetting.enabled;
    const newSetting: CategoryAlertSetting = {
      ...category.alertSetting,
      enabled: newEnabled,
    };

    // Local state 업데이트
    setCategoryData((prev) =>
      prev.map((c) =>
        c.categoryId === categoryId ? { ...c, alertSetting: newSetting } : c
      )
    );

    // DB 저장
    const currentSettings = settings?.categoryAlertSettings || {};
    await updateSettings({
      categoryAlertSettings: {
        ...currentSettings,
        [categoryId]: newSetting,
      },
    });
  };

  // 임계값 토글
  const handleThresholdToggle = async (categoryId: string, threshold: number) => {
    const category = categoryData.find((c) => c.categoryId === categoryId);
    if (!category) return;

    const currentThresholds = category.alertSetting.thresholds;
    let newThresholds: number[];

    if (currentThresholds.includes(threshold)) {
      // 제거 (최소 1개는 유지)
      if (currentThresholds.length > 1) {
        newThresholds = currentThresholds.filter((t) => t !== threshold);
      } else {
        return; // 최소 1개 유지
      }
    } else {
      // 추가
      newThresholds = [...currentThresholds, threshold].sort((a, b) => a - b);
    }

    const newSetting: CategoryAlertSetting = {
      ...category.alertSetting,
      thresholds: newThresholds,
    };

    // Local state 업데이트
    setCategoryData((prev) =>
      prev.map((c) =>
        c.categoryId === categoryId ? { ...c, alertSetting: newSetting } : c
      )
    );

    // DB 저장
    const currentSettings = settings?.categoryAlertSettings || {};
    await updateSettings({
      categoryAlertSettings: {
        ...currentSettings,
        [categoryId]: newSetting,
      },
    });
  };

  // 카테고리 확장/축소 토글
  const handleExpandToggle = (categoryId: string) => {
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  // 예산 없는 카테고리 안내
  const categoriesWithoutBudget = expenseCategories.filter(
    (cat) => !cat.budget || cat.budget <= 0
  );

  return (
    <div className="min-h-screen bg-paper-white pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center"
        >
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <h1 className="text-title text-ink-black">카테고리별 알림</h1>
        <div className="w-10" />
      </header>

      {/* Master Toggle */}
      <section className="px-6 pt-6">
        <div className="bg-paper-light rounded-lg p-4">
          <button
            onClick={handleMasterToggle}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {masterEnabled ? (
                <Bell size={20} className="text-ink-mid" />
              ) : (
                <BellOff size={20} className="text-ink-light" />
              )}
              <div>
                <p className="text-body text-ink-black text-left">카테고리 예산 알림</p>
                <p className="text-caption text-ink-light text-left mt-0.5">
                  개별 카테고리 예산 도달 시 알림
                </p>
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                masterEnabled ? 'bg-ink-black' : 'bg-paper-mid'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-paper-white shadow transition-transform ${
                  masterEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>
      </section>

      {/* Category List */}
      {masterEnabled && (
        <section className="px-6 pt-6">
          <h2 className="text-sub text-ink-light mb-3">
            카테고리별 설정
            <span className="text-caption ml-2">
              (예산 설정된 카테고리만 표시)
            </span>
          </h2>

          {categoryData.length === 0 ? (
            <div className="bg-paper-light rounded-lg p-6 text-center">
              <p className="text-body text-ink-mid">
                예산이 설정된 카테고리가 없습니다
              </p>
              <button
                onClick={() => navigate('/settings/category-budget')}
                className="mt-3 text-sub text-ink-black underline"
              >
                카테고리 예산 설정하기
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {categoryData.map((category) => {
                const isExpanded = expandedCategoryId === category.categoryId;
                const isEnabled = category.alertSetting.enabled;

                return (
                  <div
                    key={category.categoryId}
                    className="bg-paper-light rounded-lg overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="p-4 flex items-center justify-between">
                      <button
                        onClick={() => handleExpandToggle(category.categoryId)}
                        className="flex-1 flex items-center gap-3"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: category.categoryColor + '20' }}
                        >
                          <Icon
                            name={category.categoryIcon}
                            size={20}
                            style={{ color: category.categoryColor }}
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-body text-ink-black">
                            {category.categoryName}
                          </p>
                          <p className="text-caption text-ink-light">
                            예산 {category.budget.toLocaleString()}원
                            {isEnabled && (
                              <span className="ml-2">
                                · {category.alertSetting.thresholds.join(', ')}%
                              </span>
                            )}
                          </p>
                        </div>
                        <ChevronRight
                          size={20}
                          className={`text-ink-light transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>

                      {/* Toggle */}
                      <button
                        onClick={() => handleCategoryToggle(category.categoryId)}
                        className={`ml-3 w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                          isEnabled ? 'bg-ink-black' : 'bg-paper-mid'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-paper-white shadow transition-transform ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Expanded Threshold Selection */}
                    {isExpanded && isEnabled && (
                      <div className="px-4 pb-4 border-t border-paper-mid pt-3">
                        <p className="text-sub text-ink-mid mb-3">
                          알림 받을 시점 선택
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {THRESHOLD_OPTIONS.map((threshold) => {
                            const isSelected =
                              category.alertSetting.thresholds.includes(threshold);
                            return (
                              <button
                                key={threshold}
                                onClick={() =>
                                  handleThresholdToggle(category.categoryId, threshold)
                                }
                                className={`px-4 py-2 rounded-full text-sub transition-colors ${
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
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Categories without budget info */}
      {masterEnabled && categoriesWithoutBudget.length > 0 && categoryData.length > 0 && (
        <section className="px-6 pt-6 pb-8">
          <p className="text-caption text-ink-light mb-2">
            예산 미설정 카테고리 ({categoriesWithoutBudget.length}개)
          </p>
          <div className="flex flex-wrap gap-2">
            {categoriesWithoutBudget.slice(0, 5).map((cat) => (
              <span
                key={cat.id}
                className="px-3 py-1 bg-paper-light rounded-full text-caption text-ink-mid"
              >
                {cat.name}
              </span>
            ))}
            {categoriesWithoutBudget.length > 5 && (
              <span className="px-3 py-1 text-caption text-ink-light">
                +{categoriesWithoutBudget.length - 5}개
              </span>
            )}
          </div>
          <button
            onClick={() => navigate('/settings/category-budget')}
            className="mt-3 text-sub text-ink-black underline"
          >
            카테고리 예산 설정하기
          </button>
        </section>
      )}
    </div>
  );
}
