import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTransactionStore, selectBudgetStatus } from '@/stores/transactionStore';
import { useSettingsStore, selectMonthlyBudget } from '@/stores/settingsStore';
import { useCategoryStore, selectCategoryMap } from '@/stores/categoryStore';
import { Icon } from '@/components/common';
import { formatCurrency } from '@/utils/format';
import { isToday, isYesterday } from 'date-fns';

export function HomePage() {
  const { transactions, fetchTransactions, isLoading } = useTransactionStore();
  const { fetchSettings } = useSettingsStore();
  const { fetchCategories } = useCategoryStore();

  const monthlyBudget = useSettingsStore(selectMonthlyBudget);
  const budgetStatus = useTransactionStore(selectBudgetStatus(monthlyBudget));
  const categoryMap = useCategoryStore(selectCategoryMap);

  useEffect(() => {
    fetchSettings();
    fetchCategories();
    fetchTransactions(new Date());
  }, [fetchSettings, fetchCategories, fetchTransactions]);

  const today = new Date();
  const currentDateLabel = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

  const remaining = budgetStatus.remaining;
  const percentUsed = budgetStatus.percentUsed;
  const remainingDays = budgetStatus.remainingDays;
  const dailyRecommended = budgetStatus.dailyRecommended;

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

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-body text-ink-mid">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-white pb-20">
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
            이번 달 쓸 수 있는 돈
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

      {/* Recent Transactions Section */}
      <section className="mt-6">
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
                  className="px-6 py-4 border-b border-paper-mid flex items-center gap-4"
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
