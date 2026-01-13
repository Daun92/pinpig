/**
 * CompareSummary - 전월 대비 요약 컴포넌트
 *
 * 전월과의 비교 상세 정보 표시
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { CompareDetailData } from '@/types';

interface CompareSummaryProps {
  data: CompareDetailData;
}

export function CompareSummary({ data }: CompareSummaryProps) {
  const TrendIcon = data.isIncrease
    ? TrendingUp
    : data.difference < 0
      ? TrendingDown
      : Minus;

  const trendColor = data.isIncrease
    ? 'text-semantic-caution'
    : data.difference < 0
      ? 'text-semantic-positive'
      : 'text-ink-mid';

  return (
    <div className="space-y-4">
      {/* 비교 카드 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 이번 달 */}
        <div className="bg-paper-white rounded-lg p-3">
          <p className="text-caption text-ink-light mb-1">
            {data.currentMonth.month}월
          </p>
          <p className="text-body font-medium text-ink-black">
            {data.currentMonth.amount.toLocaleString()}원
          </p>
          <p className="text-caption text-ink-light mt-1">
            {data.currentMonth.count}건
          </p>
        </div>

        {/* 지난 달 */}
        <div className="bg-paper-white rounded-lg p-3">
          <p className="text-caption text-ink-light mb-1">
            {data.lastMonth.month}월
          </p>
          <p className="text-body font-medium text-ink-black">
            {data.lastMonth.amount.toLocaleString()}원
          </p>
          <p className="text-caption text-ink-light mt-1">
            {data.lastMonth.count}건
          </p>
        </div>
      </div>

      {/* 변화량 */}
      <div className="bg-paper-white rounded-lg p-4 flex items-center justify-center gap-2">
        <TrendIcon size={20} className={trendColor} />
        <span className={`text-body font-medium ${trendColor}`}>
          {data.difference > 0 ? '+' : ''}
          {data.difference.toLocaleString()}원
        </span>
        <span className={`text-sub ${trendColor}`}>
          ({data.percentChange > 0 ? '+' : ''}
          {data.percentChange}%)
        </span>
      </div>

      {/* 인사이트 메시지 */}
      <p className="text-sub text-ink-mid bg-paper-white rounded-lg p-3">
        {data.insightMessage}
      </p>
    </div>
  );
}
