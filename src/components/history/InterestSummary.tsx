/**
 * InterestSummary - 관심 카테고리 요약 컴포넌트
 *
 * 소비 패턴 분석 정보 표시
 */

import type { InterestDetailData } from '@/types';

interface InterestSummaryProps {
  data: InterestDetailData;
}

export function InterestSummary({ data }: InterestSummaryProps) {
  return (
    <div className="space-y-4">
      {/* 요약 정보 그리드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-paper-white rounded-lg p-3 text-center">
          <p className="text-caption text-ink-light">거래 횟수</p>
          <p className="text-sub font-medium text-ink-black mt-1">
            {data.totalCount}건
          </p>
        </div>
        <div className="bg-paper-white rounded-lg p-3 text-center">
          <p className="text-caption text-ink-light">총 금액</p>
          <p className="text-sub font-medium text-ink-black mt-1">
            {data.totalAmount.toLocaleString()}원
          </p>
        </div>
        <div className="bg-paper-white rounded-lg p-3 text-center">
          <p className="text-caption text-ink-light">평균</p>
          <p className="text-sub font-medium text-ink-black mt-1">
            {data.averageAmount.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 패턴 정보 */}
      {(data.peakDayOfWeek || data.peakTimeRange) && (
        <div className="bg-paper-white rounded-lg p-3">
          <p className="text-caption text-ink-light mb-2">소비 패턴</p>
          <div className="flex gap-4">
            {data.peakDayOfWeek && (
              <div>
                <span className="text-sub text-ink-mid">주로 </span>
                <span className="text-sub font-medium text-ink-black">
                  {data.peakDayOfWeek}
                </span>
              </div>
            )}
            {data.peakTimeRange && (
              <div>
                <span className="text-sub text-ink-mid">주로 </span>
                <span className="text-sub font-medium text-ink-black">
                  {data.peakTimeRange}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 인사이트 메시지 */}
      <p className="text-sub text-ink-mid bg-paper-white rounded-lg p-3">
        {data.insightMessage}
      </p>
    </div>
  );
}
