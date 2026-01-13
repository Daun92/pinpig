/**
 * RoomInsight - 여유 영역 카드
 *
 * 예산 50% 미만인 카테고리 표시
 * 톤: 긍정적 가이드 ("여기는 아직 여유 있어요")
 */

import { Icon } from '@/components/common';
import { InsightCardWrapper } from './InsightCardWrapper';
import type { CategoryBudgetStatus } from '@/services/queries';

interface RoomInsightProps {
  categories: CategoryBudgetStatus[];
  onNavigate: (path: string) => void;
}

export function RoomInsight({ categories, onNavigate }: RoomInsightProps) {
  if (categories.length === 0) return null;

  // 카드 전체 클릭: 첫 번째 카테고리의 상세 뷰로 이동
  const handleCardClick = () => {
    if (categories.length > 0) {
      onNavigate(`/history?insight=room&categoryId=${categories[0].categoryId}`);
    }
  };

  return (
    <InsightCardWrapper
      title="여유 있는 곳"
      actionLabel="자세히"
      onClick={handleCardClick}
    >
      <div className="space-y-3">
        {categories.slice(0, 2).map((cat) => (
          <button
            key={cat.categoryId}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(`/history?insight=room&categoryId=${cat.categoryId}`);
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

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sub text-ink-dark">{cat.categoryName}</span>
                <span className="text-caption text-ink-mid">{cat.percentUsed}%</span>
              </div>
              <div className="h-1.5 bg-paper-mid rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${cat.percentUsed}%`,
                    backgroundColor: cat.categoryColor,
                  }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 남은 금액 표시 */}
      {categories.length > 0 && (
        <p className="text-caption text-ink-light mt-3">
          {categories.length === 1
            ? `${categories[0].categoryName}에 ${categories[0].remaining.toLocaleString()}원 여유`
            : '아직 여유 있는 카테고리들이에요'}
        </p>
      )}
    </InsightCardWrapper>
  );
}
