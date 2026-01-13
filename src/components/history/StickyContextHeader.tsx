import { useMemo } from 'react';
import type { ScrollSpySection } from '@/hooks/useScrollSpy';

interface StickyContextHeaderProps {
  activeMonth: ScrollSpySection | null;
  activeDate: ScrollSpySection | null;
  previousMonth: ScrollSpySection | null;
  previousDate: ScrollSpySection | null;
  isTransitioning: boolean;
  transitionDirection: 'up' | 'down' | null;
  isSearchMode: boolean;
  hasFilters: boolean;
  // Fallback for single month view when scroll spy hasn't detected sections yet
  fallbackMonth?: {
    label: string;
    summary: {
      income: number;
      expense: number;
      net: number;
      transactionCount: number;
    };
  };
  // Search/filter result count
  filteredCount?: number;
  searchQuery?: string;
}

export function StickyContextHeader({
  activeMonth,
  activeDate,
  previousMonth,
  previousDate,
  isTransitioning,
  transitionDirection,
  isSearchMode,
  hasFilters,
  fallbackMonth,
  filteredCount,
  searchQuery,
}: StickyContextHeaderProps) {
  // Calculate sticky position based on header (56px) + filter bar (~52px) = 108px
  const stickyTop = 108;

  // Use active month from scroll spy, or fallback for single month view
  const displayMonth = useMemo(() => {
    if (activeMonth) return activeMonth;
    if (fallbackMonth) {
      return {
        id: 'fallback',
        type: 'month' as const,
        label: fallbackMonth.label,
        summary: fallbackMonth.summary,
      };
    }
    return null;
  }, [activeMonth, fallbackMonth]);

  // Determine which content to show
  const showMonthHeader = isSearchMode || displayMonth !== null;
  const showDateHeader = activeDate !== null;

  // Animation classes for escalator effect
  const getMonthTransitionClass = useMemo(() => {
    if (!isTransitioning || !previousMonth || previousMonth.id === activeMonth?.id) {
      return 'translate-y-0 opacity-100';
    }
    if (transitionDirection === 'down') {
      // Scrolling down: new month slides in from bottom
      return 'animate-slide-in-up';
    } else {
      // Scrolling up: new month slides in from top
      return 'animate-slide-in-down';
    }
  }, [isTransitioning, transitionDirection, previousMonth, activeMonth]);

  const getDateTransitionClass = useMemo(() => {
    if (!isTransitioning || !previousDate || previousDate.id === activeDate?.id) {
      return 'translate-y-0 opacity-100';
    }
    if (transitionDirection === 'down') {
      return 'animate-slide-in-up';
    } else {
      return 'animate-slide-in-down';
    }
  }, [isTransitioning, transitionDirection, previousDate, activeDate]);

  // Don't render if no active sections
  if (!displayMonth && !activeDate) {
    return null;
  }

  return (
    <div
      className="sticky z-[18] bg-paper-white border-b border-paper-mid shadow-sm overflow-hidden"
      style={{ top: `${stickyTop}px` }}
    >
      {/* Month Context */}
      {showMonthHeader && displayMonth && (
        <div className={`relative ${getMonthTransitionClass}`}>
          <div className="flex justify-between items-center px-4 py-2.5 bg-paper-white">
            <span className="text-body font-medium text-ink-black">
              {displayMonth.label}
            </span>
            {displayMonth.summary && (
              <span
                className={`text-sub ${
                  displayMonth.summary.net >= 0
                    ? 'text-semantic-positive'
                    : 'text-ink-mid'
                }`}
              >
                {displayMonth.summary.net >= 0 ? '+' : ''}
                {displayMonth.summary.net.toLocaleString()}원
              </span>
            )}
          </div>

          {/* Outgoing month (for animation) */}
          {isTransitioning && previousMonth && previousMonth.id !== displayMonth.id && (
            <div
              className={`absolute inset-0 flex justify-between items-center px-4 py-2.5 bg-paper-white ${
                transitionDirection === 'down'
                  ? 'animate-slide-out-up'
                  : 'animate-slide-out-down'
              }`}
            >
              <span className="text-body font-medium text-ink-black">
                {previousMonth.label}
              </span>
              {previousMonth.summary && (
                <span
                  className={`text-sub ${
                    previousMonth.summary.net >= 0
                      ? 'text-semantic-positive'
                      : 'text-ink-mid'
                  }`}
                >
                  {previousMonth.summary.net >= 0 ? '+' : ''}
                  {previousMonth.summary.net.toLocaleString()}원
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Date Context */}
      {showDateHeader && activeDate && (
        <div className={`relative ${getDateTransitionClass}`}>
          <div className="flex justify-between items-center px-4 py-2 bg-paper-light border-t border-paper-mid/50">
            <span className="text-sub text-ink-dark">{activeDate.label}</span>
            {activeDate.dailyTotal !== undefined && (
              <span
                className={`text-sub ${
                  activeDate.dailyTotal >= 0
                    ? 'text-semantic-positive'
                    : 'text-ink-mid'
                }`}
              >
                {activeDate.dailyTotal >= 0 ? '+' : ''}
                {activeDate.dailyTotal.toLocaleString()}원
              </span>
            )}
          </div>

          {/* Outgoing date (for animation) */}
          {isTransitioning && previousDate && previousDate.id !== activeDate.id && (
            <div
              className={`absolute inset-0 flex justify-between items-center px-4 py-2 bg-paper-light ${
                transitionDirection === 'down'
                  ? 'animate-slide-out-up'
                  : 'animate-slide-out-down'
              }`}
            >
              <span className="text-sub text-ink-dark">{previousDate.label}</span>
              {previousDate.dailyTotal !== undefined && (
                <span
                  className={`text-sub ${
                    previousDate.dailyTotal >= 0
                      ? 'text-semantic-positive'
                      : 'text-ink-mid'
                  }`}
                >
                  {previousDate.dailyTotal >= 0 ? '+' : ''}
                  {previousDate.dailyTotal.toLocaleString()}원
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search/Filter info bar */}
      {(isSearchMode || hasFilters) && (
        <div className="px-4 py-1.5 bg-paper-light/50 border-t border-paper-mid/30">
          <p className="text-caption text-ink-mid">
            {filteredCount !== undefined && `${filteredCount}건의 거래`}
            {searchQuery && ` · "${searchQuery}" 전체 기간 검색`}
            {!searchQuery && hasFilters && ' · 필터 적용됨'}
          </p>
        </div>
      )}
    </div>
  );
}
