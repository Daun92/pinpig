/**
 * CautionSummary - 주의 포인트 요약 컴포넌트
 *
 * 예산 초과 위험 카테고리의 상세 현황
 */

import type { CautionDetailData } from '@/types';

interface CautionSummaryProps {
  data: CautionDetailData;
}

export function CautionSummary({ data }: CautionSummaryProps) {
  const progressColor = data.percentUsed >= 100 ? '#EF4444' : data.categoryColor;

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
              width: `${Math.min(data.percentUsed, 100)}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-caption text-ink-light">{data.percentUsed}%</span>
        </div>
      </div>

      {/* 요약 정보 그리드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-paper-white rounded-lg p-3 text-center">
          <p className="text-caption text-ink-light">남은 예산</p>
          <p className="text-sub font-medium text-ink-black mt-1">
            {data.remaining.toLocaleString()}원
          </p>
        </div>
        <div className="bg-paper-white rounded-lg p-3 text-center">
          <p className="text-caption text-ink-light">남은 일수</p>
          <p className="text-sub font-medium text-ink-black mt-1">
            {data.remainingDays}일
          </p>
        </div>
        <div className="bg-paper-white rounded-lg p-3 text-center">
          <p className="text-caption text-ink-light">일평균 권장</p>
          <p className="text-sub font-medium text-ink-black mt-1">
            {data.dailyRecommended.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 인사이트 메시지 */}
      <p className="text-sub text-ink-mid bg-paper-white rounded-lg p-3">
        {data.insightMessage}
      </p>
    </div>
  );
}
