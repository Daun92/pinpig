/**
 * InsightCard - 홈 인사이트 캐러셀 (리팩토링)
 *
 * 상황별 인사이트 표시:
 * 1. 예산 O + 카테고리 예산 O → 사용자 선택 위젯
 * 2. 예산 O + 카테고리 예산 X → 관심 + 카테고리 예산 유도
 * 3. 예산 X + 전월 데이터 O → 전월 대비 + 예산 유도
 * 4. 예산 X + 전월 데이터 X → 기록 현황 + 예산 유도
 */

import { useState, useRef, useEffect } from 'react';
import type { CategorySummary, InsightWidgetType } from '@/types';
import {
  getCategoryBudgetStatus,
  getMonthComparison,
  getUpcomingThisMonth,
  getCurrentMonthRecordSummary,
  type CategoryBudgetStatus,
  type MonthCompareItem,
  type UpcomingItem,
} from '@/services/queries';
import {
  CautionInsight,
  RoomInsight,
  CompareInsight,
  InterestInsight,
  UpcomingInsight,
  BudgetCtaInsight,
  RecordSummaryInsight,
} from './insights';

interface InsightCardProps {
  monthlyBudget: number;
  topCategories: CategorySummary[];
  selectedWidgets: InsightWidgetType[];
  onNavigate: (path: string) => void;
}

interface InsightData {
  caution: CategoryBudgetStatus[];
  room: CategoryBudgetStatus[];
  hasCategoryBudget: boolean;
  increases: MonthCompareItem[];
  decreases: MonthCompareItem[];
  hasLastMonthData: boolean;
  upcomingItems: UpcomingItem[];
  upcomingTotalExpense: number;
  upcomingTotalIncome: number;
  recordSummary: {
    transactionCount: number;
    totalExpense: number;
    totalIncome: number;
  };
}

