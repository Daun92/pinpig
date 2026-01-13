import { useEffect, useState } from 'react';
import { Lightbulb, TrendingDown, AlertTriangle, AlertCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getBudgetInsight, getOverBudgetCategories, type BudgetInsight, type OverBudgetCategory } from '@/services/budgetAlert';
import { Icon } from '@/components/common';
import type { BudgetStatus } from '@/types';

interface BudgetInsightCardProps {
  budgetStatus: BudgetStatus;
  className?: string;
}

const typeStyles: Record<BudgetInsight['type'], {
  bg: string;
  iconColor: string;
  progressColor: string;
}> = {
  normal: {
    bg: 'bg-paper-light',
    iconColor: 'text-ink-mid',
    progressColor: 'bg-semantic-positive',
  },
  caution: {
    bg: 'bg-paper-light',
    iconColor: 'text-ink-mid',
    progressColor: 'bg-ink-black',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    progressColor: 'bg-amber-500',
  },
  danger: {
    bg: 'bg-semantic-negative/10',
    iconColor: 'text-semantic-negative',
    progressColor: 'bg-semantic-negative',
  },
};

export function BudgetInsightCard({ budgetStatus, className = '' }: BudgetInsightCardProps) {
  const navigate = useNavigate();
  const [overCategories, setOverCategories] = useState<OverBudgetCategory[]>([]);
  const insight = getBudgetInsight(budgetStatus);
  const style = typeStyles[insight.type];

  const { percentUsed, monthlyBudget } = budgetStatus;

  // 초과 카테고리 조회
  useEffect(() => {
    const now = new Date();
    getOverBudgetCategories(now.getFullYear(), now.getMonth() + 1)
      .then(setOverCategories);
  }, [budgetStatus]);

  // 예산이 설정되지 않은 경우
  if (monthlyBudget <= 0) {
    return (
      <button
        onClick={() => navigate('/budget-wizard')}
        className={`w-full p-4 rounded-xl bg-paper-light text-left ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-paper-mid flex items-center justify-center">
            <Lightbulb size={20} className="text-ink-mid" />
          </div>
          <div className="flex-1">
            <p className="text-body text-ink-dark">예산을 설정하면 관리가 쉬워져요</p>
            <p className="text-sub text-ink-light mt-0.5">예산 설정하기</p>
          </div>
          <ChevronRight size={20} className="text-ink-light" />
        </div>
      </button>
    );
  }

  const InsightIcon = insight.type === 'danger' ? AlertCircle :
                       insight.type === 'warning' ? AlertTriangle :
                       insight.type === 'caution' ? TrendingDown :
                       Lightbulb;

  return (
    <div className={`rounded-xl ${style.bg} ${className}`}>
      {/* 메인 인사이트 */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full bg-paper-white/50 flex items-center justify-center shrink-0`}>
            <InsightIcon size={20} className={style.iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body text-ink-dark">{insight.message}</p>
            {insight.subMessage && (
              <p className="text-sub text-ink-mid mt-0.5">{insight.subMessage}</p>
            )}

            {/* 진행률 바 */}
            <div className="mt-3 h-1.5 bg-paper-white/50 rounded-full overflow-hidden">
              <div
                className={`h-full ${style.progressColor} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
            <p className="text-caption text-ink-light mt-1">
              예산의 {Math.round(percentUsed)}% 사용
            </p>
          </div>
        </div>
      </div>

      {/* 초과 카테고리 목록 */}
      {overCategories.length > 0 && (
        <div className="border-t border-paper-mid/50 px-4 py-3">
          <p className="text-caption text-ink-mid mb-2">초과한 카테고리</p>
          <div className="flex flex-wrap gap-2">
            {overCategories.slice(0, 3).map((cat) => (
              <button
                key={cat.categoryId}
                onClick={() => navigate(`/settings/categories/${cat.categoryId}`)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-semantic-negative/10 text-semantic-negative"
              >
                <Icon name={cat.categoryIcon} size={14} />
                <span className="text-caption">{cat.categoryName}</span>
                <span className="text-caption opacity-70">
                  +{cat.overAmount.toLocaleString()}원
                </span>
              </button>
            ))}
            {overCategories.length > 3 && (
              <span className="text-caption text-ink-light px-2 py-1.5">
                +{overCategories.length - 3}개
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
