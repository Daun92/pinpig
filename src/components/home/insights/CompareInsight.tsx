/**
 * CompareInsight - 전월 대비 카드
 *
 * 지난달과 비교하여 변화가 큰 카테고리 표시
 * 예산 미설정 시 주로 사용
 */

import { TrendingUp, TrendingDown } from 'lucide-react';
import { Icon } from '@/components/common';
import { InsightCardWrapper } from './InsightCardWrapper';
import type { MonthCompareItem } from '@/services/queries';

interface CompareInsightProps {
  increases: MonthCompareItem[];
  decreases: MonthCompareItem[];
  onNavigate: (path: string) => void;
}

export function CompareInsight({ increases, decreases, onNavigate }: CompareInsightProps) {
  const hasData = increases.length > 0 || decreases.length > 0;

  if (!hasData) return null;

  // 카드 전체 클릭: 첫 번째 변화 카테고리의 상세 뷰로 이동
  const handleCardClick = () => {
    const firstItem = increases[0] || decreases[0];
    if (firstItem) {
      onNavigate(`/history?insight=compare&categoryId=${firstItem.categoryId}`);
    }
  };

  // 변화 아이템 렌더러
  const renderItem = (item: MonthCompareItem, isIncrease: boolean) => (
    <button
      key={item.categoryId}
      onClick={(e) => {
        e.stopPropagation();
        onNavigate(`/history?insight=compare&categoryId=${item.categoryId}`);
      }}
      className="flex items-center gap-3 py-2"
    >
      {/* 아이콘 */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${item.categoryColor}15` }}
      >
        <Icon name={item.categoryIcon} size={16} style={{ color: item.categoryColor }} />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <span className="text-sub text-ink-dark">{item.categoryName}</span>
      </div>

      {/* 변화 */}
      <div className="flex items-center gap-1">
        {isIncrease ? (
          <TrendingUp size={14} className="text-semantic-caution" />
        ) : (
          <TrendingDown size={14} className="text-semantic-positive" />
        )}
        <span className={`text-sub ${isIncrease ? 'text-semantic-caution' : 'text-semantic-positive'}`}>
          {isIncrease ? '+' : ''}{item.difference.toLocaleString()}원
        </span>
      </div>
    </button>
  );

  return (
    <InsightCardWrapper
      title="지난달과 비교하면"
      actionLabel="자세히"
      onClick={handleCardClick}
    >
      <div className="space-y-1">
        {/* 증가 항목 */}
        {increases.slice(0, 1).map((item) => renderItem(item, true))}

        {/* 감소 항목 */}
        {decreases.slice(0, 1).map((item) => renderItem(item, false))}
      </div>

      {/* 안내 문구 */}
      <p className="text-caption text-ink-light mt-2">
        {increases.length > 0 && decreases.length > 0
          ? '카테고리별 변화를 확인해보세요'
          : increases.length > 0
            ? '지난달보다 늘어난 항목이 있어요'
            : '지난달보다 줄어든 항목이 있어요'}
      </p>
    </InsightCardWrapper>
  );
}
