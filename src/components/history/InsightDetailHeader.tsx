/**
 * InsightDetailHeader - 인사이트 상세 뷰 헤더
 *
 * 홈 인사이트 카드에서 연결된 상세 정보 표시
 * 히스토리 페이지 상단에 표시되며, 닫기 버튼으로 일반 목록으로 전환
 */

import { X } from 'lucide-react';
import { Icon } from '@/components/common';
import type { InsightType } from '@/types';

interface InsightDetailHeaderProps {
  type: InsightType;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  children: React.ReactNode;
  onDismiss: () => void;
}

const INSIGHT_TITLES: Record<InsightType, string> = {
  caution: '주의 포인트',
  room: '여유 있는 곳',
  interest: '이번 달 관심',
  compare: '전월 대비',
  upcoming: '이번 달 예정',
};

export function InsightDetailHeader({
  type,
  categoryName,
  categoryIcon,
  categoryColor,
  children,
  onDismiss,
}: InsightDetailHeaderProps) {
  const title = INSIGHT_TITLES[type];

  return (
    <div className="bg-paper-light border-b border-paper-mid">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {categoryIcon && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${categoryColor}15` }}
            >
              <Icon
                name={categoryIcon}
                size={16}
                style={{ color: categoryColor }}
              />
            </div>
          )}
          <div>
            <p className="text-caption text-ink-light">{title}</p>
            {categoryName && (
              <p className="text-body font-medium text-ink-black">{categoryName}</p>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-paper-mid/50 text-ink-mid"
        >
          <X size={16} />
        </button>
      </div>

      {/* 인사이트 요약 콘텐츠 */}
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );
}
