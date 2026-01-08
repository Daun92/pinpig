import type { MonthGroup } from '@/types';

interface MonthSummaryCardProps {
  monthGroup: MonthGroup;
}

export function MonthSummaryCard({ monthGroup }: MonthSummaryCardProps) {
  const { summary, label } = monthGroup;

  return (
    <div className="mx-4 my-3 p-4 bg-paper-light rounded-xl border border-paper-mid">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sub text-ink-mid">{label} 마감</span>
        <span className="text-caption text-ink-light">
          {summary.transactionCount}건
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-sub text-ink-mid">지출</span>
          <span className="text-body text-ink-black">
            {summary.expense.toLocaleString()}원
          </span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-sub text-ink-mid">수입</span>
          <span className="text-body text-semantic-positive">
            + {summary.income.toLocaleString()}원
          </span>
        </div>

        <div className="border-t border-paper-mid pt-2 mt-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sub text-ink-dark">순액</span>
            <span className={`text-amount font-medium ${
              summary.net >= 0 ? 'text-semantic-positive' : 'text-semantic-negative'
            }`}>
              {summary.net >= 0 ? '+ ' : ''}{summary.net.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
