import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Icon } from '@/components/common';
import { CategoryTrendChart } from './CategoryTrendChart';
import { useTransactionStore, selectCategoryTrend } from '@/stores/transactionStore';
import {
  getTopTransactionsByCategory,
  getCategoryPaymentBreakdown,
  type PaymentBreakdownItem,
} from '@/services/queries';
import { getProgressBarColor } from '@/utils/budgetStatus';
import type { CategorySummary, Transaction } from '@/types';

interface CategoryTrendModalProps {
  category: CategorySummary;
  isOpen: boolean;
  onClose: () => void;
  year?: number;
  month?: number;
  type?: 'expense' | 'income';
}

export function CategoryTrendModal({
  category,
  isOpen,
  onClose,
  year,
  month,
  type = 'expense',
}: CategoryTrendModalProps) {
  const navigate = useNavigate();
  const { fetchCategoryTrend } = useTransactionStore();
  const categoryTrend = useTransactionStore(selectCategoryTrend);
  const [topTransactions, setTopTransactions] = useState<Transaction[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdownItem[]>([]);
  const [showPaymentBreakdown, setShowPaymentBreakdown] = useState(false);

  // Use current date if year/month not provided
  const currentDate = new Date();
  const targetYear = year ?? currentDate.getFullYear();
  const targetMonth = month ?? currentDate.getMonth() + 1;

  useEffect(() => {
    if (isOpen && category.categoryId) {
      fetchCategoryTrend(category.categoryId, 6);
      // Fetch TOP5 transactions
      getTopTransactionsByCategory(targetYear, targetMonth, category.categoryId, 5)
        .then(setTopTransactions);
      // Fetch payment method breakdown (지출인 경우만)
      if (type === 'expense') {
        getCategoryPaymentBreakdown(targetYear, targetMonth, category.categoryId)
          .then(setPaymentBreakdown);
      }
    }
  }, [isOpen, category.categoryId, fetchCategoryTrend, targetYear, targetMonth, type]);

  if (!isOpen) return null;

  // Calculate trend stats
  const totalAmount = categoryTrend.reduce((sum, t) => sum + t.amount, 0);
  const avgAmount = categoryTrend.length > 0
    ? Math.round(totalAmount / categoryTrend.length)
    : 0;
  const maxMonth = categoryTrend.reduce(
    (max, t) => (t.amount > max.amount ? t : max),
    categoryTrend[0] || { month: 0, amount: 0 }
  );

  // 예산 정보
  const hasBudget = category.budget && category.budget > 0;
  const budgetPercent = category.budgetPercent ?? 0;
  const remaining = hasBudget ? Math.max(category.budget! - category.amount, 0) : 0;
  const isOverBudget = budgetPercent >= 100;

  // 액션 핸들러
  const handleViewHistory = () => {
    onClose();
    navigate(`/history?categoryId=${category.categoryId}`);
  };

  const handleAdjustBudget = () => {
    onClose();
    navigate('/settings/category-budget');
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
              style={{ backgroundColor: `${category.categoryColor}20` }}
            >
              <Icon
                name={category.categoryIcon}
                size={20}
                style={{ color: category.categoryColor }}
              />
            </div>
            <div>
              <h3 className="text-title text-ink-black">{category.categoryName}</h3>
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

        {/* Budget Status (예산 설정된 경우만) */}
        {hasBudget && type === 'expense' && (
          <div className="px-6 py-4 border-b border-paper-mid">
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-sub text-ink-mid">
                {targetMonth}월 예산 현황
              </p>
              <p className="text-body text-ink-black">
                {category.amount.toLocaleString()} / {category.budget!.toLocaleString()}원
              </p>
            </div>
            <div className="h-2 bg-paper-mid rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(budgetPercent, 100)}%`,
                  backgroundColor: getProgressBarColor(budgetPercent, category.categoryColor),
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <p className={`text-caption ${isOverBudget ? 'text-red-500' : 'text-ink-light'}`}>
                {isOverBudget
                  ? `${(category.amount - category.budget!).toLocaleString()}원 초과`
                  : `${remaining.toLocaleString()}원 남음`
                }
              </p>
              <p className={`text-caption ${isOverBudget ? 'text-red-500' : budgetPercent >= 80 ? 'text-amber-500' : 'text-ink-mid'}`}>
                {budgetPercent}%
              </p>
            </div>
          </div>
        )}

        {/* Payment Method Breakdown (지출인 경우만) */}
        {type === 'expense' && paymentBreakdown.length > 0 && (
          <div className="px-6 py-4 border-b border-paper-mid">
            <button
              onClick={() => setShowPaymentBreakdown(!showPaymentBreakdown)}
              className="w-full flex justify-between items-center"
            >
              <p className="text-sub text-ink-mid">결제수단별</p>
              <ChevronRight
                size={16}
                className={`text-ink-light transition-transform duration-200 ${showPaymentBreakdown ? 'rotate-90' : ''}`}
              />
            </button>

            {showPaymentBreakdown && (
              <div className="mt-3 space-y-2">
                {paymentBreakdown.map((pm) => (
                  <div key={pm.paymentMethodId} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${pm.paymentMethodColor}20` }}
                    >
                      <Icon
                        name={pm.paymentMethodIcon}
                        size={12}
                        style={{ color: pm.paymentMethodColor }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sub text-ink-dark truncate">
                          {pm.paymentMethodName}
                        </span>
                        <span className="text-sub text-ink-black">
                          {pm.amount.toLocaleString()}원
                        </span>
                      </div>
                      <div className="h-1 bg-paper-mid rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pm.percentage}%`,
                            backgroundColor: pm.paymentMethodColor,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-caption text-ink-light w-10 text-right">
                      {Math.round(pm.percentage)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        <div className="px-6 py-4">
          <CategoryTrendChart data={categoryTrend} height={180} />
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

        {/* Action Links (담담한 스타일) */}
        {type === 'expense' && (
          <div className="px-6 pb-6 flex justify-center gap-6">
            <button
              onClick={handleViewHistory}
              className="text-sub text-ink-mid underline underline-offset-2"
            >
              내역 보기
            </button>
            {hasBudget && (
              <button
                onClick={handleAdjustBudget}
                className="text-sub text-ink-mid underline underline-offset-2"
              >
                예산 조정
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
