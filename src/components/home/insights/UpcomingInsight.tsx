/**
 * UpcomingInsight - 예정 알림 카드
 *
 * 이번 달 남은 예정 거래 표시
 * 반복 거래 기반
 */

import { Calendar } from 'lucide-react';
import { Icon } from '@/components/common';
import { InsightCardWrapper } from './InsightCardWrapper';
import type { UpcomingItem } from '@/services/queries';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface UpcomingInsightProps {
  items: UpcomingItem[];
  totalExpense: number;
  totalIncome: number;
  onNavigate: (path: string) => void;
}

export function UpcomingInsight({
  items,
  totalExpense,
  totalIncome,
  onNavigate,
}: UpcomingInsightProps) {
  if (items.length === 0) return null;

  return (
    <InsightCardWrapper
      title="이번 달 예정"
      actionLabel="자세히"
      onClick={() => onNavigate('/history?insight=upcoming')}
    >
      <div className="space-y-2">
        {items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 py-1"
          >
            {/* 아이콘 */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${item.categoryColor}15` }}
            >
              <Icon name={item.categoryIcon} size={14} style={{ color: item.categoryColor }} />
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sub text-ink-dark truncate">
                  {item.memo || item.categoryName}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Calendar size={10} className="text-ink-light" />
                <span className="text-caption text-ink-light">
                  {format(item.scheduledDate, 'M/d (E)', { locale: ko })}
                </span>
              </div>
            </div>

            {/* 금액 */}
            <span className={`text-sub whitespace-nowrap ${
              item.type === 'income' ? 'text-semantic-positive' : 'text-ink-dark'
            }`}>
              {item.type === 'income' ? '+' : ''}{item.amount.toLocaleString()}원
            </span>
          </div>
        ))}
      </div>

      {/* 요약 */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-paper-mid">
        <span className="text-caption text-ink-light">
          {items.length}건 예정
        </span>
        <div className="flex items-center gap-2">
          {totalIncome > 0 && (
            <span className="text-caption text-semantic-positive">
              +{totalIncome.toLocaleString()}
            </span>
          )}
          {totalExpense > 0 && (
            <span className="text-caption text-ink-mid">
              -{totalExpense.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </InsightCardWrapper>
  );
}
