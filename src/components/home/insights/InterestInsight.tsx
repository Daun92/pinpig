/**
 * InterestInsight - 이번 달 관심 카드
 *
 * TOP 소비 카테고리 표시
 * 톤: 중립적 관찰 ("이번 달 관심이 향한 곳")
 */

import { Icon } from '@/components/common';
import { InsightCardWrapper } from './InsightCardWrapper';
import type { CategorySummary } from '@/types';

interface InterestInsightProps {
  categories: CategorySummary[];
  onNavigate: (path: string) => void;
}

export function InterestInsight({ categories, onNavigate }: InterestInsightProps) {
  if (categories.length === 0) return null;

  const top2 = categories.slice(0, 2);

  // 카드 전체 클릭: 첫 번째 카테고리의 상세 뷰로 이동
  const handleCardClick = () => {
    if (categories.length > 0) {
      onNavigate(`/history?insight=interest&categoryId=${categories[0].categoryId}`);
    }
  };

  return (
    <InsightCardWrapper
      title="이번 달 관심"
      actionLabel="분석 보기"
      onClick={handleCardClick}
    >
      <div className="flex gap-3">
        {top2.map((cat) => (
          <button
            key={cat.categoryId}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(`/history?insight=interest&categoryId=${cat.categoryId}`);
            }}
            className="flex-1 bg-paper-white/60 rounded-lg p-3 text-center
              active:bg-paper-mid transition-colors"
          >
            {/* 아이콘 */}
            <div
              className="w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2"
              style={{ backgroundColor: `${cat.categoryColor}15` }}
            >
              <Icon name={cat.categoryIcon} size={20} style={{ color: cat.categoryColor }} />
            </div>

            {/* 카테고리명 */}
            <p className="text-sub text-ink-dark font-medium">{cat.categoryName}</p>

            {/* 횟수 */}
            <p className="text-caption text-ink-light mt-0.5">{cat.count}회</p>

            {/* 금액 */}
            <p className="text-sub text-ink-mid mt-1">
              {cat.amount.toLocaleString()}원
            </p>
          </button>
        ))}
      </div>
    </InsightCardWrapper>
  );
}
