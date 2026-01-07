import { useEffect } from 'react';
import { useTransactionStore, selectMonthSummary } from '@/stores/transactionStore';
import { formatCurrency } from '@/utils/format';

export function HomePage() {
  const { transactions, fetchTransactions, isLoading } = useTransactionStore();
  const summary = useTransactionStore(selectMonthSummary);

  useEffect(() => {
    fetchTransactions(new Date());
  }, [fetchTransactions]);

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-ink-mid">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="px-sm pt-safe-top">
      {/* Header */}
      <header className="py-md">
        <p className="text-sub text-ink-mid">이번 달 남은 예산</p>
        <h1 className="text-hero text-ink-black mt-xs">
          {formatCurrency(summary.balance)}
        </h1>
      </header>

      {/* Budget Progress */}
      <section className="py-sm">
        <div className="h-0.5 bg-paper-mid rounded-full overflow-hidden">
          <div
            className="h-full bg-ink-black transition-all duration-300"
            style={{ width: `${Math.min((summary.expense / (summary.income || 1)) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-xs text-caption text-ink-light">
          <span>사용 {formatCurrency(summary.expense)}</span>
          <span>수입 {formatCurrency(summary.income)}</span>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="py-md">
        <h2 className="text-title text-ink-black mb-sm">최근 거래</h2>
        {transactions.length === 0 ? (
          <p className="text-body text-ink-mid py-lg text-center">
            아직 거래 내역이 없어요
          </p>
        ) : (
          <ul className="space-y-xs">
            {transactions.slice(0, 5).map((tx) => (
              <li
                key={tx.id}
                className="flex justify-between items-center py-sm border-b border-paper-mid"
              >
                <div>
                  <p className="text-body text-ink-dark">{tx.memo || '메모 없음'}</p>
                  <p className="text-caption text-ink-light">
                    {tx.date.toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <span
                  className={`text-amount ${
                    tx.type === 'income' ? 'text-semantic-positive' : 'text-ink-black'
                  }`}
                >
                  {tx.type === 'income' ? '+ ' : ''}
                  {tx.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