export function InsightCard({
  monthlyBudget,
  topCategories,
  selectedWidgets,
  onNavigate,
}: InsightCardProps) {
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const [budgetStatus, comparison, upcoming, recordSummary] = await Promise.all([
        getCategoryBudgetStatus(year, month),
        getMonthComparison(year, month),
        getUpcomingThisMonth(year, month),
        getCurrentMonthRecordSummary(year, month),
      ]);

      setInsightData({
        caution: budgetStatus.caution,
        room: budgetStatus.room,
        hasCategoryBudget: budgetStatus.hasCategoryBudget,
        increases: comparison.increases,
        decreases: comparison.decreases,
        hasLastMonthData: comparison.hasLastMonthData,
        upcomingItems: upcoming.items,
        upcomingTotalExpense: upcoming.totalExpense,
        upcomingTotalIncome: upcoming.totalIncome,
        recordSummary,
      });
    };

    loadData();
  }, [monthlyBudget, topCategories]);

  // 인사이트 카드 렌더링
  const renderInsightCards = (): React.ReactNode[] => {
    if (!insightData) return [];

    const cards: React.ReactNode[] = [];
    const hasBudget = monthlyBudget > 0;
    const { hasCategoryBudget, hasLastMonthData } = insightData;

    // 상황 1: 예산 O + 카테고리 예산 O → 사용자 선택 위젯
    if (hasBudget && hasCategoryBudget) {
      for (const widgetType of selectedWidgets) {
        const card = renderWidget(widgetType);
        if (card) cards.push(card);
        if (cards.length >= 3) break;
      }
    }
    // 상황 2: 예산 O + 카테고리 예산 X → 관심 + 카테고리 예산 유도
    else if (hasBudget && !hasCategoryBudget) {
      if (topCategories.length > 0) {
        cards.push(
          <InterestInsight
            key="interest"
            categories={topCategories}
            onNavigate={onNavigate}
          />
        );
      }
      cards.push(
        <BudgetCtaInsight
          key="category-budget-cta"
          variant="category-budget"
          onNavigate={onNavigate}
        />
      );
    }
    // 상황 3: 예산 X + 전월 데이터 O → 전월 대비 + 예산 유도
    else if (!hasBudget && hasLastMonthData) {
      if (insightData.increases.length > 0 || insightData.decreases.length > 0) {
        cards.push(
          <CompareInsight
            key="compare"
            increases={insightData.increases}
            decreases={insightData.decreases}
            onNavigate={onNavigate}
          />
        );
      }
      cards.push(
        <BudgetCtaInsight
          key="budget-cta"
          variant="budget"
          onNavigate={onNavigate}
        />
      );
    }
    // 상황 4: 예산 X + 전월 데이터 X → 기록 현황 + 예산 유도
    else {
      cards.push(
        <RecordSummaryInsight
          key="record-summary"
          transactionCount={insightData.recordSummary.transactionCount}
          totalExpense={insightData.recordSummary.totalExpense}
          totalIncome={insightData.recordSummary.totalIncome}
          onNavigate={onNavigate}
        />
      );
      if (insightData.recordSummary.transactionCount >= 5) {
        cards.push(
          <BudgetCtaInsight
            key="budget-cta"
            variant="budget"
            onNavigate={onNavigate}
          />
        );
      }
    }

    return cards;
  };

  // 개별 위젯 렌더링
  const renderWidget = (type: InsightWidgetType): React.ReactNode | null => {
    if (!insightData) return null;

    switch (type) {
      case 'caution':
        if (insightData.caution.length === 0) return null;
        return (
          <CautionInsight
            key="caution"
            categories={insightData.caution}
            onNavigate={onNavigate}
          />
        );

      case 'room':
        if (insightData.room.length === 0) return null;
        return (
          <RoomInsight
            key="room"
            categories={insightData.room}
            onNavigate={onNavigate}
          />
        );

      case 'compare':
        if (!insightData.hasLastMonthData) return null;
        if (insightData.increases.length === 0 && insightData.decreases.length === 0) return null;
        return (
          <CompareInsight
            key="compare"
            increases={insightData.increases}
            decreases={insightData.decreases}
            onNavigate={onNavigate}
          />
        );

      case 'interest':
        if (topCategories.length === 0) return null;
        return (
          <InterestInsight
            key="interest"
            categories={topCategories}
            onNavigate={onNavigate}
          />
        );

      case 'upcoming':
        if (insightData.upcomingItems.length === 0) return null;
        return (
          <UpcomingInsight
            key="upcoming"
            items={insightData.upcomingItems}
            totalExpense={insightData.upcomingTotalExpense}
            totalIncome={insightData.upcomingTotalIncome}
            onNavigate={onNavigate}
          />
        );

      default:
        return null;
    }
  };

  const cards = renderInsightCards();
  const totalCards = cards.length;

  // 카드가 없으면 렌더링하지 않음
  if (totalCards === 0) return null;

  // 순환 캐러셀: [마지막 클론] [실제 카드들...] [첫번째 클론]
  const extendedCards = totalCards > 1
    ? [cards[totalCards - 1], ...cards, cards[0]]
    : cards;

  // 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning || totalCards <= 1) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isTransitioning) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setTranslateX(diff);
  };

  const goToIndex = (newIndex: number, newDisplayIndex: number) => {
    setIsTransitioning(true);
    setDisplayIndex(newDisplayIndex);

    setTimeout(() => {
      setCurrentIndex(newIndex);
      if (newDisplayIndex === 0) {
        setDisplayIndex(totalCards);
      } else if (newDisplayIndex === totalCards + 1) {
        setDisplayIndex(1);
      }
      setIsTransitioning(false);
    }, 300);
  };

  const handleTouchEnd = () => {
    if (isTransitioning || totalCards <= 1) return;
    setIsDragging(false);
    const threshold = 50;

    if (translateX > threshold) {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : totalCards - 1;
      goToIndex(newIndex, displayIndex - 1);
    } else if (translateX < -threshold) {
      const newIndex = currentIndex < totalCards - 1 ? currentIndex + 1 : 0;
      goToIndex(newIndex, displayIndex + 1);
    }
    setTranslateX(0);
  };

  // 마우스 이벤트
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTransitioning || totalCards <= 1) return;
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isTransitioning) return;
    const diff = e.clientX - startX;
    setTranslateX(diff);
  };

  const handleMouseUp = () => handleTouchEnd();
  const handleMouseLeave = () => { if (isDragging) handleTouchEnd(); };

  const handleIndicatorClick = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setDisplayIndex(index + 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const shouldAnimate = isTransitioning;

  return (
    <div className="w-full">
      {/* 인디케이터 - 상단 */}
      {totalCards > 1 && (
        <div className="flex justify-center items-center gap-2 mb-3">
          {cards.map((_, index) => (
            <button
              key={`indicator-${index}`}
              onClick={() => handleIndicatorClick(index)}
              className={`rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'w-4 h-2 bg-ink-dark'
                  : 'w-2 h-2 bg-paper-mid'
              }`}
            />
          ))}
        </div>
      )}

      {/* 스와이프 컨테이너 */}
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`flex ${shouldAnimate ? 'transition-transform duration-300 ease-out' : ''}`}
          style={{
            transform: `translateX(calc(-${displayIndex * 100}% + ${translateX}px))`,
          }}
        >
          {extendedCards.map((card, index) => (
            <div
              key={`card-${index}`}
              className="w-full flex-shrink-0 px-6"
            >
              {card}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
