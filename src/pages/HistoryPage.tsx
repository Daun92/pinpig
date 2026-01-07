import { useEffect } from 'react';
import { useTransactionStore } from '@/stores/transactionStore';
import { formatDate } from '@/utils/format';

export function HistoryPage() {
  const { transactions, fetchTransactions, isLoading } = useTransactionStore();

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

  // Group transactions by date
  const groupedByDate = transactions.reduce(
    (groups, tx) => {
      const dateKey = tx.date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
      return groups;
    },
    {} as Record<string, typeof transactions>
  );

  return (
    <div className="px-sm pt-safe-top pb-24">
      <header className="py-md">
        <h1 className="text-title text-ink-black">거래 내역</h1>
      </header>

      {transactions.length === 0 ? (
        <p className="text-body text-ink-mid py-lg text-center">
          아직 거래 내역이 없어요
        </p>
      ) : (
        <div className="space-y-md">
          {Object.entries(groupedByDate).map(([dateKey, txs]) => (
            <section key={dateKey}>
              <h2 className="text-sub text-ink-mid mb-xs">
                {formatDate(new Date(dateKey))}
              </h2>
              <ul className="bg-paper-light rounded-md overflow-hidden">
                {txs.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex justify-between items-center px-sm py-sm border-b border-paper-mid last:border-b-0"
                  >
                    <div>
                      <p className="text-body text-ink-dark">
                        {tx.memo || '메모 없음'}
                      </p>
                    </div>
                    <span
                      className={`text-amount ${
                        tx.type === 'income'
                          ? 'text-semantic-positive'
                          : 'text-ink-black'
                      }`}
                    >
                      {tx.type === 'income' ? '+ ' : ''}
                      {tx.amount.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
