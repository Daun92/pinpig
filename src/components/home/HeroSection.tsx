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
  /** 남은 예산에서 이미 빠진 예정 지출 (수동 선입력 + 반복 예상) */
  upcomingExpense?: number;
}

export function HeroSection({
  budgetStatus,
  remaining,
  dailyRecommended,
  currentDateLabel,
  upcomingExpense = 0,
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
        {/* 초과분은 히어로 금액이 0으로 잘려 사라지므로 여기서만 알 수 있다.
            나머지 단계의 subMessage는 위 "N일 남음 · 하루 M원"과 중복이라 쓰지 않는다 */}
        {insight.type === 'danger' && insight.subMessage && (
          <p className="text-sub text-semantic-negative mt-1">{insight.subMessage}</p>
        )}
        {/* 금액이 줄어든 이유를 밝힌다 — 예정 지출은 아직 나가지 않았지만 이미 빠져 있다 */}
        {upcomingExpense > 0 && (
          <p className="text-caption text-ink-light mt-1">
            예정 {formatCurrency(upcomingExpense)} 포함
          </p>
        )}
      </div>
    </div>
  );
}
