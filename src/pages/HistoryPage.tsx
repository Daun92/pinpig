import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Plus } from 'lucide-react';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore, selectCategoryMap } from '@/stores/categoryStore';
import { Icon } from '@/components/common';
import { isToday, isYesterday, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Transaction } from '@/types';

interface DateGroup {
  label: string;
  date: Date;
  transactions: Transaction[];
  dailyTotal: number;
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return '오늘';
  if (isYesterday(date)) return '어제';
  return format(date, 'M월 d일', { locale: ko });
}

function groupTransactionsByDate(transactions: Transaction[]): DateGroup[] {
  const groups: Map<string, DateGroup> = new Map();

  for (const tx of transactions) {
    const dateKey = format(tx.date, 'yyyy-MM-dd');

    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        label: getDateLabel(tx.date),
        date: tx.date,
        transactions: [],
        dailyTotal: 0,
      });
    }

    const group = groups.get(dateKey)!;
    group.transactions.push(tx);
    group.dailyTotal += tx.type === 'income' ? tx.amount : -tx.amount;
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { transactions, currentMonth, fetchTransactions, isLoading } = useTransactionStore();
  const { fetchCategories } = useCategoryStore();
  const categoryMap = useCategoryStore(selectCategoryMap);

  useEffect(() => {
    fetchCategories();
    fetchTransactions(new Date());
  }, [fetchCategories, fetchTransactions]);

  const dateGroups = groupTransactionsByDate(transactions);

  const currentMonthLabel = currentMonth.toLocaleDateString('ko-KR', { month: 'long' });

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-body text-ink-mid">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-white pb-20">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-paper-mid">
        <h1 className="text-title text-ink-black">내역</h1>
        <button className="w-10 h-10 flex items-center justify-center text-ink-mid">
          <Search size={20} />
        </button>
      </header>

      {/* Filter Bar */}
      <div className="flex gap-2 px-6 py-3 bg-paper-white border-b border-paper-mid">
        <button className="flex items-center gap-1 px-3 py-2 bg-paper-light rounded-sm text-sub text-ink-dark">
          {currentMonthLabel.replace('월', '월')}
          <ChevronDown size={16} />
        </button>
        <button className="flex items-center gap-1 px-3 py-2 bg-paper-light rounded-sm text-sub text-ink-dark">
          전체 카테고리
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Transaction List */}
      {dateGroups.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-body text-ink-light">아직 거래 내역이 없어요</p>
          <p className="text-sub text-ink-light mt-1">
            + 버튼을 눌러 기록해보세요
          </p>
        </div>
      ) : (
        <div>
          {dateGroups.map((group) => (
            <div key={group.label}>
              {/* Date Group Header */}
              <div className="flex justify-between items-center px-6 py-3 bg-paper-light">
                <span className="text-sub text-ink-dark">{group.label}</span>
                <span className={`text-sub ${group.dailyTotal >= 0 ? 'text-semantic-positive' : 'text-ink-mid'}`}>
                  {group.dailyTotal >= 0 ? '+' : ''}{group.dailyTotal.toLocaleString()}원
                </span>
              </div>

              {/* Transactions */}
              <ul>
                {group.transactions.map((tx) => {
                  const category = categoryMap.get(tx.categoryId);
                  return (
                    <li
                      key={tx.id}
                      className="px-6 py-4 border-b border-paper-mid"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="text-ink-mid mt-0.5">
                          <Icon name={category?.icon || 'MoreHorizontal'} size={20} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <span className="text-body text-ink-black truncate">
                              {tx.description || category?.name || '거래'}
                            </span>
                            <span className="text-caption text-ink-light ml-2 whitespace-nowrap">
                              {tx.time}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline mt-1">
                            <span className="text-sub text-ink-mid">
                              {category?.name || '기타'}
                            </span>
                            <span className={`text-amount whitespace-nowrap ${
                              tx.type === 'income' ? 'text-semantic-positive' : 'text-ink-black'
                            }`}>
                              {tx.type === 'income' ? '+ ' : ''}{tx.amount.toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate('/add')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-ink-black rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="새 거래 추가"
      >
        <Plus className="w-6 h-6 text-paper-white" />
      </button>
    </div>
  );
}
