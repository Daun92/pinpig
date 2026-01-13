import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, RefreshCw, Equal } from 'lucide-react';
import { useCategoryStore, selectExpenseCategories } from '@/stores/categoryStore';
import { useSettingsStore, selectMonthlyBudget } from '@/stores/settingsStore';
import { Icon, SegmentedControl } from '@/components/common';

type InputMode = 'amount' | 'percent';

interface CategoryBudgetEntry {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budget: number;
  percentage: number;
  isDefault?: boolean;
}

export function CategoryBudgetPage() {
  const navigate = useNavigate();

  // Stores
  const { fetchCategories, updateCategory } = useCategoryStore();
  const { fetchSettings, setMonthlyBudget } = useSettingsStore();
  const expenseCategories = useCategoryStore(selectExpenseCategories);
  const monthlyBudget = useSettingsStore(selectMonthlyBudget);

  // Local state
  const [totalBudgetInput, setTotalBudgetInput] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('amount');
  const [categoryData, setCategoryData] = useState<CategoryBudgetEntry[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // 초기 로드 여부 추적
  const isInitialLoad = useRef(true);

  // Mode options for SegmentedControl
  const modeOptions: { value: InputMode; label: string }[] = [
    { value: 'amount', label: '금액' },
    { value: 'percent', label: '%' },
  ];

  useEffect(() => {
    fetchSettings();
    fetchCategories();
  }, [fetchSettings, fetchCategories]);

  useEffect(() => {
    setTotalBudgetInput(monthlyBudget > 0 ? monthlyBudget.toLocaleString() : '');
  }, [monthlyBudget]);

  // Initialize category data from store (초기 로드 또는 카테고리 추가/삭제 시에만)
  useEffect(() => {
    if (expenseCategories.length === 0) return;

    setCategoryData((prev) => {
      // 초기 로드 시에만 전체 설정
      if (isInitialLoad.current || prev.length === 0) {
        isInitialLoad.current = false;
        return expenseCategories.map((cat) => {
          const budget = cat.budget || 0;
          const percentage = monthlyBudget > 0
            ? Math.round((budget / monthlyBudget) * 1000) / 10
            : 0;
          return {
            categoryId: cat.id,
            categoryName: cat.name,
            categoryIcon: cat.icon,
            categoryColor: cat.color,
            budget,
            percentage,
            isDefault: cat.isDefault,
          };
        });
      }

      // 이후에는 새 카테고리만 추가, 삭제된 카테고리만 제거, 기존 값 유지
      const existingIds = new Set(prev.map((c) => c.categoryId));
      const newCategoryIds = new Set(expenseCategories.map((c) => c.id));

      // 삭제된 카테고리 제거
      const filtered = prev.filter((c) => newCategoryIds.has(c.categoryId));

      // 새 카테고리 추가
      const newCategories = expenseCategories
        .filter((cat) => !existingIds.has(cat.id))
        .map((cat) => {
          const budget = cat.budget || 0;
          const percentage = monthlyBudget > 0
            ? Math.round((budget / monthlyBudget) * 1000) / 10
            : 0;
          return {
            categoryId: cat.id,
            categoryName: cat.name,
            categoryIcon: cat.icon,
            categoryColor: cat.color,
            budget,
            percentage,
            isDefault: cat.isDefault,
          };
        });

      return [...filtered, ...newCategories];
    });
  }, [expenseCategories, monthlyBudget]);

  // 숫자 포맷팅
  const formatNumber = (value: string) => {
    const num = parseInt(value.replace(/,/g, '')) || 0;
    return num > 0 ? num.toLocaleString() : '';
  };

  const parseNumber = (value: string) => {
    return parseInt(value.replace(/[^0-9]/g, '')) || 0;
  };

  // 총 예산 변경 핸들러
  const handleTotalBudgetChange = (value: string) => {
    const formatted = formatNumber(value);
    setTotalBudgetInput(formatted);
  };

  // 총 예산 저장
  const handleSaveTotalBudget = async () => {
    const newBudget = parseNumber(totalBudgetInput);
    try {
      await setMonthlyBudget(newBudget);
    } catch (error) {
      console.error('Failed to save total budget:', error);
    }
  };

  // 비율대로 배분 (현재 비율 유지하며 총 예산에 맞게 재계산)
  const handleDistributeByRatio = useCallback(async () => {
    if (monthlyBudget <= 0) return;

    const updatedData = categoryData.map((cat) => ({
      ...cat,
      budget: Math.round((cat.percentage / 100) * monthlyBudget),
    }));

    setCategoryData(updatedData);

    // DB에 저장
    try {
      for (const cat of updatedData) {
        await updateCategory(cat.categoryId, { budget: cat.budget });
      }
    } catch (error) {
      console.error('Failed to distribute budgets:', error);
    }
  }, [categoryData, monthlyBudget, updateCategory]);

  // 균등 배분 (모든 카테고리에 동일 금액)
  const handleDistributeEvenly = useCallback(async () => {
    if (monthlyBudget <= 0 || categoryData.length === 0) return;

    const evenAmount = Math.floor(monthlyBudget / categoryData.length);
    const evenPercentage = Math.round((100 / categoryData.length) * 10) / 10;

    const updatedData = categoryData.map((cat) => ({
      ...cat,
      budget: evenAmount,
      percentage: evenPercentage,
    }));

    setCategoryData(updatedData);

    // DB에 저장
    try {
      for (const cat of updatedData) {
        await updateCategory(cat.categoryId, { budget: cat.budget });
      }
    } catch (error) {
      console.error('Failed to distribute budgets evenly:', error);
    }
  }, [categoryData, monthlyBudget, updateCategory]);

  // 금액 모드에서 카테고리 예산 변경
  const handleAmountChange = (categoryId: string, value: string) => {
    const newBudget = parseNumber(value);
    const newPercentage = monthlyBudget > 0
      ? Math.round((newBudget / monthlyBudget) * 1000) / 10
      : 0;

    setCategoryData((prev) =>
      prev.map((cat) =>
        cat.categoryId === categoryId
          ? { ...cat, budget: newBudget, percentage: newPercentage }
          : cat
      )
    );
  };

  // % 모드에서 카테고리 예산 변경
  const handlePercentChange = (categoryId: string, value: string) => {
    const newPercentage = Math.min(100, Math.max(0, parseFloat(value) || 0));
    const newBudget = Math.round((newPercentage / 100) * monthlyBudget);

    setCategoryData((prev) =>
      prev.map((cat) =>
        cat.categoryId === categoryId
          ? { ...cat, budget: newBudget, percentage: newPercentage }
          : cat
      )
    );
  };

  // 카테고리 예산 저장
  const handleSaveCategoryBudget = async (categoryId: string) => {
    const cat = categoryData.find((c) => c.categoryId === categoryId);
    if (!cat) return;

    try {
      await updateCategory(categoryId, { budget: cat.budget });
      setEditingCategoryId(null);
    } catch (error) {
      console.error('Failed to save category budget:', error);
    }
  };

  // 합계 계산
  const totalCategoryBudgets = categoryData.reduce((sum, cat) => sum + cat.budget, 0);
  const totalPercentage = categoryData.reduce((sum, cat) => sum + cat.percentage, 0);
  const budgetDifference = monthlyBudget - totalCategoryBudgets;

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
        <h1 className="text-title text-ink-black">카테고리별 예산</h1>
        <div className="w-10" />
      </header>

      {/* Total Budget Section */}
      <section className="px-6 pt-6">
        <h2 className="text-sub text-ink-light mb-2">총 예산</h2>
        <div className="bg-paper-light dark:bg-ink-dark/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-body text-ink-black">월 예산</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={totalBudgetInput}
                onChange={(e) => handleTotalBudgetChange(e.target.value)}
                onBlur={handleSaveTotalBudget}
                placeholder="0"
                className="w-32 text-right bg-transparent text-body text-ink-black font-medium outline-none"
              />
              <span className="text-body text-ink-mid">원</span>
            </div>
          </div>
        </div>
      </section>

      {/* Distribution Settings Section */}
      <section className="px-6 pt-6">
        <h2 className="text-sub text-ink-light mb-2">배분 설정</h2>
        <div className="space-y-4">
          {/* Mode Selection */}
          <SegmentedControl
            options={modeOptions}
            value={inputMode}
            onChange={setInputMode}
          />

          {/* Quick Distribution Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDistributeByRatio}
              disabled={monthlyBudget <= 0 || totalPercentage <= 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-paper-light rounded-lg text-body text-ink-black hover:bg-paper-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className="text-ink-mid" />
              <span>비율대로 배분</span>
            </button>
            <button
              onClick={handleDistributeEvenly}
              disabled={monthlyBudget <= 0 || categoryData.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-paper-light rounded-lg text-body text-ink-black hover:bg-paper-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Equal size={16} className="text-ink-mid" />
              <span>균등 배분</span>
            </button>
          </div>
        </div>
      </section>

      {/* Category Budgets Section */}
      <section className="px-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sub text-ink-light">카테고리별 예산</h2>
          <span className="text-caption text-ink-light">
            슬라이드 또는 탭하여 수정
          </span>
        </div>

        <div className="space-y-2">
          {categoryData.map((category) => (
              <div key={category.categoryId} className="bg-paper-light dark:bg-ink-dark/30 rounded-lg p-4">
                {/* Category Info Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
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
                    <span className="text-body text-ink-black">{category.categoryName}</span>
                  </div>

                  {editingCategoryId === category.categoryId ? (
                    <div className="flex items-center gap-2">
                      {inputMode === 'amount' ? (
                        <>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={category.budget > 0 ? category.budget.toLocaleString() : ''}
                            onChange={(e) =>
                              handleAmountChange(category.categoryId, e.target.value)
                            }
                            onBlur={() => handleSaveCategoryBudget(category.categoryId)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveCategoryBudget(category.categoryId);
                              }
                            }}
                            autoFocus
                            className="w-24 text-right bg-paper-white dark:bg-ink-dark px-2 py-1 rounded text-body text-ink-black outline-none border border-ink-light"
                          />
                          <span className="text-body text-ink-mid">원</span>
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={category.percentage > 0 ? category.percentage : ''}
                            onChange={(e) =>
                              handlePercentChange(category.categoryId, e.target.value)
                            }
                            onBlur={() => handleSaveCategoryBudget(category.categoryId)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveCategoryBudget(category.categoryId);
                              }
                            }}
                            autoFocus
                            className="w-16 text-right bg-paper-white dark:bg-ink-dark px-2 py-1 rounded text-body text-ink-black outline-none border border-ink-light"
                          />
                          <span className="text-body text-ink-mid">%</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingCategoryId(category.categoryId)}
                      className="flex items-center gap-1 py-1 px-2 rounded hover:bg-paper-mid dark:hover:bg-ink-dark/50"
                    >
                      {inputMode === 'amount' ? (
                        <>
                          <span className="text-body text-ink-black font-medium">
                            {category.budget > 0
                              ? `${category.budget.toLocaleString()}원`
                              : '설정'}
                          </span>
                          {category.percentage > 0 && (
                            <span className="text-caption text-ink-light ml-1">
                              ({category.percentage}%)
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-body text-ink-black font-medium">
                            {category.percentage > 0
                              ? `${category.percentage}%`
                              : '설정'}
                          </span>
                          {category.budget > 0 && (
                            <span className="text-caption text-ink-light ml-1">
                              ({category.budget.toLocaleString()}원)
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Slider */}
                <div className="relative">
                  {inputMode === 'amount' ? (
                    <>
                      <input
                        type="range"
                        min={0}
                        max={monthlyBudget > 0 ? monthlyBudget : 1000000}
                        step={10000}
                        value={category.budget}
                        onChange={(e) => {
                          const newBudget = parseInt(e.target.value);
                          const newPercentage = monthlyBudget > 0
                            ? Math.round((newBudget / monthlyBudget) * 1000) / 10
                            : 0;
                          setCategoryData((prev) =>
                            prev.map((cat) =>
                              cat.categoryId === category.categoryId
                                ? { ...cat, budget: newBudget, percentage: newPercentage }
                                : cat
                            )
                          );
                        }}
                        onMouseUp={() => handleSaveCategoryBudget(category.categoryId)}
                        onTouchEnd={() => handleSaveCategoryBudget(category.categoryId)}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:opacity-0 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:opacity-0"
                        style={{
                          background: monthlyBudget > 0
                            ? `linear-gradient(to right, ${category.categoryColor} 0%, ${category.categoryColor} ${(category.budget / monthlyBudget) * 100}%, var(--color-paper-mid) ${(category.budget / monthlyBudget) * 100}%, var(--color-paper-mid) 100%)`
                            : 'var(--color-paper-mid)',
                        }}
                      />
                      {/* Thumb indicator */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-paper-white shadow-md pointer-events-none"
                        style={{
                          left: `calc(${monthlyBudget > 0 ? (category.budget / monthlyBudget) * 100 : 0}% - 10px)`,
                          backgroundColor: category.categoryColor,
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={0.5}
                        value={category.percentage}
                        onChange={(e) => {
                          const newPercentage = parseFloat(e.target.value);
                          const newBudget = Math.round((newPercentage / 100) * monthlyBudget);
                          setCategoryData((prev) =>
                            prev.map((cat) =>
                              cat.categoryId === category.categoryId
                                ? { ...cat, budget: newBudget, percentage: newPercentage }
                                : cat
                            )
                          );
                        }}
                        onMouseUp={() => handleSaveCategoryBudget(category.categoryId)}
                        onTouchEnd={() => handleSaveCategoryBudget(category.categoryId)}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:opacity-0 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:opacity-0"
                        style={{
                          background: `linear-gradient(to right, ${category.categoryColor} 0%, ${category.categoryColor} ${category.percentage}%, var(--color-paper-mid) ${category.percentage}%, var(--color-paper-mid) 100%)`,
                        }}
                      />
                      {/* Thumb indicator */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-paper-white shadow-md pointer-events-none"
                        style={{
                          left: `calc(${category.percentage}% - 10px)`,
                          backgroundColor: category.categoryColor,
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
          ))}
        </div>
      </section>

      {/* Summary Section */}
      <section className="px-6 pt-6">
        <div className="bg-paper-light dark:bg-ink-dark/30 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <span className="text-body text-ink-mid">총 예산</span>
            <span className="text-body text-ink-black font-medium">
              {monthlyBudget.toLocaleString()}원
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-body text-ink-mid">배분 합계</span>
            <div className="text-right">
              <span className="text-body text-ink-black">
                {totalCategoryBudgets.toLocaleString()}원
              </span>
              <span className="text-caption text-ink-light ml-2">
                ({Math.round(totalPercentage * 10) / 10}%)
              </span>
            </div>
          </div>
          <div className="border-t border-paper-mid pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-body text-ink-mid">
                {budgetDifference >= 0 ? '미배분' : '초과'}
              </span>
              <span
                className={`text-body font-medium ${
                  budgetDifference >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-500'
                }`}
              >
                {budgetDifference >= 0 ? '+' : ''}
                {budgetDifference.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Management Button */}
      <section className="px-6 pt-6 pb-8">
        <button
          onClick={() => navigate('/settings/categories')}
          className="w-full flex items-center justify-center gap-2 py-3 bg-paper-light dark:bg-ink-dark/30 rounded-lg text-body text-ink-black hover:bg-paper-mid dark:hover:bg-ink-dark/50 transition-colors"
        >
          <Settings size={18} className="text-ink-mid" />
          <span>카테고리 관리</span>
        </button>
      </section>
    </div>
  );
}
