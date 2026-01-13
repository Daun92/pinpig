/**
 * BudgetCtaInsight - 예산 설정 유도 카드
 *
 * 예산 미설정 시 표시
 * 톤: 부드러운 유도 ("예산을 설정하면 더 많은 걸 알려드릴 수 있어요")
 */

import { Sparkles } from 'lucide-react';
import { InsightCardWrapper } from './InsightCardWrapper';

interface BudgetCtaInsightProps {
  variant: 'budget' | 'category-budget';
  onNavigate: (path: string) => void;
}

export function BudgetCtaInsight({ variant, onNavigate }: BudgetCtaInsightProps) {
  const config = {
    budget: {
      title: '예산을 설정하면',
      description: '남은 돈과 주의할 곳을',
      subDescription: '알려드릴 수 있어요',
      actionLabel: '예산 설정하기',
      navigateTo: '/settings/budget-wizard',
    },
    'category-budget': {
      title: '카테고리 예산을 설정하면',
      description: '어디에 신경 쓸지',
      subDescription: '알려드릴 수 있어요',
      actionLabel: '카테고리 예산 설정',
      navigateTo: '/settings/category-budget',
    },
  }[variant];

  return (
    <InsightCardWrapper
      title={config.title}
      actionLabel={config.actionLabel}
      onClick={() => onNavigate(config.navigateTo)}
      variant="cta"
    >
      <div className="flex items-center gap-4 py-2">
        {/* 아이콘 */}
        <div className="w-12 h-12 rounded-full bg-paper-mid flex items-center justify-center flex-shrink-0">
          <Sparkles size={24} className="text-ink-mid" />
        </div>

        {/* 설명 */}
        <div className="flex-1">
          <p className="text-body text-ink-dark">{config.description}</p>
          <p className="text-sub text-ink-mid mt-0.5">{config.subDescription}</p>
        </div>
      </div>
    </InsightCardWrapper>
  );
}
