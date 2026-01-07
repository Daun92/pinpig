import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Calendar, Repeat, TrendingUp, TrendingDown } from 'lucide-react';
import { useTransactionStore, selectBudgetStatus } from '@/stores/transactionStore';
import { useSettingsStore, selectMonthlyBudget } from '@/stores/settingsStore';
import { useCategoryStore, selectCategoryMap } from '@/stores/categoryStore';
import { Icon } from '@/components/common';
import { formatCurrency } from '@/utils/format';
import { isToday, isYesterday, format } from 'date-fns';
import { getUpcomingRecurringTransactions, getMonthlyBudgetStructure } from '@/services/queries';
import type { RecurringTransaction, MonthlyBudgetStructure } from '@/types';

export function HomePage() {
  const navigate = useNavigate();
  const { transactions, fetchTransactions, isLoading } = useTransactionStore();
  const { fetchSettings } = useSettingsStore();
  const { fetchCategories } = useCategoryStore();

  const monthlyBudget = useSettingsStore(selectMonthlyBudget);
  const budgetStatus = useTransactionStore(selectBudgetStatus(monthlyBudget));
  const categoryMap = useCategoryStore(selectCategoryMap);

  const [upcomingRecurring, setUpcomingRecurring] = useState<RecurringTransaction[]>([]);
  const [budgetStructure, setBudgetStructure] = useState<MonthlyBudgetStructure | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchCategories();
    fetchTransactions(new Date());
    loadBudgetData();
  }, [fetchSettings, fetchCategories, fetchTransactions]);

  const loadBudgetData = async () => {
    try {
      const now = new Date();
      const [upcoming, structure] = await Promise.all([
        getUpcomingRecurringTransactions(7),
        getMonthlyBudgetStructure(now.getFullYear(), now.getMonth() + 1),
      ]);
      setUpcomingRecurring(upcoming);
      setBudgetStructure(structure);
    } catch (error) {
      console.error('Failed to load budget data:', error);
    }
  };

  const today = new Date();
  const currentDateLabel = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

  // Use projected balance if available
  const remaining = budgetStructure
    ? Math.max(budgetStatus.remaining + budgetStructure.expectedIncome - budgetStructure.fixedExpenses, 0)
    : budgetStatus.remaining;
  const percentUsed = budgetStatus.percentUsed;
  const remainingDays = budgetStatus.remainingDays;
  const dailyRecommended = remainingDays > 0 ? Math.round(remaining / remainingDays) : 0;

  const recentTransactions = transactions.slice(0, 3);

  const formatTransactionTime = (date: Date, time: string) => {
    if (isToday(date)) {
      return `오늘 ${time}`;
    }
    if (isYesterday(date)) {
      return `어제 ${time}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()} ${time}`;
  };

  const formatUpcomingDate = (date: Date) => {
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return '오늘';
    if (diff === 1) return '내일';
    if (diff <= 7) return `${diff}일 후`;
    return format(date, 'M/d');
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-body text-ink-mid">불러오는 중...</p>
      </div>
    );
  }

  const hasProjections = budgetStructure && (budgetStructure.expectedIncome > 0 || budgetStructure.fixedExpenses > 0);

  return (
    <div className="min-h-screen bg-paper-white pb-nav">
      {/* Hero Zone */}
      <section className="px-6 pt-6">
        {/* Date Display */}
        <div className="text-center">
          <span className="text-sub text-ink-mid">
            {currentDateLabel}
          </span>
        </div>

        {/* Hero Amount */}
        <div className="text-center mt-2">
          <h1 className="text-hero text-ink-black">
            {formatCurrency(remaining >= 0 ? remaining : 0)}
          </h1>
          <p className="text-sub text-ink-mid mt-1">
            {hasProjections ? '이번 달 예상 잔액' : '이번 달 쓸 수 있는 돈'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 mx-0">
          <div className="h-0.5 bg-paper-mid rounded-full overflow-hidden">
            <div
              className="h-full bg-ink-black rounded-full transition-all duration-300"
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Daily Budget */}
        <div className="text-center mt-3">
          <p className="text-sub text-ink-mid">
            {remainingDays}일 남음 · 하루 {formatCurrency(dailyRecommended)}
          </p>
        </div>
      </section>

      {/* Projected Income/Expense Summary */}
      {hasProjections && (
        <section className="px-6 mt-4">
          <div className="flex gap-3">
            {budgetStructure.expectedIncome > 0 && (
              <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
                  <span className="text-caption text-green-700 dark:text-green-400">예상 수입</span>
                </div>
                <p className="text-sub font-medium text-green-700 dark:text-green-400">
                  +{budgetStructure.expectedIncome.toLocaleString()}원
                </p>
              </div>
            )}
            {budgetStructure.fixedExpenses > 0 && (
              <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingDown size={14} className="text-red-600 dark:text-red-400" />
                  <span className="text-caption text-red-700 dark:text-red-400">예정 지출</span>
                </div>
                <p className="text-sub font-medium text-red-700 dark:text-red-400">
                  {budgetStructure.fixedExpenses.toLocaleString()}원
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Upcoming Recurring Transactions */}
      {upcomingRecurring.length > 0 && (
        <section className="mt-6">
          <div className="flex justify-between items-center px-6 py-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-ink-mid" />
              <h2 className="text-sub text-ink-dark">예정된 거래</h2>
            </div>
            <button
              onClick={() => navigate('/settings/recurring')}
              className="text-sub text-ink-mid flex items-center gap-1"
            >
              관리
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="px-6">
            <div className="bg-paper-light dark:bg-ink-dark/30 rounded-lg overflow-hidden">
              {upcomingRecurring.slice(0, 3).map((item, index) => {
                const category = categoryMap.get(item.categoryId);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      index < upcomingRecurring.slice(0, 3).length - 1
                        ? 'border-b border-paper-mid dark:border-ink-dark'
                        : ''
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: (category?.color || '#B8B8B8') + '20' }}
                    >
                      <Repeat size={14} className="text-ink-mid" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body text-ink-black truncate">{item.description}</p>
                      <p className="text-caption text-ink-light">
                        {formatUpcomingDate(new Date(item.nextExecutionDate))}
                      </p>
                    </div>
                    <span
                      className={`text-body whitespace-nowrap ${
                        item.type === 'income'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-ink-black'
                      }`}
                    >
                      {item.type === 'income' ? '+' : ''}
                      {item.amount.toLocaleString()}원
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Recent Transactions Section */}
      <section className="mt-6 pb-20">
        {/* Section Header */}
        <div className="flex justify-between items-center px-6 py-3">
          <h2 className="text-sub text-ink-dark">최근 거래</h2>
          <Link to="/history" className="text-sub text-ink-mid flex items-center gap-1">
            모두
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* Transaction List */}
        {recentTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-body text-ink-light">아직 거래가 없어요</p>
            <p className="text-sub text-ink-light mt-1">
              + 버튼을 눌러 기록해보세요
            </p>
          </div>
        ) : (
          <ul>
            {recentTransactions.map((tx) => {
              const category = categoryMap.get(tx.categoryId);
              return (
                <li
                  key={tx.id}
                  onClick={() => navigate(`/transaction/${tx.id}`)}
                  className="px-6 py-4 border-b border-paper-mid flex items-center gap-4 cursor-pointer active:bg-paper-light transition-colors"
                >
                  {/* Icon */}
                  <div className="text-ink-mid">
                    <Icon name={category?.icon || 'MoreHorizontal'} size={24} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-body text-ink-dark truncate">
                        {tx.description || tx.memo || category?.name || '거래'}
                      </span>
                      <span className="text-caption text-ink-light ml-2 whitespace-nowrap">
                        {formatTransactionTime(tx.date, tx.time)}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className={`text-amount whitespace-nowrap ${
                    tx.type === 'income' ? 'text-semantic-positive' : 'text-ink-black'
                  }`}>
                    {tx.type === 'income' ? '+ ' : ''}{tx.amount.toLocaleString()}원
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

    </div>
  );
}
