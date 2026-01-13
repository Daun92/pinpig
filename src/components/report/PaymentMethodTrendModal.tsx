import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { Icon } from '@/components/common';
import { CategoryTrendChart } from './CategoryTrendChart';
import { getPaymentMethodTrend, getTopTransactionsByPaymentMethod } from '@/services/queries';
import type { PaymentMethodSummary, PaymentMethodTrend, Transaction } from '@/types';

interface PaymentMethodTrendModalProps {
  paymentMethod: PaymentMethodSummary | null;
  isOpen: boolean;
  onClose: () => void;
  year?: number;
  month?: number;
  type?: 'expense' | 'income';
}

export function PaymentMethodTrendModal({
  paymentMethod,
  isOpen,
  onClose,
  year,
  month,
  type = 'expense',
}: PaymentMethodTrendModalProps) {
  const [trendData, setTrendData] = useState<PaymentMethodTrend[]>([]);
  const [topTransactions, setTopTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use current date if year/month not provided
  const currentDate = new Date();
  const targetYear = year ?? currentDate.getFullYear();
  const targetMonth = month ?? currentDate.getMonth() + 1;

  useEffect(() => {
    if (isOpen && paymentMethod) {
      setIsLoading(true);
      Promise.all([
        getPaymentMethodTrend(paymentMethod.paymentMethodId, 6, type),
        getTopTransactionsByPaymentMethod(targetYear, targetMonth, paymentMethod.paymentMethodId, 5, type),
      ])
        .then(([trend, transactions]) => {
          setTrendData(trend);
          setTopTransactions(transactions);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, paymentMethod, targetYear, targetMonth, type]);

  if (!isOpen || !paymentMethod) return null;

  // Convert PaymentMethodTrend to CategoryTrend format for chart compatibility
  const chartData = trendData.map((t) => ({
    year: t.year,
    month: t.month,
    categoryId: t.paymentMethodId,
    categoryName: t.paymentMethodName,
    categoryIcon: t.paymentMethodIcon,
    categoryColor: t.paymentMethodColor,
    amount: t.amount,
    transactionCount: t.transactionCount,
  }));

  // Calculate trend stats
  const totalAmount = trendData.reduce((sum, t) => sum + t.amount, 0);
  const avgAmount = trendData.length > 0
    ? Math.round(totalAmount / trendData.length)
    : 0;
  const maxMonth = trendData.reduce(
    (max, t) => (t.amount > max.amount ? t : max),
    trendData[0] || { month: 0, amount: 0 }
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-paper-white rounded-xl animate-fade-in max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-paper-white flex items-center justify-between px-6 py-4 border-b border-paper-mid z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${paymentMethod.paymentMethodColor}20` }}
            >
              <Icon
                name={paymentMethod.paymentMethodIcon}
                size={20}
                style={{ color: paymentMethod.paymentMethodColor }}
              />
            </div>
            <div>
              <h3 className="text-title text-ink-black">{paymentMethod.paymentMethodName}</h3>
              <p className="text-sub text-ink-mid">최근 6개월 추이</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-ink-mid"
          >
            <X size={24} />
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-paper-mid border-t-ink-black rounded-full animate-spin" />
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <>
            {/* Chart */}
            <div className="px-6 py-4">
              <CategoryTrendChart data={chartData} height={180} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 px-6 pb-4">
              <div className="bg-paper-light rounded-sm p-3">
                <p className="text-caption text-ink-mid">월 평균</p>
                <p className="text-amount text-ink-black mt-1">
                  {avgAmount.toLocaleString()}원
                </p>
              </div>
              <div className="bg-paper-light rounded-sm p-3">
                <p className="text-caption text-ink-mid">
                  {type === 'income' ? '최고 수입' : '최고 지출'}
                </p>
                <p className="text-amount text-ink-black mt-1">
                  {maxMonth.month ? `${maxMonth.month}월` : '-'}
                </p>
              </div>
            </div>

            {/* TOP5 Transactions */}
            {topTransactions.length > 0 && (
              <div className="px-6 pb-4">
                <h4 className="text-sub text-ink-mid mb-3">
                  {targetMonth}월 {type === 'income' ? '수입' : '지출'} TOP5
                </h4>
                <div className="space-y-2">
                  {topTransactions.map((tx, index) => (
                    <div
                      key={tx.id}
                      className="py-2 border-b border-paper-mid last:border-b-0"
                    >
                      {/* 첫 줄: 순위 + 메모/태그 (말줄임) */}
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 flex-shrink-0 rounded-full bg-paper-light flex items-center justify-center text-caption text-ink-mid">
                          {index + 1}
                        </span>
                        <p className="text-body text-ink-dark truncate">
                          {tx.tags && tx.tags.length > 0 ? tx.tags[0] : (tx.memo || '거래')}
                        </p>
                      </div>
                      {/* 둘째 줄: 날짜 + 금액 */}
                      <div className="flex items-center justify-between mt-1 pl-8">
                        <p className="text-caption text-ink-light">
                          {format(new Date(tx.date), 'M/d')}
                        </p>
                        <span className={`text-amount ${type === 'income' ? 'text-semantic-positive' : 'text-ink-black'}`}>
                          {type === 'income' && '+ '}
                          {tx.amount.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {topTransactions.length === 0 && (
              <div className="px-6 pb-4">
                <p className="text-center text-ink-light text-sub py-4">
                  {targetMonth}월 거래 내역이 없습니다
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
