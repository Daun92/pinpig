/**
 * RoomSummary - 여유 영역 요약 컴포넌트
 *
 * 여유 있는 카테고리의 상세 현황
 */

import type { RoomDetailData } from '@/types';

interface RoomSummaryProps {
  data: RoomDetailData;
}

export function RoomSummary({ data }: RoomSummaryProps) {
  return (
    <div className="space-y-4">
      {/* 예산 현황 */}
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sub text-ink-mid">
            예산 {data.budgetAmount.toLocaleString()}원 중
          </span>
          <span className="text-body font-medium text-ink-black">
            {data.currentSpent.toLocaleString()}원 사용
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div className="h-2 bg-paper-mid rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${data.percentUsed}%`,
              backgroundColor: data.categoryColor,
            }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-caption text-ink-light">{data.percentUsed}%</span>
        </div>
      </div>

      {/* 여유 금액 강조 */}
      <div className="bg-paper-white rounded-lg p-4 text-center">
        <p className="text-caption text-ink-light mb-1">남은 여유</p>
        <p className="text-amount font-medium text-semantic-positive">
          {data.remaining.toLocaleString()}원
        </p>
        {data.lastMonthSamePoint !== undefined && (
          <p className="text-caption text-ink-light mt-2">
            지난달 이맘때: {data.lastMonthSamePoint.toLocaleString()}원 사용
          </p>
        )}
      </div>

      {/* 인사이트 메시지 */}
      <p className="text-sub text-ink-mid bg-paper-white rounded-lg p-3">
        {data.insightMessage}
      </p>
    </div>
  );
}
