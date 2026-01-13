/**
 * UpcomingSummary - 예정 거래 요약 컴포넌트
 *
 * 예정 거래 타임라인 표시
 */

import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Icon } from '@/components/common';
import type { UpcomingDetailData } from '@/types';

interface UpcomingSummaryProps {
  data: UpcomingDetailData;
}

export function UpcomingSummary({ data }: UpcomingSummaryProps) {
  return (
    <div className="space-y-4">
      {/* 요약 정보 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-paper-white rounded-lg p-3 text-center">
          <p className="text-caption text-ink-light">예정 건수</p>
          <p className="text-sub font-medium text-ink-black mt-1">
            {data.totalCount}건
          </p>
        </div>
        <div className="bg-paper-white rounded-lg p-3 text-center">
          <p className="text-caption text-ink-light">예정 지출</p>
          <p className="text-sub font-medium text-ink-black mt-1">
            -{data.totalExpense.toLocaleString()}
          </p>
        </div>
        <div className="bg-paper-white rounded-lg p-3 text-center">
          <p className="text-caption text-ink-light">예정 수입</p>
          <p className="text-sub font-medium text-semantic-positive mt-1">
            +{data.totalIncome.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 순 영향 */}
      <div className="bg-paper-white rounded-lg p-3 text-center">
        <p className="text-caption text-ink-light mb-1">순 영향</p>
        <p className={`text-body font-medium ${
          data.netImpact >= 0 ? 'text-semantic-positive' : 'text-ink-black'
        }`}>
          {data.netImpact >= 0 ? '+' : ''}{data.netImpact.toLocaleString()}원
        </p>
      </div>

      {/* 예정 거래 미리보기 (최대 3건) */}
      {data.items.length > 0 && (
        <div className="bg-paper-white rounded-lg p-3 space-y-2">
          <p className="text-caption text-ink-light mb-2">다가오는 예정</p>
          {data.items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${item.categoryColor}15` }}
              >
                <Icon name={item.categoryIcon} size={14} style={{ color: item.categoryColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sub text-ink-dark truncate">
                  {item.memo || item.categoryName}
                </p>
                <div className="flex items-center gap-1">
                  <Calendar size={10} className="text-ink-light" />
                  <span className="text-caption text-ink-light">
                    {format(item.scheduledDate, 'M/d (E)', { locale: ko })}
                  </span>
                </div>
              </div>
              <span className={`text-sub whitespace-nowrap ${
                item.type === 'income' ? 'text-semantic-positive' : 'text-ink-dark'
              }`}>
                {item.type === 'income' ? '+' : ''}{item.amount.toLocaleString()}원
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 인사이트 메시지 */}
      <p className="text-sub text-ink-mid bg-paper-white rounded-lg p-3">
        {data.insightMessage}
      </p>
    </div>
  );
}
