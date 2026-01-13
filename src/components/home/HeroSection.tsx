/**
 * HeroSection - 예산 현황 히어로 영역
 *
 * 캐러셀 없이 예산 현황만 표시하는 단일 뷰 컴포넌트입니다.
 */

import { formatCurrency } from '@/utils/format';
import { getBudgetInsight } from '@/services/budgetAlert';
import type { BudgetStatus } from '@/types';

interface HeroSectionProps {
  budgetStatus: BudgetStatus;
  remaining: number;
  dailyRecommended: number;
  currentDateLabel: string;
}

export function HeroSection({
  budgetStatus,
  remaining,
  dailyRecommended,
  currentDateLabel,
}: HeroSectionProps) {
  const { percentUsed, remainingDays, monthlyBudget } = budgetStatus;
  const insight = getBudgetInsight(budgetStatus);

  const progressColor =
    insight.type === 'danger'
      ? 'bg-semantic-negative'
      : insight.type === 'warning'
      ? 'bg-amber-500'
      : 'bg-ink-black';

  return (
    <div className="text-center px-6" data-tour="home-hero">
      {/* 날짜 */}
      <span className="text-sub text-ink-mid">{currentDateLabel}</span>

      {/* Hero Amount */}
      <div className="mt-2">
        <h1 className="text-hero text-ink-black">
          {formatCurrency(remaining >= 0 ? remaining : 0)}
        </h1>
        <p className="text-sub text-ink-mid mt-1">이번 달 쓸 수 있는 돈</p>
      </div>

      {/* Progress Bar */}
      <div className="mt-5 mx-4">
        <div className="h-1.5 bg-paper-mid rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColor} rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* 인사이트 메시지 */}
      <div className="mt-3" data-tour="home-daily">
        <p
          className={`text-body ${
            insight.type === 'danger'
              ? 'text-semantic-negative'
              : insight.type === 'warning'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-ink-dark'
          }`}
        >
          {insight.message}
        </p>
        {monthlyBudget > 0 && (
          <p className="text-sub text-ink-mid mt-1">
            {remainingDays}일 남음 · 하루 {formatCurrency(dailyRecommended)}
          </p>
        )}
      </div>
    </div>
  );
}
