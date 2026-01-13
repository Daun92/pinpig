import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { isFuture, startOfDay, getYear, getMonth } from 'date-fns';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore, selectCategoryMap, selectExpenseCategories, selectIncomeCategories } from '@/stores/categoryStore';
import { usePaymentMethodStore, selectPaymentMethodMap } from '@/stores/paymentMethodStore';
import { useCoachMark } from '@/components/coachmark';
import { Icon } from '@/components/common';
import {
  MonthSummaryCard,
  InsightDetailHeader,
  CautionSummary,
  RoomSummary,
  InterestSummary,
  CompareSummary,
  UpcomingSummary,
} from '@/components/history';
import { getInsightDetail } from '@/services/queries';
import { isToday, isYesterday, format, subMonths, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Transaction, DateGroup, MonthGroup, InsightType, InsightDetailData } from '@/types';

function getDateLabel(date: Date): string {
  if (isToday(date)) return '오늘';
  if (isYesterday(date)) return '어제';
  return format(date, 'd일 (E)', { locale: ko });
}

function getMonthLabel(year: number, month: number): string {
  const currentYear = new Date().getFullYear();
  if (year === currentYear) {
    return `${month + 1}월`;
  }
  return `${year}년 ${month + 1}월`;
}

function groupTransactionsByDate(transactions: Transaction[]): DateGroup[] {
  const groups: Map<string, DateGroup> = new Map();

  for (const tx of transactions) {
    const dateKey = format(tx.date, 'yyyy-MM-dd');

    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        label: getDateLabel(tx.date),
        date: tx.date,
        transactions: [],
        dailyTotal: 0,
      });
    }

    const group = groups.get(dateKey)!;
    group.transactions.push(tx);
    group.dailyTotal += tx.type === 'income' ? tx.amount : -tx.amount;
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
}

