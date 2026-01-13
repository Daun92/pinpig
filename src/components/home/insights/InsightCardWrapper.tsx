/**
 * InsightCardWrapper - 인사이트 카드 공통 래퍼
 *
 * 디자인 시스템:
 * - 배경: Paper Light (카드 배경)
 * - 테두리: 없음 또는 1px Paper Mid
 * - 모서리: 12px (md)
 * - 패딩: 20px
 * - 그림자: 없음 (평면적 = 종이 위 느낌)
 */

import { ChevronRight } from 'lucide-react';

interface InsightCardWrapperProps {
  title: string;
  actionLabel?: string;
  onClick?: () => void;
  variant?: 'default' | 'subtle' | 'cta';
  children: React.ReactNode;
}

export function InsightCardWrapper({
  title,
  actionLabel,
  onClick,
  variant = 'default',
  children,
}: InsightCardWrapperProps) {
  const bgClass = {
    default: 'bg-paper-light',
    subtle: 'bg-paper-white border border-paper-mid',
    cta: 'bg-paper-light border border-paper-mid border-dashed',
  }[variant];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={`w-full px-5 py-4 rounded-md text-left transition-all duration-150
        ${bgClass}
        ${onClick ? 'active:scale-[0.98] cursor-pointer' : 'cursor-default'}
      `}
    >
      {/* 헤더: 제목 + 액션 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-body font-medium text-ink-dark">{title}</h3>
        {actionLabel && onClick && (
          <div className="flex items-center gap-1 text-ink-light">
            <span className="text-caption">{actionLabel}</span>
            <ChevronRight size={14} />
          </div>
        )}
      </div>

      {/* 콘텐츠 */}
      {children}
    </div>
  );
}
