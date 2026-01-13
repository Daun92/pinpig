/**
 * CautionInsight - 주의 포인트 카드
 *
 * 예산 70% 이상 도달한 카테고리 표시
 * 톤: 경고가 아닌 가이드 ("여기 좀 신경 쓰면 좋겠어요")
 */

import { Icon } from '@/components/common';
import { InsightCardWrapper } from './InsightCardWrapper';
import type { CategoryBudgetStatus } from '@/services/queries';

interface CautionInsightProps {
  categories: CategoryBudgetStatus[];
  onNavigate: (path: string) => void;
}

export function CautionInsight({ categories, onNavigate }: CautionInsightProps) {
  if (categories.length === 0) return null;

  // 카드 전체 클릭: 첫 번째 카테고리의 상세 뷰로 이동
  const handleCardClick = () => {
    if (categories.length > 0) {
      onNavigate(`/history?insight=caution&categoryId=${categories[0].categoryId}`);
    }
  };

  return (
    <InsightCardWrapper
      title="주의 포인트"
      actionLabel="자세히"
      onClick={handleCardClick}
    >
      <div className="space-y-3">
        {categories.slice(0, 2).map((cat) => (
          <button
            key={cat.categoryId}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(`/history?insight=caution&categoryId=${cat.categoryId}`);
            }}
            className="w-full flex items-center gap-3 group"
          >
            {/* 아이콘 */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${cat.categoryColor}15` }}
            >
              <Icon name={cat.categoryIcon} size={16} style={{ color: cat.categoryColor }} />
            </div>

            {/* 프로그레스 */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sub text-ink-dark">{cat.categoryName}</span>
                <span className="text-caption text-ink-mid">{cat.percentUsed}%</span>
              </div>
              <div className="h-1.5 bg-paper-mid rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(cat.percentUsed, 100)}%`,
                    backgroundColor: cat.percentUsed >= 100 ? '#EF4444' : cat.categoryColor,
                  }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 안내 문구 */}
      <p className="text-caption text-ink-light mt-3">
        {categories.length === 1
          ? '이 카테고리에 신경 쓰면 좋겠어요'
          : '이 카테고리들에 신경 쓰면 좋겠어요'}
      </p>
    </InsightCardWrapper>
  );
}
