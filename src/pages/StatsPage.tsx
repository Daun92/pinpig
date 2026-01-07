import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { addMonths, subMonths, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  useTransactionStore,
  selectCategoryBreakdown,
  selectMonthlyTrend,
} from '@/stores/transactionStore';
import { getSettings } from '@/services/database';
import { Icon } from '@/components/common/Icon';
import type { Settings } from '@/types';

export function StatsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeTab, setActiveTab] = useState<'category' | 'trend'>('category');

  const {
    monthSummary,
    fetchMonthSummary,
    fetchCategoryBreakdown,
    fetchMonthlyTrend,
    isLoading,
  } = useTransactionStore();
  const categoryBreakdown = useTransactionStore(selectCategoryBreakdown);
  const monthlyTrend = useTransactionStore(selectMonthlyTrend);

  useEffect(() => {
    getSettings().then((s) => setSettings(s || null));
  }, []);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    fetchMonthSummary(year, month);
    fetchCategoryBreakdown(year, month, 'expense');
    fetchMonthlyTrend(6);
  }, [currentMonth, fetchMonthSummary, fetchCategoryBreakdown, fetchMonthlyTrend]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1);
    if (next <= new Date()) {
      setCurrentMonth(next);
    }
  };

  const maxCategoryAmount = categoryBreakdown.length > 0
    ? Math.max(...categoryBreakdown.map((c) => c.amount))
    : 0;

  const totalExpense = monthSummary?.expense || 0;
  const budgetPercent = settings?.monthlyBudget
    ? Math.round((totalExpense / settings.monthlyBudget) * 100)
    : 0;

  // 인사이트 생성
  const generateInsights = () => {
    const insights: string[] = [];

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
    <div className="min-h-screen bg-paper-white pb-20">
      {/* Header with Month Navigation */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-paper-mid">
        <h1 className="text-title text-ink-black">통계</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-ink-mid" />
          </button>
          <span className="text-body text-ink-black min-w-16 text-center">
            {format(currentMonth, 'M월', { locale: ko })}
          </span>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center"
            disabled={addMonths(currentMonth, 1) > new Date()}
          >
            <ChevronRight
              size={20}
              className={
                addMonths(currentMonth, 1) > new Date()
                  ? 'text-paper-mid'
                  : 'text-ink-mid'
              }
            />
          </button>
        </div>
      </header>

      {/* Summary Section */}
      <section className="px-6 py-6">
        <p className="text-sub text-ink-mid">이번 달 지출</p>
        <p className="text-hero text-ink-black mt-2">
          {totalExpense.toLocaleString()}원
        </p>

        {settings?.monthlyBudget && settings.monthlyBudget > 0 && (
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
            <div className="space-y-4">
              {categoryBreakdown.map((category) => (
                <div key={category.categoryId} className="py-2">
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
                    <span className="text-amount text-ink-black">
                      {category.amount.toLocaleString()}원
                    </span>
                  </div>
                  <div className="h-1 bg-paper-mid rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(category.amount / maxCategoryAmount) * 100}%`,
                        backgroundColor: category.categoryColor,
                      }}
                    />
                  </div>
                  <p className="text-caption text-ink-light mt-1">
                    {category.count}건 · {Math.round(category.percentage)}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Monthly Trend */}
      {activeTab === 'trend' && (
        <section className="px-6 py-4">
          {monthlyTrend.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-body text-ink-light">추이 데이터가 없습니다</p>
            </div>
          ) : (
            <>
              {/* Simple Bar Chart */}
              <div className="space-y-3">
                {monthlyTrend.map((month) => {
                  const maxExpense = Math.max(...monthlyTrend.map((m) => m.expense));
                  const widthPercent = maxExpense > 0 ? (month.expense / maxExpense) * 100 : 0;
                  const isCurrentMonth =
                    month.year === currentMonth.getFullYear() &&
                    month.month === currentMonth.getMonth() + 1;

                  return (
                    <div key={`${month.year}-${month.month}`} className="py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sub ${
                            isCurrentMonth ? 'text-ink-black font-medium' : 'text-ink-mid'
                          }`}
                        >
                          {month.month}월
                        </span>
                        <span
                          className={`text-body ${
                            isCurrentMonth ? 'text-ink-black' : 'text-ink-mid'
                          }`}
                        >
                          {month.expense.toLocaleString()}원
                        </span>
                      </div>
                      <div className="h-2 bg-paper-mid rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCurrentMonth ? 'bg-ink-black' : 'bg-ink-light'
                          }`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Income vs Expense Summary */}
              <div className="mt-6 p-4 bg-paper-light rounded-md">
                <p className="text-sub text-ink-mid mb-3">최근 6개월 합계</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-caption text-ink-light">수입</p>
                    <p className="text-body text-semantic-positive mt-1">
                      + {monthlyTrend.reduce((sum, m) => sum + m.income, 0).toLocaleString()}원
                    </p>
                  </div>
                  <div>
                    <p className="text-caption text-ink-light">지출</p>
                    <p className="text-body text-ink-black mt-1">
                      {monthlyTrend.reduce((sum, m) => sum + m.expense, 0).toLocaleString()}원
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* Insights Section */}
      <section className="px-6 py-4">
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
    </div>
  );
}
