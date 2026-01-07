import { useEffect } from 'react';
import { useTransactionStore, selectMonthSummary } from '@/stores/transactionStore';
import { formatCurrency } from '@/utils/format';

export function StatsPage() {
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
    <div className="px-sm pt-safe-top pb-24">
      <header className="py-md">
        <h1 className="text-title text-ink-black">이번 달 통계</h1>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-sm mb-md">
        <div className="bg-paper-light rounded-md p-sm">
          <p className="text-sub text-ink-mid">수입</p>
          <p className="text-amount text-semantic-positive mt-xs">
            + {summary.income.toLocaleString()}
          </p>
        </div>
        <div className="bg-paper-light rounded-md p-sm">
          <p className="text-sub text-ink-mid">지출</p>
          <p className="text-amount text-ink-black mt-xs">
            {summary.expense.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Balance */}
      <div className="bg-paper-light rounded-md p-sm mb-md">
        <p className="text-sub text-ink-mid">잔액</p>
        <p className="text-hero text-ink-black mt-xs">
          {formatCurrency(summary.balance)}
        </p>
      </div>

      {/* Transaction Count */}
      <div className="text-center py-md">
        <p className="text-body text-ink-mid">
          이번 달 총 <span className="text-ink-black font-medium">{summary.transactionCount}</span>건의 거래
        </p>
      </div>
    </div>
  );
}
