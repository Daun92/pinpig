import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { subMonths, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { generateMonthlyReview } from '@/services/queries';
import { Icon } from '@/components/common/Icon';
import type { MonthlyReview } from '@/types';

export function MonthlyReviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [review, setReview] = useState<MonthlyReview | null>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    if (yearParam && monthParam) {
      return new Date(parseInt(yearParam), parseInt(monthParam) - 1, 1);
    }
    // Default to last month
    return subMonths(new Date(), 1);
  });

  useEffect(() => {
    loadReview();
  }, [currentDate]);

  const loadReview = async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const data = await generateMonthlyReview(year, month);
      setReview(data);
    } catch (error) {
      console.error('Failed to load review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    const now = new Date();
    // Can only view up to last month
    if (next < now) {
      setCurrentDate(next);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'over_budget':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'under_budget':
        return <TrendingDown size={16} className="text-semantic-positive" />;
      case 'increase':
        return <TrendingUp size={16} className="text-red-500" />;
      case 'decrease':
        return <TrendingDown size={16} className="text-semantic-positive" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper-white dark:bg-ink-black flex items-center justify-center">
        <Loader2 size={32} className="text-ink-mid animate-spin" />
      </div>
    );
  }

  const canGoNext = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1) < new Date();

  return (
    <div className="min-h-screen bg-paper-white dark:bg-ink-black pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid dark:border-ink-dark">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-ink-black dark:text-paper-white" />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={20} className="text-ink-mid" />
          </button>
          <span className="text-body text-ink-black dark:text-paper-white min-w-20 text-center">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={!canGoNext}
            className="w-8 h-8 flex items-center justify-center"
          >
            <ChevronRight size={20} className={canGoNext ? 'text-ink-mid' : 'text-paper-mid dark:text-ink-dark'} />
          </button>
        </div>
        <div className="w-10" />
      </header>

      {review && (
        <>
          {/* Summary */}
          <section className="px-6 py-6 text-center border-b border-paper-mid dark:border-ink-dark">
            <p className="text-hero text-ink-black dark:text-paper-white">{formatCurrency(review.totalExpense)}</p>
            <p className="text-sub text-ink-mid mt-2">지출했어요</p>

            {review.budgetUsedPercent > 0 && (
              <div className="mt-6">
                <div className="h-2 bg-paper-mid dark:bg-ink-dark rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      review.budgetUsedPercent > 100 ? 'bg-red-500' : 'bg-ink-black dark:bg-pig-pink'
                    }`}
                    style={{ width: `${Math.min(review.budgetUsedPercent, 100)}%` }}
                  />
                </div>
                <p className="text-sub text-ink-mid mt-2">예산 대비 {review.budgetUsedPercent}%</p>
              </div>
            )}
          </section>

          {/* Insights */}
          {review.insights.length > 0 && (
            <section className="px-6 py-4 border-b border-paper-mid dark:border-ink-dark">
              <h2 className="text-sub text-ink-mid mb-4">발견한 점</h2>
              <div className="space-y-3">
                {review.insights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-paper-light dark:bg-ink-dark rounded-md"
                  >
                    {getInsightIcon(insight.type)}
                    <p className="text-body text-ink-dark dark:text-paper-mid flex-1">{insight.message}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Category Comparison */}
          <section className="px-6 py-4">
            <h2 className="text-sub text-ink-mid mb-4">카테고리별 비교</h2>

            {review.categoryComparison.length === 0 ? (
              <p className="text-body text-ink-light text-center py-8">
                비교할 데이터가 없습니다
              </p>
            ) : (
              <div className="space-y-4">
                {review.categoryComparison.map((cat) => (
                  <div key={cat.categoryId} className="p-4 bg-paper-light dark:bg-ink-dark rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: cat.categoryColor + '20' }}
                        >
                          <Icon name={cat.categoryIcon} size={16} className="text-ink-dark dark:text-paper-mid" />
                        </div>
                        <span className="text-body text-ink-dark dark:text-paper-mid">{cat.categoryName}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-body text-ink-black dark:text-paper-white">
                          {formatCurrency(cat.currentAmount)}
                        </p>
                        {cat.previousAmount > 0 && (
                          <p
                            className={`text-caption ${
                              cat.percentChange > 0 ? 'text-red-500' : 'text-semantic-positive'
                            }`}
                          >
                            {cat.percentChange > 0 ? '+' : ''}
                            {cat.percentChange}%
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Budget bar */}
                    {cat.budgetAmount && cat.budgetAmount > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-paper-mid dark:bg-ink-black rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              cat.isOverBudget ? 'bg-red-500' : 'bg-ink-black dark:bg-pig-pink'
                            }`}
                            style={{
                              width: `${Math.min((cat.currentAmount / cat.budgetAmount) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-caption text-ink-light">
                            예산 {formatCurrency(cat.budgetAmount)}
                          </span>
                          {cat.isOverBudget && (
                            <span className="text-caption text-red-500">초과</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Previous month comparison */}
                    {cat.previousAmount > 0 && (
                      <p className="text-caption text-ink-light mt-2">
                        지난달 {formatCurrency(cat.previousAmount)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Action Buttons */}
          <section className="px-6 py-4">
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="flex-1 py-3 bg-paper-light dark:bg-ink-dark rounded-md text-body text-ink-mid"
              >
                유지하기
              </button>
              <button
                onClick={() => navigate('/settings/budget-wizard')}
                className="flex-1 py-3 bg-ink-black dark:bg-pig-pink rounded-md text-body text-paper-white"
              >
                조정하기
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
