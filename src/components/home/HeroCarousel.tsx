import { useState, useRef } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Icon } from '@/components/common';
import { formatCurrency } from '@/utils/format';
import { getBudgetInsight, type OverBudgetCategory } from '@/services/budgetAlert';
import type { BudgetStatus, CategorySummary } from '@/types';

interface HeroCarouselProps {
  budgetStatus: BudgetStatus;
  remaining: number;
  dailyRecommended: number;
  topCategories: CategorySummary[];
  overCategories: OverBudgetCategory[];
  currentDateLabel: string;
  onCategoryClick?: (categoryId: string) => void;
}

type CardType = 'budget' | 'top-category' | 'over-category';

interface CarouselCard {
  type: CardType;
  id: string;
}

export function HeroCarousel({
  budgetStatus,
  remaining,
  dailyRecommended,
  topCategories,
  overCategories,
  currentDateLabel,
  onCategoryClick,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  const { percentUsed, remainingDays, monthlyBudget } = budgetStatus;
  const insight = getBudgetInsight(budgetStatus);

  // 동적 카드 구성
  const cards: CarouselCard[] = [
    { type: 'budget', id: 'budget' },
    ...(topCategories.length > 0 ? [{ type: 'top-category' as const, id: 'top-category' }] : []),
    ...(overCategories.length > 0 ? [{ type: 'over-category' as const, id: 'over-category' }] : []),
  ];

  const totalCards = cards.length;

  // 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const threshold = 50;

    if (translateX > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (translateX < -threshold && currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    setTranslateX(0);
  };

  // 마우스 이벤트 (데스크톱 테스트용)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    setTranslateX(diff);
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) handleTouchEnd();
  };

  // 인디케이터 색상
  const getIndicatorColor = (cardType: CardType) => {
    if (cardType === 'over-category') return 'bg-semantic-negative';
    if (cardType === 'budget' && insight.type === 'danger') return 'bg-semantic-negative';
    if (cardType === 'budget' && insight.type === 'warning') return 'bg-amber-500';
    return 'bg-ink-black';
  };

  return (
    <section className="pt-16 pb-8 overflow-hidden">
      {/* 카드 컨테이너 */}
      <div
        ref={containerRef}
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
          }}
        >
          {cards.map((card) => (
            <div key={card.id} className="w-full flex-shrink-0 px-6">
              {card.type === 'budget' && (
                <BudgetCard
                  remaining={remaining}
                  percentUsed={percentUsed}
                  remainingDays={remainingDays}
                  dailyRecommended={dailyRecommended}
                  insight={insight}
                  currentDateLabel={currentDateLabel}
                  monthlyBudget={monthlyBudget}
                />
              )}
              {card.type === 'top-category' && (
                <TopCategoryCard categories={topCategories} onCategoryClick={onCategoryClick} />
              )}
              {card.type === 'over-category' && (
                <OverCategoryCard categories={overCategories} onCategoryClick={onCategoryClick} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 인디케이터 */}
      {totalCards > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {cards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? `w-4 ${getIndicatorColor(card.type)}`
                  : 'w-1.5 bg-paper-mid'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// 예산 카드 (기존 히어로존)
interface BudgetCardProps {
  remaining: number;
  percentUsed: number;
  remainingDays: number;
  dailyRecommended: number;
  insight: ReturnType<typeof getBudgetInsight>;
  currentDateLabel: string;
  monthlyBudget: number;
}

function BudgetCard({
  remaining,
  percentUsed,
  remainingDays,
  dailyRecommended,
  insight,
  currentDateLabel,
  monthlyBudget,
}: BudgetCardProps) {
  const progressColor = insight.type === 'danger' ? 'bg-semantic-negative' :
                        insight.type === 'warning' ? 'bg-amber-500' :
                        'bg-ink-black';

  return (
    <div className="text-center" data-tour="home-hero">
      {/* 날짜 */}
      <span className="text-sub text-ink-mid">{currentDateLabel}</span>

      {/* Hero Amount */}
      <div className="mt-2">
        <h1 className="text-hero text-ink-black">
          {formatCurrency(remaining >= 0 ? remaining : 0)}
        </h1>
        <p className="text-sub text-ink-mid mt-1">
          이번 달 쓸 수 있는 돈
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mt-5 mx-4">
        <div className="h-1.5 bg-paper-mid rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColor} rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* 인사이트 메시지 */}
      <div className="mt-3" data-tour="home-daily">
        <p className={`text-body ${
          insight.type === 'danger' ? 'text-semantic-negative' :
          insight.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
          'text-ink-dark'
        }`}>
          {insight.message}
        </p>
        {monthlyBudget > 0 && (
          <p className="text-sub text-ink-mid mt-1">
            {remainingDays}일 남음 · 하루 {formatCurrency(dailyRecommended)}
          </p>
        )}
      </div>
    </div>
  );
}

// TOP 카테고리 카드
interface TopCategoryCardProps {
  categories: CategorySummary[];
  onCategoryClick?: (categoryId: string) => void;
}

function TopCategoryCard({ categories, onCategoryClick }: TopCategoryCardProps) {
  const top3 = categories.slice(0, 3);

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <TrendingUp size={18} className="text-ink-mid" />
        <span className="text-sub text-ink-mid">이번 달 TOP 카테고리</span>
      </div>

      <div className="space-y-3">
        {top3.map((cat) => (
          <button
            key={cat.categoryId}
            onClick={() => onCategoryClick?.(cat.categoryId)}
            className="w-full flex items-center justify-between px-4 py-3 bg-paper-light rounded-xl active:bg-paper-mid transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${cat.categoryColor}20` }}
              >
                <Icon name={cat.categoryIcon} size={20} style={{ color: cat.categoryColor }} />
              </div>
              <div className="text-left">
                <p className="text-body text-ink-dark">{cat.categoryName}</p>
                <p className="text-caption text-ink-light">{cat.count}건</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-amount text-ink-black">
                {cat.amount.toLocaleString()}원
              </p>
              <p className="text-caption text-ink-light">{cat.percentage.toFixed(1)}%</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// 초과 카테고리 카드
interface OverCategoryCardProps {
  categories: OverBudgetCategory[];
  onCategoryClick?: (categoryId: string) => void;
}

function OverCategoryCard({ categories, onCategoryClick }: OverCategoryCardProps) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <AlertCircle size={18} className="text-semantic-negative" />
        <span className="text-sub text-semantic-negative">예산 초과 카테고리</span>
      </div>

      <div className="space-y-3">
        {categories.slice(0, 3).map((cat) => {
          // 초과율 계산 (예: 115.3%)
          const overPercent = cat.percentUsed.toFixed(1);

          return (
            <button
              key={cat.categoryId}
              onClick={() => onCategoryClick?.(cat.categoryId)}
              className="w-full px-4 py-3 bg-semantic-negative/5 rounded-xl border border-semantic-negative/20 active:bg-semantic-negative/10 transition-colors text-left"
            >
              {/* 상단: 아이콘 + 이름 + 금액 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${cat.categoryColor}20` }}
                  >
                    <Icon name={cat.categoryIcon} size={16} style={{ color: cat.categoryColor }} />
                  </div>
                  <span className="text-body text-ink-dark">{cat.categoryName}</span>
                </div>
                <div className="text-right">
                  <span className="text-sub text-ink-dark">
                    {cat.currentSpent.toLocaleString()}원
                  </span>
                  <span className="text-caption text-ink-light"> / {cat.budgetAmount.toLocaleString()}원</span>
                </div>
              </div>

              {/* 프로그레스 바 - 초과 시각화 */}
              <div className="h-2.5 bg-paper-mid rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(cat.percentUsed, 150)}%`,
                    background: cat.percentUsed > 100
                      ? `linear-gradient(to right, ${cat.categoryColor} 0%, ${cat.categoryColor} ${100 / cat.percentUsed * 100}%, #EF4444 ${100 / cat.percentUsed * 100}%, #EF4444 100%)`
                      : cat.categoryColor,
                  }}
                />
              </div>

              {/* 하단: 초과율 + 초과 금액 */}
              <div className="flex justify-between items-center mt-2">
                <span className="text-caption text-semantic-negative font-medium">
                  {overPercent}%
                </span>
                <span className="text-caption text-semantic-negative">
                  +{cat.overAmount.toLocaleString()}원 초과
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
