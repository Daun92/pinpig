/**
 * RecordSummaryInsight - 기록 현황 카드
 *
 * 첫 달 사용자용 (전월 데이터 없을 때)
 * 톤: 격려 ("기록이 쌓이면 더 많은 걸 보여드릴게요")
 */

import { BookOpen } from 'lucide-react';
import { InsightCardWrapper } from './InsightCardWrapper';

interface RecordSummaryInsightProps {
  transactionCount: number;
  totalExpense: number;
  totalIncome: number;
  onNavigate: (path: string) => void;
}

export function RecordSummaryInsight({
  transactionCount,
  totalExpense,
  totalIncome,
  onNavigate,
}: RecordSummaryInsightProps) {
  // 거래가 하나도 없으면 다른 메시지
  if (transactionCount === 0) {
    return (
      <InsightCardWrapper
        title="아직 기록이 없어요"
        actionLabel="첫 기록 남기기"
        onClick={() => onNavigate('/add')}
        variant="cta"
      >
        <div className="flex items-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-paper-mid flex items-center justify-center flex-shrink-0">
            <BookOpen size={24} className="text-ink-mid" />
          </div>
          <div className="flex-1">
            <p className="text-body text-ink-dark">첫 기록을 남기면</p>
            <p className="text-sub text-ink-mid mt-0.5">당신의 관심을 비춰드릴게요</p>
          </div>
        </div>
      </InsightCardWrapper>
    );
  }

  return (
    <InsightCardWrapper
      title="이번 달 기록"
      actionLabel="내역 보기"
      onClick={() => onNavigate('/history')}
    >
      <div className="py-2">
        {/* 기록 수 */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-amount text-ink-black">{transactionCount}건</span>
          <span className="text-sub text-ink-mid">기록됨</span>
        </div>

        {/* 수입/지출 요약 */}
        <div className="flex gap-4">
          {totalIncome > 0 && (
            <div>
              <p className="text-caption text-ink-light">수입</p>
              <p className="text-sub text-semantic-positive">
                +{totalIncome.toLocaleString()}원
              </p>
            </div>
          )}
          {totalExpense > 0 && (
            <div>
              <p className="text-caption text-ink-light">지출</p>
              <p className="text-sub text-ink-dark">
                {totalExpense.toLocaleString()}원
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 안내 문구 */}
      <p className="text-caption text-ink-light mt-2 pt-2 border-t border-paper-mid">
        기록이 쌓이면 더 많은 인사이트를 볼 수 있어요
      </p>
    </InsightCardWrapper>
  );
}
