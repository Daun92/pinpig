import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Lightbulb, X } from 'lucide-react';
import { addMonths, subMonths, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  useTransactionStore,
  selectCategoryBreakdown,
  selectMonthlyTrend,
  selectAnnualTrend,
} from '@/stores/transactionStore';
import { getSettings } from '@/services/database';
import { getCategoryTrend } from '@/services/queries';
import { Icon } from '@/components/common/Icon';
import {
  CategoryTrendModal,
  CategoryDonutChart,
  TrendPeriodSelector,
  CategoryFilterChips,
  MultiCategoryTrendChart,
  type TrendPeriod,
} from '@/components/report';
import type { Settings, CategorySummary, CategoryTrend } from '@/types';

export function StatsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeTab, setActiveTab] = useState<'category' | 'trend'>('category');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [selectedCategory, setSelectedCategory] = useState<CategorySummary | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('6months');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoryTrendData, setCategoryTrendData] = useState<Map<string, CategoryTrend[]>>(new Map());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentMonth.getFullYear());

  const {
    monthSummary,
    fetchMonthSummary,
    fetchCategoryBreakdown,
    fetchMonthlyTrend,
    fetchAnnualTrend,
    isLoading,
  } = useTransactionStore();
  const categoryBreakdown = useTransactionStore(selectCategoryBreakdown);
  const monthlyTrend = useTransactionStore(selectMonthlyTrend);
  const annualTrend = useTransactionStore(selectAnnualTrend);

  useEffect(() => {
    getSettings().then((s) => setSettings(s || null));
  }, []);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    fetchMonthSummary(year, month);
    fetchCategoryBreakdown(year, month, transactionType);
  }, [currentMonth, transactionType, fetchMonthSummary, fetchCategoryBreakdown]);

  // Fetch trend data based on period
  useEffect(() => {
    if (trendPeriod === 'annual') {
      fetchAnnualTrend(3);
    } else {
      const months = trendPeriod === '6months' ? 6 : 12;
      fetchMonthlyTrend(months);
    }
  }, [trendPeriod, fetchMonthlyTrend, fetchAnnualTrend]);

  // Fetch category trend data when categories are selected
  useEffect(() => {
    const fetchCategoryTrends = async () => {
      const months = trendPeriod === '12months' ? 12 : 6;
      const newData = new Map<string, CategoryTrend[]>();

      for (const categoryId of selectedCategoryIds) {
        const trend = await getCategoryTrend(categoryId, months);
        newData.set(categoryId, trend);
      }

      setCategoryTrendData(newData);
    };

    if (selectedCategoryIds.length > 0 && trendPeriod !== 'annual') {
      fetchCategoryTrends();
    } else {
      setCategoryTrendData(new Map());
    }
  }, [selectedCategoryIds, trendPeriod]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1);
    if (next <= new Date()) {
      setCurrentMonth(next);
    }
  };

  const openMonthPicker = () => {
    setPickerYear(currentMonth.getFullYear());
    setShowMonthPicker(true);
  };

  const handleSelectMonth = (month: number) => {
    const selected = new Date(pickerYear, month, 1);
    setCurrentMonth(selected);
    setShowMonthPicker(false);
  };

  const isMonthDisabled = (month: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();
    if (pickerYear > currentYear) return true;
    if (pickerYear === currentYear && month > currentMonthNum) return true;
    return false;
  };

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      // Max 3 categories, remove oldest if exceeded
      if (prev.length >= 3) {
        return [...prev.slice(1), categoryId];
      }
      return [...prev, categoryId];
    });
  }, []);

  // Prepare category lines for chart
  const categoryLines = selectedCategoryIds.map((id) => {
    const category = categoryBreakdown.find((c) => c.categoryId === id);
    const data = categoryTrendData.get(id) || [];
    return {
      id,
      name: category?.categoryName || '',
      color: category?.categoryColor || '#999',
      data,
    };
  });

  const totalExpense = monthSummary?.expense || 0;
  const totalIncome = monthSummary?.income || 0;
  const displayAmount = transactionType === 'expense' ? totalExpense : totalIncome;
  const budgetPercent = settings?.monthlyBudget
    ? Math.round((totalExpense / settings.monthlyBudget) * 100)
    : 0;

  // 인사이트 생성
  const generateInsights = () => {
    const insights: string[] = [];

    if (transactionType === 'expense') {
      if (categoryBreakdown.length > 0) {
        insights.push(`${categoryBreakdown[0].categoryName}에 가장 많이 썼어요`);
      }

      if (monthlyTrend.length >= 2) {
        const current = monthlyTrend[monthlyTrend.length - 1];
        const previous = monthlyTrend[monthlyTrend.length - 2];

        if (current && previous) {
          const diff = current.expense - previous.expense;
          if (diff > 0) {
            insights.push(`지난달보다 ${Math.abs(diff).toLocaleString()}원 더 썼어요`);
          } else if (diff < 0) {
            insights.push(`지난달보다 ${Math.abs(diff).toLocaleString()}원 덜 썼어요`);
          }
        }
      }

      if (budgetPercent > 100) {
        insights.push(`예산을 ${budgetPercent - 100}% 초과했어요`);
      } else if (budgetPercent > 80) {
        insights.push(`예산의 ${budgetPercent}%를 사용했어요`);
      }
    } else {
      // 수입 인사이트
      if (categoryBreakdown.length > 0) {
        insights.push(`${categoryBreakdown[0].categoryName}에서 가장 많이 받았어요`);
      }

      if (monthlyTrend.length >= 2) {
        const current = monthlyTrend[monthlyTrend.length - 1];
        const previous = monthlyTrend[monthlyTrend.length - 2];

        if (current && previous) {
          const diff = current.income - previous.income;
          if (diff > 0) {
            insights.push(`지난달보다 ${Math.abs(diff).toLocaleString()}원 더 벌었어요`);
          } else if (diff < 0) {
            insights.push(`지난달보다 ${Math.abs(diff).toLocaleString()}원 덜 벌었어요`);
          }
        }
      }

      // 수입 대비 지출 비율
      if (totalIncome > 0) {
        const savingRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
        if (savingRate > 0) {
          insights.push(`수입의 ${savingRate}%를 저축할 수 있어요`);
        } else {
          insights.push(`수입보다 ${Math.abs(savingRate)}% 더 지출했어요`);
        }
      }
    }

    return insights.length > 0 ? insights : ['아직 분석할 데이터가 부족해요'];
  };

  const insights = generateInsights();

  if (isLoading && !monthSummary) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-ink-mid">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-white pb-nav">
      {/* Header with Month Navigation */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
        <h1 className="text-title text-ink-black pl-2">분석</h1>
        <div className="flex items-center bg-paper-light rounded-lg">
          <button
            onClick={handlePrevMonth}
            className="w-9 h-9 flex items-center justify-center text-ink-dark"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={openMonthPicker}
            className="flex items-center gap-1 px-1 py-2 text-sub text-ink-dark"
          >
            {format(currentMonth, 'M월', { locale: ko })}
            <ChevronDown size={14} />
          </button>
          <button
            onClick={handleNextMonth}
            disabled={addMonths(currentMonth, 1) > new Date()}
            className="w-9 h-9 flex items-center justify-center text-ink-dark disabled:text-ink-light"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      {/* Summary Section */}
      <section className="px-6 py-6">
        {/* Income/Expense Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTransactionType('expense')}
            className={`flex-1 py-2 rounded-full text-body transition-colors ${
              transactionType === 'expense'
                ? 'bg-ink-black text-paper-white'
                : 'bg-paper-light text-ink-mid'
            }`}
          >
            지출
          </button>
          <button
            onClick={() => setTransactionType('income')}
            className={`flex-1 py-2 rounded-full text-body transition-colors ${
              transactionType === 'income'
                ? 'bg-semantic-positive text-paper-white'
                : 'bg-paper-light text-ink-mid'
            }`}
          >
            수입
          </button>
        </div>

        <p className="text-sub text-ink-mid">
          이번 달 {transactionType === 'expense' ? '지출' : '수입'}
        </p>
        <p className={`text-hero mt-2 ${transactionType === 'income' ? 'text-semantic-positive' : 'text-ink-black'}`}>
          {transactionType === 'income' && '+ '}
          {displayAmount.toLocaleString()}원
        </p>

        {transactionType === 'expense' && settings?.monthlyBudget && settings.monthlyBudget > 0 && (
          <>
            <div className="mt-4 h-0.5 bg-paper-mid rounded-full overflow-hidden">
              <div
                className="h-full bg-ink-black rounded-full transition-all duration-300"
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              />
            </div>
            <p className="text-sub text-ink-mid mt-2">
              예산의 {budgetPercent}%
            </p>
          </>
        )}

        {/* Balance info when viewing income */}
        {transactionType === 'income' && (
          <div className="mt-4 p-3 bg-paper-light rounded-md">
            <div className="flex justify-between text-sub">
              <span className="text-ink-mid">이번 달 지출</span>
              <span className="text-ink-dark">{totalExpense.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-body mt-1">
              <span className="text-ink-mid">잔액</span>
              <span className={totalIncome - totalExpense >= 0 ? 'text-semantic-positive' : 'text-semantic-negative'}>
                {totalIncome - totalExpense >= 0 ? '+ ' : ''}{(totalIncome - totalExpense).toLocaleString()}원
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Tab Bar */}
      <div className="flex border-b border-paper-mid">
        <button
          onClick={() => setActiveTab('category')}
          className={`flex-1 py-3 text-center text-body ${
            activeTab === 'category'
              ? 'text-ink-black border-b-2 border-ink-black'
              : 'text-ink-mid'
          }`}
        >
          카테고리별
        </button>
        <button
          onClick={() => setActiveTab('trend')}
          className={`flex-1 py-3 text-center text-body ${
            activeTab === 'trend'
              ? 'text-ink-black border-b-2 border-ink-black'
              : 'text-ink-mid'
          }`}
        >
          월별 추이
        </button>
      </div>

      {/* Category Breakdown */}
      {activeTab === 'category' && (
        <section className="px-6 py-4">
          {categoryBreakdown.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-body text-ink-light">거래 데이터가 없습니다</p>
            </div>
          ) : (
            <>
              {/* Donut Chart */}
              <CategoryDonutChart
                data={categoryBreakdown}
                totalAmount={displayAmount}
                height={280}
              />

              {/* Category List */}
              <div className="space-y-4 mt-6">
                {categoryBreakdown.map((category) => (
                  <button
                    key={category.categoryId}
                    className="w-full py-2 text-left"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: category.categoryColor + '20' }}
                        >
                          <Icon
                            name={category.categoryIcon}
                            size={16}
                            className="text-ink-dark"
                          />
                        </div>
                        <span className="text-body text-ink-dark">
                          {category.categoryName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-amount ${transactionType === 'income' ? 'text-semantic-positive' : 'text-ink-black'}`}>
                          {transactionType === 'income' && '+ '}
                          {category.amount.toLocaleString()}원
                        </span>
                        <span className="text-sub text-ink-mid ml-2">
                          {Math.round(category.percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1 bg-paper-mid rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: category.categoryColor,
                        }}
                      />
                    </div>
                    <p className="text-caption text-ink-light mt-1">
                      {category.count}건
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Monthly Trend */}
      {activeTab === 'trend' && (
        <section className="px-6 py-4">
          {/* Period Selector */}
          <div className="mb-4">
            <TrendPeriodSelector
              value={trendPeriod}
              onChange={setTrendPeriod}
            />
          </div>

          {/* Category Filter (only for monthly views) */}
          {trendPeriod !== 'annual' && categoryBreakdown.length > 0 && (
            <div className="mb-4">
              <p className="text-caption text-ink-mid mb-2">카테고리 필터</p>
              <CategoryFilterChips
                categories={categoryBreakdown}
                selectedIds={selectedCategoryIds}
                onToggle={handleCategoryToggle}
                maxSelections={3}
              />
            </div>
          )}

          {/* Trend Chart */}
          {(trendPeriod === 'annual' ? annualTrend.length : monthlyTrend.length) === 0 ? (
            <div className="py-12 text-center">
              <p className="text-body text-ink-light">추이 데이터가 없습니다</p>
            </div>
          ) : (
            <>
              <MultiCategoryTrendChart
                period={trendPeriod}
                monthlyData={monthlyTrend}
                annualData={annualTrend}
                categoryLines={categoryLines}
                height={240}
              />

              {/* Summary */}
              <div className="mt-6 p-4 bg-paper-light rounded-md">
                <p className="text-sub text-ink-mid mb-3">
                  {trendPeriod === 'annual'
                    ? '연간 합계'
                    : trendPeriod === '12months'
                    ? '최근 12개월 합계'
                    : '최근 6개월 합계'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-caption text-ink-light">수입</p>
                    <p className="text-body text-semantic-positive mt-1">
                      + {(trendPeriod === 'annual'
                        ? annualTrend.reduce((sum, m) => sum + m.income, 0)
                        : monthlyTrend.reduce((sum, m) => sum + m.income, 0)
                      ).toLocaleString()}원
                    </p>
                  </div>
                  <div>
                    <p className="text-caption text-ink-light">지출</p>
                    <p className="text-body text-ink-black mt-1">
                      {(trendPeriod === 'annual'
                        ? annualTrend.reduce((sum, m) => sum + m.expense, 0)
                        : monthlyTrend.reduce((sum, m) => sum + m.expense, 0)
                      ).toLocaleString()}원
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* Insights Section */}
      <section className="px-6 py-4 pb-20">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={16} className="text-ink-mid" />
          <span className="text-sub text-ink-mid">이번 달 관심사</span>
        </div>
        <div className="p-4 bg-paper-light rounded-md">
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="text-body text-ink-dark flex items-start gap-2">
                <span className="text-ink-light">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Month Picker Modal */}
      {showMonthPicker && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-paper-white w-full max-w-lg rounded-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-paper-mid">
              <h2 className="text-title text-ink-black">월 선택</h2>
              <button
                onClick={() => setShowMonthPicker(false)}
                className="w-10 h-10 flex items-center justify-center"
              >
                <X size={20} className="text-ink-mid" />
              </button>
            </div>

            {/* Year Navigation */}
            <div className="flex items-center justify-center gap-4 py-4 border-b border-paper-mid">
              <button
                onClick={() => setPickerYear((prev) => prev - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-paper-light"
              >
                <ChevronLeft size={20} className="text-ink-dark" />
              </button>

              <span className="text-title text-ink-black min-w-24 text-center">
                {pickerYear}년
              </span>

              <button
                onClick={() => setPickerYear((prev) => prev + 1)}
                disabled={pickerYear >= new Date().getFullYear()}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-paper-light disabled:opacity-30"
              >
                <ChevronRight size={20} className="text-ink-dark" />
              </button>
            </div>

            {/* Month Grid (4x3) */}
            <div className="grid grid-cols-4 gap-2 px-4 py-4">
              {Array.from({ length: 12 }, (_, i) => {
                const isSelected =
                  pickerYear === currentMonth.getFullYear() &&
                  i === currentMonth.getMonth();
                const disabled = isMonthDisabled(i);

                return (
                  <button
                    key={i}
                    onClick={() => !disabled && handleSelectMonth(i)}
                    disabled={disabled}
                    className={`py-3 rounded-lg text-body transition-colors ${
                      isSelected
                        ? 'bg-ink-black text-paper-white'
                        : disabled
                        ? 'bg-paper-light text-ink-light'
                        : 'bg-paper-light text-ink-dark hover:bg-paper-mid'
                    }`}
                  >
                    {i + 1}월
                  </button>
                );
              })}
            </div>

            {/* Close Button */}
            <div className="px-4 pb-4">
              <button
                onClick={() => setShowMonthPicker(false)}
                className="w-full py-4 bg-ink-black text-paper-white text-body rounded-lg"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Trend Modal */}
      {selectedCategory && (
        <CategoryTrendModal
          category={selectedCategory}
          isOpen={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          year={currentMonth.getFullYear()}
          month={currentMonth.getMonth() + 1}
          type={transactionType}
        />
      )}
    </div>
  );
}