function groupTransactionsByMonth(transactions: Transaction[]): MonthGroup[] {
  const monthMap: Map<string, MonthGroup> = new Map();

  for (const tx of transactions) {
    const year = getYear(tx.date);
    const month = getMonth(tx.date);
    const monthKey = `${year}-${month}`;

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        year,
        month,
        label: getMonthLabel(year, month),
        dateGroups: [],
        summary: {
          income: 0,
          expense: 0,
          net: 0,
          transactionCount: 0,
        },
      });
    }

    const monthGroup = monthMap.get(monthKey)!;
    if (tx.type === 'income') {
      monthGroup.summary.income += tx.amount;
    } else {
      monthGroup.summary.expense += tx.amount;
    }
    monthGroup.summary.transactionCount += 1;
  }

  // Calculate net for each month
  for (const group of monthMap.values()) {
    group.summary.net = group.summary.income - group.summary.expense;
  }

  // Group transactions by date first
  const dateGroups = groupTransactionsByDate(transactions);

  // Assign date groups to their respective months
  for (const dateGroup of dateGroups) {
    const year = getYear(dateGroup.date);
    const month = getMonth(dateGroup.date);
    const monthKey = `${year}-${month}`;
    const monthGroup = monthMap.get(monthKey);
    if (monthGroup) {
      monthGroup.dateGroups.push(dateGroup);
    }
  }

  // Sort months descending (newest first)
  return Array.from(monthMap.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

// Fixed header height: Header (56px + 1px border) + Filter bar (59px + 1px border) = 116px
const FIXED_HEADER_HEIGHT = 116;

export function HistoryPage() {
  const navigate = useNavigate();
  const { startTour } = useCoachMark();
  const { transactions, currentMonth, fetchTransactions, setCurrentMonth, searchAllTransactions, isLoading } = useTransactionStore();
  const { fetchCategories } = useCategoryStore();
  const categoryMap = useCategoryStore(selectCategoryMap);
  const expenseCategories = useCategoryStore(selectExpenseCategories);
  const incomeCategories = useCategoryStore(selectIncomeCategories);
  const { fetchPaymentMethods } = usePaymentMethodStore();
  const paymentMethodMap = usePaymentMethodStore(selectPaymentMethodMap);

  // Search state
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Transaction[]>([]);

  // Filter state
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Month picker state
  const [pickerYear, setPickerYear] = useState(currentMonth.getFullYear());

  // Scroll refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollToTargetProcessed = useRef<string | null>(null);

  // URL query params
  const [searchParams, setSearchParams] = useSearchParams();
  const scrollToTarget = searchParams.get('scrollTo'); // 'yesterday' | 'future' | null
  const categoryIdParam = searchParams.get('categoryId'); // 홈 인사이트에서 카테고리 클릭 시
  const insightParam = searchParams.get('insight') as InsightType | null; // 인사이트 타입

  // Insight detail state
  const [insightData, setInsightData] = useState<InsightDetailData | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchPaymentMethods();
    fetchTransactions(new Date());
  }, [fetchCategories, fetchPaymentMethods, fetchTransactions]);

  // Handle URL parameters (categoryId and insight)
  useEffect(() => {
    if (categoryIdParam) {
      setSelectedCategoryIds([categoryIdParam]);
    }

    // Load insight data if insight param exists
    if (insightParam) {
      setIsLoadingInsight(true);
      const now = new Date();
      getInsightDetail(insightParam, categoryIdParam || undefined, now.getFullYear(), now.getMonth() + 1)
        .then((data) => {
          setInsightData(data);
          setIsLoadingInsight(false);
        })
        .catch(() => {
          setInsightData(null);
          setIsLoadingInsight(false);
        });
    } else {
      setInsightData(null);
    }
  }, [categoryIdParam, insightParam]);

  // Dismiss insight header
  const handleDismissInsight = useCallback(() => {
    setInsightData(null);
    // Keep categoryId filter but remove insight param
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('insight');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Start history tour on first visit (after transactions loaded)
  useEffect(() => {
    if (transactions.length > 0) {
      startTour('history');
    }
  }, [transactions.length, startTour]);

  // Scroll to target group using data attribute selector
  const scrollToGroupBySelector = useCallback((selector: string, target: string) => {
    // DOM에서 직접 요소 찾기
    const element = document.querySelector(selector) as HTMLElement | null;
    if (!element) {
      return;
    }

    // 실제 스크롤 컨테이너 찾기 (App.tsx의 main 요소)
    const scrollContainer = document.querySelector('main.overflow-y-auto') as HTMLElement | null;
    if (!scrollContainer) {
      return;
    }

    // 먼저 스크롤 컨테이너 상단으로 리셋
    scrollContainer.scrollTop = 0;

    // 다음 프레임에서 정확한 위치 계산
    requestAnimationFrame(() => {
      // 요소의 위치를 스크롤 컨테이너 기준으로 계산
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      // 요소가 컨테이너 내에서 얼마나 떨어져 있는지 계산
      const relativeTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;
      const headerOffset = FIXED_HEADER_HEIGHT;

      scrollContainer.scrollTo({
        top: relativeTop - headerOffset,
        behavior: 'auto',
      });

      // 처리 완료 표시
      scrollToTargetProcessed.current = target;

      // Clear the scrollTo param after scrolling
      setSearchParams({}, { replace: true });
    });
  }, [setSearchParams]);

  // Search all transactions when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      const results = await searchAllTransactions(searchQuery);
      setSearchResults(results);
    }, 300); // Debounce 300ms

    return () => clearTimeout(searchTimer);
  }, [searchQuery, searchAllTransactions]);

  // Filter transactions based on search mode and category filter
  const filteredTransactions = useMemo(() => {
    // Use search results if searching, otherwise use current month transactions
    let result = searchQuery.trim() ? searchResults : transactions;

    // Apply category filter (works on both search results and month transactions)
    if (selectedCategoryIds.length > 0) {
      result = result.filter((tx) => selectedCategoryIds.includes(tx.categoryId));
    }

    return result;
  }, [transactions, searchResults, searchQuery, selectedCategoryIds]);

  // Use month grouping for search (multiple months), date grouping for single month view
  const monthGroups = useMemo(() => {
    if (searchQuery.trim()) {
      // Search mode: group by months
      return groupTransactionsByMonth(filteredTransactions);
    }
    // Single month view: still use month grouping for consistency
    return groupTransactionsByMonth(filteredTransactions);
  }, [filteredTransactions, searchQuery]);

  const currentMonthLabel = format(currentMonth, 'M월', { locale: ko });

  // Flatten all date groups for scroll target detection
  const allDateGroups = useMemo(() => {
    return monthGroups.flatMap(mg => mg.dateGroups);
  }, [monthGroups]);

  // Horizontal swipe for month navigation (left = next, right = previous)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState<boolean | null>(null);
  const swipeThreshold = 80;

  // Check if can go to next month (not beyond current month)
  const canGoToNextMonth = useMemo(() => {
    const now = new Date();
    return currentMonth.getFullYear() < now.getFullYear() ||
      (currentMonth.getFullYear() === now.getFullYear() && currentMonth.getMonth() < now.getMonth());
  }, [currentMonth]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (searchQuery.trim()) return;

    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setSwipeDirection(null);
    setSwipeDistance(0);
    setIsHorizontalSwipe(null);
  }, [searchQuery]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (searchQuery.trim()) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // Determine swipe direction on first significant move
    if (isHorizontalSwipe === null) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX > 10 || absY > 10) {
        // If horizontal movement is dominant, it's a swipe
        setIsHorizontalSwipe(absX > absY * 1.5);
      }
      return;
    }

    // Only handle horizontal swipes
    if (!isHorizontalSwipe) return;

    if (deltaX < 0) {
      // Swiping left = next month (if allowed)
      if (canGoToNextMonth) {
        setSwipeDirection('left');
        setSwipeDistance(Math.min(Math.abs(deltaX), swipeThreshold * 1.5));
      }
    } else if (deltaX > 0) {
      // Swiping right = previous month
      setSwipeDirection('right');
      setSwipeDistance(Math.min(deltaX, swipeThreshold * 1.5));
    }
  }, [searchQuery, touchStartX, touchStartY, isHorizontalSwipe, canGoToNextMonth]);

  const handleTouchEnd = useCallback(() => {
    if (swipeDistance >= swipeThreshold && swipeDirection) {
      if (swipeDirection === 'left' && canGoToNextMonth) {
        // Swipe left = go to next month (more recent)
        const next = addMonths(currentMonth, 1);
        setCurrentMonth(next);
        fetchTransactions(next);
      } else if (swipeDirection === 'right') {
        // Swipe right = go to previous month (older)
        const prev = subMonths(currentMonth, 1);
        setCurrentMonth(prev);
        fetchTransactions(prev);
      }
    }
    setSwipeDirection(null);
    setSwipeDistance(0);
    setIsHorizontalSwipe(null);
  }, [swipeDistance, swipeDirection, currentMonth, setCurrentMonth, fetchTransactions, canGoToNextMonth]);

  // Auto scroll to target when data loads (only when explicitly requested via URL param)
  useEffect(() => {
    // scrollToTarget이 있고, 아직 처리되지 않았으며, 데이터가 로드된 경우
    if (scrollToTarget && scrollToTargetProcessed.current !== scrollToTarget && allDateGroups.length > 0 && !searchQuery) {
      let selector = '';
      if (scrollToTarget === 'yesterday') {
        selector = '[data-scroll-target="yesterday"]';
      } else if (scrollToTarget === 'future') {
        selector = '[data-scroll-target="future"]';
      } else if (scrollToTarget === 'today') {
        selector = '[data-scroll-target="today"]';
      }

      if (selector) {
        // DOM이 완전히 렌더링될 때까지 대기 후 스크롤
        const timer = setTimeout(() => scrollToGroupBySelector(selector, scrollToTarget), 300);
        return () => clearTimeout(timer);
      }
    }
  }, [allDateGroups.length, searchQuery, scrollToTarget, scrollToGroupBySelector]);

  // Quick month navigation (without modal)
  const handlePrevMonth = () => {
    const prev = subMonths(currentMonth, 1);
    setCurrentMonth(prev);
    fetchTransactions(prev);
  };

  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1);
    if (next <= new Date()) {
      setCurrentMonth(next);
      fetchTransactions(next);
    }
  };

  const canGoNext = addMonths(currentMonth, 1) <= new Date();

  // Month picker handlers
  const openMonthPicker = () => {
    setPickerYear(currentMonth.getFullYear());
    setShowMonthPicker(true);
  };

  const handleSelectMonth = (month: number) => {
    const selected = new Date(pickerYear, month, 1);
    setCurrentMonth(selected);
    fetchTransactions(selected);
    setShowMonthPicker(false);
  };

  const isMonthDisabled = (month: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();

    // Disable future months
    if (pickerYear > currentYear) return true;
    if (pickerYear === currentYear && month > currentMonthNum) return true;
    return false;
  };

  // Category filter toggle
  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearCategoryFilter = useCallback(() => {
    setSelectedCategoryIds([]);
    // Also dismiss insight view when clearing filters
    if (insightData) {
      setInsightData(null);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('insight');
      newParams.delete('categoryId');
      setSearchParams(newParams, { replace: true });
    }
  }, [insightData, searchParams, setSearchParams]);

  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategoryIds.length === 0) return '전체 카테고리';
    if (selectedCategoryIds.length === 1) {
      const cat = categoryMap.get(selectedCategoryIds[0]);
      return cat?.name || '1개 선택';
    }
    return `${selectedCategoryIds.length}개 선택`;
  }, [selectedCategoryIds, categoryMap]);

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-paper-white">
        <p className="text-body text-ink-mid">불러오는 중...</p>
      </div>
    );
  }


  return (
    <div
      ref={scrollContainerRef}
      className="min-h-screen bg-paper-white pb-nav"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fixed Header Area - only Header + Filter Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-paper-white">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
          {isSearchMode ? (
            <>
              <div className="flex-1 flex items-center gap-2">
                <Search size={20} className="text-ink-light" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="거래 내역 검색..."
                  className="flex-1 bg-transparent text-body text-ink-black outline-none placeholder:text-ink-light"
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  setIsSearchMode(false);
                  setSearchQuery('');
                }}
                className="w-10 h-10 flex items-center justify-center text-ink-mid"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <>
              <h1 className="text-title text-ink-black pl-2">기록</h1>
              <button
                onClick={() => setIsSearchMode(true)}
                className="w-10 h-10 flex items-center justify-center text-ink-mid"
              >
                <Search size={20} />
              </button>
            </>
          )}
        </header>

        {/* Filter Bar */}
        <div className="flex gap-2 px-4 py-3 bg-paper-white border-b border-paper-mid">
          {/* Month Navigation - hidden when searching */}
          {searchQuery.trim() ? (
            <div className="flex items-center px-3 py-2 bg-paper-light rounded-lg text-sub text-ink-mid">
              전체 기간
            </div>
          ) : (
            <div className="flex items-center bg-paper-light rounded-lg" data-tour="history-month-nav">
              <button
                onClick={handlePrevMonth}
                className="w-9 h-9 flex items-center justify-center text-ink-dark"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={openMonthPicker}
                className="flex items-center gap-1 px-1 py-2 text-sub text-ink-dark"
              >
                {currentMonthLabel}
                <ChevronDown size={14} />
              </button>
              <button
                onClick={handleNextMonth}
                disabled={!canGoNext}
                className="w-9 h-9 flex items-center justify-center text-ink-dark disabled:text-ink-light"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Category Filter */}
          <button
            onClick={() => setShowCategoryPicker(true)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sub ${
              selectedCategoryIds.length > 0
                ? 'bg-ink-black text-paper-white'
                : 'bg-paper-light text-ink-dark'
            }`}
          >
            {selectedCategoryLabel}
            <ChevronDown size={16} />
          </button>

          {/* Clear filters */}
          {selectedCategoryIds.length > 0 && (
            <button
              onClick={clearCategoryFilter}
              className="flex items-center gap-1 px-3 py-2 text-sub text-ink-mid"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div style={{ height: `${FIXED_HEADER_HEIGHT}px` }} />

      {/* Search Result Info */}
      {(searchQuery || selectedCategoryIds.length > 0) && (
        <div className="px-4 py-2 bg-paper-light border-b border-paper-mid">
          <p className="text-caption text-ink-mid">
            {filteredTransactions.length}건의 거래
            {searchQuery && ` · "${searchQuery}" 전체 기간 검색`}
          </p>
        </div>
      )}

      {/* Monthly Summary - shown for single month view (not searching) and no insight */}
      {!searchQuery && !insightData && monthGroups.length === 1 && monthGroups[0] && (
        <div className="px-4 py-3 bg-paper-white border-b border-paper-mid">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-caption text-ink-light">수입</p>
                <p className="text-sub text-semantic-positive">
                  +{monthGroups[0].summary.income.toLocaleString()}원
                </p>
              </div>
              <div>
                <p className="text-caption text-ink-light">지출</p>
                <p className="text-sub text-ink-dark">
                  {monthGroups[0].summary.expense.toLocaleString()}원
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-caption text-ink-light">합계</p>
              <p className={`text-body font-medium ${monthGroups[0].summary.net >= 0 ? 'text-semantic-positive' : 'text-semantic-negative'}`}>
                {monthGroups[0].summary.net >= 0 ? '+' : ''}{monthGroups[0].summary.net.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Insight Detail Header - shown when insight param exists */}
      {insightData && !isLoadingInsight && (
        <InsightDetailHeader
          type={insightData.type}
          categoryName={
            insightData.type !== 'upcoming' ? insightData.data.categoryName : undefined
          }
          categoryIcon={
            insightData.type !== 'upcoming' ? insightData.data.categoryIcon : undefined
          }
          categoryColor={
            insightData.type !== 'upcoming' ? insightData.data.categoryColor : undefined
          }
          onDismiss={handleDismissInsight}
        >
          {insightData.type === 'caution' && <CautionSummary data={insightData.data} />}
          {insightData.type === 'room' && <RoomSummary data={insightData.data} />}
          {insightData.type === 'interest' && <InterestSummary data={insightData.data} />}
          {insightData.type === 'compare' && <CompareSummary data={insightData.data} />}
          {insightData.type === 'upcoming' && <UpcomingSummary data={insightData.data} />}
        </InsightDetailHeader>
      )}

      {/* Swipe indicator for month navigation */}
      {swipeDirection && swipeDistance > 0 && (
        <div
          className={`fixed top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 px-3 py-2 bg-ink-black/80 text-paper-white rounded-lg transition-opacity ${
            swipeDirection === 'left' ? 'right-4' : 'left-4'
          }`}
          style={{
            opacity: Math.min(swipeDistance / swipeThreshold, 1),
          }}
        >
          <span className="text-sub">
            {swipeDirection === 'left'
              ? (swipeDistance >= swipeThreshold ? '→ 다음 달' : '다음 달')
              : (swipeDistance >= swipeThreshold ? '← 이전 달' : '이전 달')
            }
          </span>
        </div>
      )}

      {/* Transaction List */}
      {monthGroups.length === 0 ? (
        <div className="py-16 pb-20 text-center">
          <p className="text-body text-ink-light">
            {searchQuery || selectedCategoryIds.length > 0
              ? '검색 결과가 없어요'
              : '아직 거래 내역이 없어요'}
          </p>
          {!searchQuery && selectedCategoryIds.length === 0 && (
            <p className="text-sub text-ink-light mt-1">
              + 버튼을 눌러 기록해보세요
            </p>
          )}
        </div>
      ) : (
        <div className="pb-20">
          {monthGroups.map((monthGroup) => {
            // Show month header only in search mode or when multiple months exist
            const showMonthHeader = searchQuery.trim() || monthGroups.length > 1;

            return (
            <div
              key={`${monthGroup.year}-${monthGroup.month}`}
              className="month-group"
            >
              {/* Month Header - visual separator */}
              {showMonthHeader && (
                <div className="bg-paper-white border-b border-paper-mid">
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-body font-medium text-ink-black">{monthGroup.label}</span>
                    <span className={`text-body font-medium ${monthGroup.summary.net >= 0 ? 'text-semantic-positive' : 'text-ink-mid'}`}>
                      {monthGroup.summary.net >= 0 ? '+' : ''}{monthGroup.summary.net.toLocaleString()}원
                    </span>
                  </div>
                </div>
              )}

              {/* Date Groups within this month */}
              {monthGroup.dateGroups.map((group) => {
                const isTodayGroup = isToday(group.date);
                const isYesterdayGroup = isYesterday(group.date);
                const isFutureGroup = isFuture(startOfDay(group.date));
                const groupKey = `${monthGroup.year}-${monthGroup.month}-${format(group.date, 'dd')}`;

                // Determine scroll target attribute
                // 가장 가까운 미래: 날짜 내림차순이므로 미래 그룹들 중 마지막 (이후에 미래가 없는 것)
                const groupIndex = allDateGroups.findIndex(g => g === group);
                const isClosestFuture = isFutureGroup && !allDateGroups.slice(groupIndex + 1).some(g => isFuture(startOfDay(g.date)));

                // data attribute for scroll target
                const scrollTargetAttr = isTodayGroup
                  ? 'today'
                  : isYesterdayGroup
                  ? 'yesterday'
                  : isClosestFuture
                  ? 'future'
                  : undefined;

                return (
                  <div
                    key={groupKey}
                    className="date-group relative"
                    data-scroll-target={scrollTargetAttr}
                  >
                    {/* Date Group Header - sticky below fixed header */}
                    {(() => {
                      const dailyIncome = group.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                      const dailyExpense = group.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                      return (
                        <div
                          className="flex justify-between items-center px-4 py-2 bg-paper-light border-b border-paper-mid/50 sticky z-10"
                          style={{ top: `${FIXED_HEADER_HEIGHT}px` }}
                        >
                          <span className="text-body text-ink-dark">{group.label}</span>
                          <div className="flex items-center gap-3">
                            {dailyIncome > 0 && (
                              <span className="text-sub text-semantic-positive">
                                수입 +{dailyIncome.toLocaleString()}
                              </span>
                            )}
                            {dailyExpense > 0 && (
                              <span className="text-sub text-ink-dark">
                                지출 {dailyExpense.toLocaleString()}
                              </span>
                            )}
                            {dailyIncome === 0 && dailyExpense === 0 && (
                              <span className="text-sub text-ink-light">-</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Transactions */}
                    <ul>
                      {group.transactions.map((tx, txIndex) => {
                        const category = categoryMap.get(tx.categoryId);
                        const paymentMethod = tx.paymentMethodId ? paymentMethodMap.get(tx.paymentMethodId) : null;
                        // Add tour attribute to first transaction of first date group of first month
                        const isFirstTransaction = txIndex === 0 &&
                          monthGroup.dateGroups[0] === group &&
                          monthGroups[0] === monthGroup;
                        return (
                          <li
                            key={tx.id}
                            onClick={() => navigate(`/transaction/${tx.id}`)}
                            className="px-4 py-4 border-b border-paper-mid cursor-pointer active:bg-paper-light transition-colors"
                            {...(isFirstTransaction && { 'data-tour': 'history-transaction' })}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className="text-ink-mid mt-0.5">
                                <Icon name={category?.icon || 'MoreHorizontal'} size={20} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                {/* 1행: 메모 + 태그 | 시간 */}
                                <div className="flex justify-between items-start gap-2 leading-tight">
                                  <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1">
                                    {tx.memo && (
                                      <span className="text-sub text-ink-black truncate max-w-[120px]">
                                        {tx.memo}
                                      </span>
                                    )}
                                    {tx.tags && tx.tags.length > 0 && tx.tags.flatMap((tag) =>
                                      // #으로 시작하거나 포함된 경우 분리 처리
                                      tag.includes('#')
                                        ? tag.replace(/#/g, ' #').trim().split(/\s+/).filter(t => t.startsWith('#')).map(t => t.slice(1))
                                        : [tag]
                                    ).filter(t => t.length > 0).map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-1.5 py-0.5 rounded bg-paper-mid text-caption text-ink-mid whitespace-nowrap"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                    {!tx.memo && (!tx.tags || tx.tags.length === 0) && (
                                      <span className="text-sub text-ink-light">-</span>
                                    )}
                                  </div>
                                  <span className="text-caption text-ink-light whitespace-nowrap">
                                    {tx.time}
                                  </span>
                                </div>

                                {/* 2행: 카테고리 · 결제수단 | 금액 */}
                                <div className="flex justify-between items-baseline">
                                  <span className="text-caption text-ink-light truncate">
                                    {category?.name || '기타'}
                                    {paymentMethod && <span> · {paymentMethod.name}</span>}
                                  </span>
                                  <span className={`text-body font-medium whitespace-nowrap ${
                                    tx.type === 'income' ? 'text-semantic-positive' : 'text-ink-black'
                                  }`}>
                                    {tx.type === 'income' ? '+ ' : ''}{tx.amount.toLocaleString()}원
                                  </span>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}

              {/* Month Summary Card - shown at the end of each month (for search mode or past months) */}
              {(searchQuery.trim() || monthGroups.length > 1) && (
                <MonthSummaryCard monthGroup={monthGroup} />
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Month Picker Modal */}
      {showMonthPicker && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-paper-white w-full max-w-lg rounded-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-paper-mid">
              <h2 className="text-title text-ink-black">월 선택</h2>
              <button
                onClick={() => setShowMonthPicker(false)}
                className="w-10 h-10 flex items-center justify-center"
              >
                <X size={20} className="text-ink-mid" />
              </button>
            </div>

            {/* Year Navigation */}
            <div className="flex items-center justify-center gap-4 py-4 border-b border-paper-mid">
              <button
                onClick={() => setPickerYear((prev) => prev - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-paper-light"
              >
                <ChevronLeft size={20} className="text-ink-dark" />
              </button>

              <span className="text-title text-ink-black min-w-24 text-center">
                {pickerYear}년
              </span>

              <button
                onClick={() => setPickerYear((prev) => prev + 1)}
                disabled={pickerYear >= new Date().getFullYear()}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-paper-light disabled:opacity-30"
              >
                <ChevronRight size={20} className="text-ink-dark" />
              </button>
            </div>

            {/* Month Grid (4x3) */}
            <div className="grid grid-cols-4 gap-2 px-4 py-4">
              {Array.from({ length: 12 }, (_, i) => {
                const isSelected =
                  pickerYear === currentMonth.getFullYear() &&
                  i === currentMonth.getMonth();
                const disabled = isMonthDisabled(i);

                return (
                  <button
                    key={i}
                    onClick={() => !disabled && handleSelectMonth(i)}
                    disabled={disabled}
                    className={`py-3 rounded-lg text-body transition-colors ${
                      isSelected
                        ? 'bg-ink-black text-paper-white'
                        : disabled
                        ? 'bg-paper-light text-ink-light'
                        : 'bg-paper-light text-ink-dark hover:bg-paper-mid'
                    }`}
                  >
                    {i + 1}월
                  </button>
                );
              })}
            </div>

            {/* Confirm Button */}
            <div className="px-4 pb-4">
              <button
                onClick={() => setShowMonthPicker(false)}
                className="w-full py-4 bg-ink-black text-paper-white text-body rounded-lg"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-paper-white w-full max-w-lg rounded-2xl max-h-[80vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between px-4 py-4 border-b border-paper-mid">
              <h2 className="text-title text-ink-black">카테고리 선택</h2>
              <button
                onClick={() => setShowCategoryPicker(false)}
                className="w-10 h-10 flex items-center justify-center"
              >
                <X size={20} className="text-ink-mid" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Expense Categories */}
              <div className="px-4 py-3">
                <p className="text-sub text-ink-light mb-2">지출</p>
                <div className="flex flex-wrap gap-2">
                  {expenseCategories.map((cat) => {
                    const isSelected = selectedCategoryIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategoryFilter(cat.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sub transition-colors ${
                          isSelected
                            ? 'bg-ink-black text-paper-white'
                            : 'bg-paper-light text-ink-dark'
                        }`}
                      >
                        <Icon name={cat.icon} size={16} />
                        {cat.name}
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Income Categories */}
              <div className="px-4 py-3 border-t border-paper-mid">
                <p className="text-sub text-ink-light mb-2">수입</p>
                <div className="flex flex-wrap gap-2">
                  {incomeCategories.map((cat) => {
                    const isSelected = selectedCategoryIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategoryFilter(cat.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sub transition-colors ${
                          isSelected
                            ? 'bg-ink-black text-paper-white'
                            : 'bg-paper-light text-ink-dark'
                        }`}
                      >
                        <Icon name={cat.icon} size={16} />
                        {cat.name}
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-4 py-4 border-t border-paper-mid flex gap-3">
              <button
                onClick={clearCategoryFilter}
                className="flex-1 py-3 bg-paper-light text-ink-dark text-body rounded-lg"
              >
                초기화
              </button>
              <button
                onClick={() => setShowCategoryPicker(false)}
                className="flex-1 py-3 bg-ink-black text-paper-white text-body rounded-lg"
              >
                적용 ({selectedCategoryIds.length}개)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
