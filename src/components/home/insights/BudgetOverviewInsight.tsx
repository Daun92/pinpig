/**
 * BudgetOverviewInsight - 예산 배분 현황 카드
 *
 * 카테고리별 예산 사용률 상위 3개 표시
 * 톤: 판단 없는 비춤 ("3개 카테고리 중 1개가 예산을 넘었어요")
 */

import { Icon } from '@/components/common';
import { InsightCardWrapper } from './InsightCardWrapper';
import type { BudgetOverviewItem } from '@/services/queries';

interface BudgetOverviewInsightProps {
  items: BudgetOverviewItem[];
  overBudgetCount: number;
  totalWithBudget: number;
  onNavigate: (path: string) => void;
}

export function BudgetOverviewInsight({
  items,
  overBudgetCount,
  totalWithBudget,
  onNavigate,
}: BudgetOverviewInsightProps) {
  if (items.length === 0) return null;

  // 카드 전체 클릭: Stats 페이지로 이동
  const handleCardClick = () => {
    onNavigate('/stats');
  };

  // 요약 문구 생성
  const getSummaryText = () => {
    if (overBudgetCount === 0) {
      return '모든 카테고리가 예산 내에 있어요';
    }
    if (overBudgetCount === totalWithBudget) {
      return '모든 카테고리가 예산을 넘었어요';
    }
    return `${totalWithBudget}개 카테고리 중 ${overBudgetCount}개가 예산을 넘었어요`;
  };

  return (
    <InsightCardWrapper
      title="예산 배분 현황"
      actionLabel="자세히"
      onClick={handleCardClick}
    >
      <div className="space-y-3">
        {items.slice(0, 3).map((item) => (
          <button
            key={item.categoryId}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(`/history?categoryId=${item.categoryId}`);
            }}
            className="w-full flex items-center gap-3 group"
          >
            {/* 아이콘 */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${item.categoryColor}15` }}
            >
              <Icon name={item.categoryIcon} size={16} style={{ color: item.categoryColor }} />
            </div>

            {/* 프로그레스 */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sub text-ink-dark">{item.categoryName}</span>
                <span className={`text-caption ${item.percentUsed >= 100 ? 'text-red-500' : 'text-ink-mid'}`}>
                  {item.percentUsed}%
                </span>
              </div>
              <div className="h-1.5 bg-paper-mid rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(item.percentUsed, 100)}%`,
                    backgroundColor: item.percentUsed >= 100 ? '#EF4444' : item.categoryColor,
                  }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 안내 문구 */}
      <p className="text-caption text-ink-light mt-3">
        {getSummaryText()}
      </p>
    </InsightCardWrapper>
  );
}
