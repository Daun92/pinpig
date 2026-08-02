import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Icon } from '@/components/common';
import { CategoryTrendChart } from './CategoryTrendChart';
import {
  getPaymentMethodTrend,
  getTopTransactionsByPaymentMethod,
  getPaymentMethodCategoryBreakdown,
  type CategoryBreakdownItem,
} from '@/services/queries';
import { getProgressBarColor } from '@/utils/budgetStatus';
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
  const navigate = useNavigate();
  const [trendData, setTrendData] = useState<PaymentMethodTrend[]>([]);
  const [topTransactions, setTopTransactions] = useState<Transaction[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);
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
        // Fetch category breakdown (지출인 경우만)
        type === 'expense'
          ? getPaymentMethodCategoryBreakdown(targetYear, targetMonth, paymentMethod.paymentMethodId)
          : Promise.resolve([]),
      ])
        .then(([trend, transactions, breakdown]) => {
          setTrendData(trend);
          setTopTransactions(transactions);
          setCategoryBreakdown(breakdown);
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

  // 한도 정보
  const hasLimit = paymentMethod.budget && paymentMethod.budget > 0;
  const limitPercent = paymentMethod.budgetPercent ?? 0;
  const remaining = hasLimit ? Math.max(paymentMethod.budget! - paymentMethod.amount, 0) : 0;
  const isOverLimit = limitPercent >= 100;

  // 액션 핸들러
  const handleViewHistory = () => {
    onClose();
    navigate(`/history?paymentMethodId=${paymentMethod.paymentMethodId}`);
  };

  const handleAdjustLimit = () => {
    onClose();
    navigate('/settings/payment-method');
  };

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
            {/* Limit Status (한도 설정된 경우만) */}
            {hasLimit && type === 'expense' && (
              <div className="px-6 py-4 border-b border-paper-mid">
                <div className="flex justify-between items-baseline mb-2">
                  <p className="text-sub text-ink-mid">
                    {targetMonth}월 한도 현황
                  </p>
                  <p className="text-body text-ink-black">
                    {paymentMethod.amount.toLocaleString()} / {paymentMethod.budget!.toLocaleString()}원
                  </p>
                </div>
                <div className="h-2 bg-paper-mid rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(limitPercent, 100)}%`,
                      backgroundColor: getProgressBarColor(limitPercent, paymentMethod.paymentMethodColor),
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <p className={`text-caption ${isOverLimit ? 'text-red-500' : 'text-ink-light'}`}>
                    {isOverLimit
                      ? `${(paymentMethod.amount - paymentMethod.budget!).toLocaleString()}원 초과`
                      : `${remaining.toLocaleString()}원 남음`
                    }
                  </p>
                  <p className={`text-caption ${isOverLimit ? 'text-red-500' : limitPercent >= 80 ? 'text-amber-500' : 'text-ink-mid'}`}>
                    {limitPercent}%
                  </p>
                </div>
              </div>
            )}

            {/* Category Breakdown (지출인 경우만) */}
            {type === 'expense' && categoryBreakdown.length > 0 && (
              <div className="px-6 py-4 border-b border-paper-mid">
                <button
                  onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
                  className="w-full flex justify-between items-center"
                >
                  <p className="text-sub text-ink-mid">카테고리별</p>
                  <ChevronRight
                    size={16}
                    className={`text-ink-light transition-transform duration-200 ${showCategoryBreakdown ? 'rotate-90' : ''}`}
                  />
                </button>

                {showCategoryBreakdown && (
                  <div className="mt-3 space-y-2">
                    {categoryBreakdown.map((cat) => (
                      <div key={cat.categoryId} className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${cat.categoryColor}20` }}
                        >
                          <Icon
                            name={cat.categoryIcon}
                            size={12}
                            style={{ color: cat.categoryColor }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-sub text-ink-dark truncate">
                              {cat.categoryName}
                            </span>
                            <span className="text-sub text-ink-black">
                              {cat.amount.toLocaleString()}원
                            </span>
                          </div>
                          <div className="h-1 bg-paper-mid rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${cat.percentage}%`,
                                backgroundColor: cat.categoryColor,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-caption text-ink-light w-10 text-right">
                          {Math.round(cat.percentage)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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

            {/* Action Links (담담한 스타일) */}
            {type === 'expense' && (
              <div className="px-6 pb-6 flex justify-center gap-6">
                <button
                  onClick={handleViewHistory}
                  className="text-sub text-ink-mid underline underline-offset-2"
                >
                  내역 보기
                </button>
                <button
                  onClick={handleAdjustLimit}
                  className="text-sub text-ink-mid underline underline-offset-2"
                >
                  {hasLimit ? '한도 조정' : '한도 설정'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
