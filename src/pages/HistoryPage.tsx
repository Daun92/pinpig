import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { isFuture, startOfDay, getYear, getMonth } from 'date-fns';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore, selectCategoryMap, selectExpenseCategories, selectIncomeCategories } from '@/stores/categoryStore';
import { Icon } from '@/components/common';
import { MonthSummaryCard } from '@/components/history';
import { isToday, isYesterday, format, subMonths, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Transaction, DateGroup, MonthGroup } from '@/types';

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

export function HistoryPage() {
  const navigate = useNavigate();
  const { transactions, currentMonth, fetchTransactions, setCurrentMonth, searchAllTransactions, isLoading } = useTransactionStore();
  const { fetchCategories } = useCategoryStore();
  const categoryMap = useCategoryStore(selectCategoryMap);
  const expenseCategories = useCategoryStore(selectExpenseCategories);
  const incomeCategories = useCategoryStore(selectIncomeCategories);

  // Search state
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Transaction[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter state
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Month picker state
  const [pickerYear, setPickerYear] = useState(currentMonth.getFullYear());

  // Scroll refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayGroupRef = useRef<HTMLDivElement>(null);
  const yesterdayGroupRef = useRef<HTMLDivElement>(null);
  const futureGroupRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToTarget, setHasScrolledToTarget] = useState(false);

  // Date group refs for scroll target
  const dateGroupRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // URL query params
  const [searchParams, setSearchParams] = useSearchParams();
  const scrollToTarget = searchParams.get('scrollTo'); // 'yesterday' | 'future' | null

  useEffect(() => {
    fetchCategories();
    fetchTransactions(new Date());
  }, [fetchCategories, fetchTransactions]);

  // Scroll to target group after data loads
  const scrollToGroup = useCallback((targetRef: React.RefObject<HTMLDivElement>) => {
    if (targetRef.current) {
      // Use scrollIntoView for more accurate positioning
      targetRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });

      // Adjust for sticky headers (header 56px + filter bar ~52px = 108px)
      if (scrollContainerRef.current) {
        const headerOffset = 108;
        scrollContainerRef.current.scrollTop -= headerOffset;
      }

      setHasScrolledToTarget(true);

      // Clear the scrollTo param after scrolling
      if (scrollToTarget) {
        setSearchParams({}, { replace: true });
      }
    }
  }, [scrollToTarget, setSearchParams]);

  // Search all transactions when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchAllTransactions(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
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

  // Pull-to-load previous month
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullThreshold = 80;

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || searchQuery.trim()) return;

    const { scrollTop } = scrollContainerRef.current;

    // When at the very top and trying to scroll up more
    if (scrollTop <= 0 && !isPulling) {
      // User is at top - ready for pull gesture
    }
  }, [searchQuery, isPulling]);

  const handleTouchStart = useCallback(() => {
    if (!scrollContainerRef.current || searchQuery.trim()) return;
    if (scrollContainerRef.current.scrollTop > 0) return;

    setIsPulling(true);
    setPullDistance(0);
  }, [searchQuery]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || !scrollContainerRef.current) return;
    if (scrollContainerRef.current.scrollTop > 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    // Calculate pull distance (simplified - would need touch start Y for accuracy)
    const touch = e.touches[0];
    const pullY = Math.max(0, touch.clientY - 200); // Approximate
    setPullDistance(Math.min(pullY * 0.5, pullThreshold * 1.5));
  }, [isPulling]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= pullThreshold) {
      // Load previous month
      const prev = subMonths(currentMonth, 1);
      setCurrentMonth(prev);
      fetchTransactions(prev);
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, currentMonth, setCurrentMonth, fetchTransactions]);

  // Auto scroll to target when data loads (only once)
  useEffect(() => {
    if (!hasScrolledToTarget && allDateGroups.length > 0 && !searchQuery) {
      // Determine target ref based on scrollToTarget param
      let targetRef = todayGroupRef;
      if (scrollToTarget === 'yesterday') {
        targetRef = yesterdayGroupRef;
      } else if (scrollToTarget === 'future') {
        targetRef = futureGroupRef;
      }

      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => scrollToGroup(targetRef), 100);
      return () => clearTimeout(timer);
    }
  }, [allDateGroups.length, hasScrolledToTarget, searchQuery, scrollToTarget, scrollToGroup]);

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

  const clearCategoryFilter = () => {
    setSelectedCategoryIds([]);
  };

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
      className="min-h-screen bg-paper-white pb-nav overflow-y-auto scroll-smooth"
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid sticky top-0 bg-paper-white z-20">
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
      <div className="flex gap-2 px-4 py-3 bg-paper-white border-b border-paper-mid sticky top-14 z-20">
        {/* Month Navigation - hidden when searching */}
        {searchQuery.trim() ? (
          <div className="flex items-center px-3 py-2 bg-paper-light rounded-lg text-sub text-ink-mid">
            전체 기간
          </div>
        ) : (
          <div className="flex items-center bg-paper-light rounded-lg">
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

      {/* Search Result Info */}
      {(searchQuery || selectedCategoryIds.length > 0) && (
        <div className="px-4 py-2 bg-paper-light border-b border-paper-mid sticky top-[104px] z-20">
          <p className="text-caption text-ink-mid">
            {isSearching ? (
              '검색 중...'
            ) : (
              <>
                {filteredTransactions.length}건의 거래
                {searchQuery && ` · "${searchQuery}" 전체 기간 검색`}
              </>
            )}
          </p>
        </div>
      )}

      {/* Pull to load previous month indicator */}
      {isPulling && pullDistance > 0 && (
        <div
          className="flex items-center justify-center py-4 text-ink-mid transition-opacity"
          style={{
            opacity: Math.min(pullDistance / pullThreshold, 1),
            transform: `translateY(${pullDistance * 0.3}px)`,
          }}
        >
          <span className="text-sub">
            {pullDistance >= pullThreshold ? '놓으면 이전 달로' : '당겨서 이전 달 보기'}
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
            // Calculate sticky positions based on context
            // Header: 56px, Filter bar: ~52px = 108px base
            // When search result info is shown, add ~32px more
            const hasSearchInfo = searchQuery || selectedCategoryIds.length > 0;
            const monthHeaderTop = hasSearchInfo ? 'top-[136px]' : 'top-[108px]';
            const dateHeaderTop = showMonthHeader
              ? (hasSearchInfo ? 'top-[176px]' : 'top-[148px]')
              : (hasSearchInfo ? 'top-[136px]' : 'top-[108px]');

            return (
            <div key={`${monthGroup.year}-${monthGroup.month}`} className="month-group">
              {/* Month Header - sticky at top, shows when scrolling through this month */}
              {showMonthHeader && (
                <div className={`sticky ${monthHeaderTop} z-[15] bg-paper-white border-b border-paper-mid shadow-sm`}>
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-body font-medium text-ink-black">{monthGroup.label}</span>
                    <span className={`text-sub ${monthGroup.summary.net >= 0 ? 'text-semantic-positive' : 'text-ink-mid'}`}>
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

                // Determine ref for this group
                const isClosestFuture = isFutureGroup && !allDateGroups.slice(
                  allDateGroups.findIndex(g => g === group) + 1
                ).some(g => isFuture(startOfDay(g.date)));

                // Combined ref callback for both scroll target and intersection observer
                const setGroupRef = (el: HTMLDivElement | null) => {
                  if (el) {
                    dateGroupRefs.current.set(groupKey, el);
                    // Also set scroll target refs
                    if (isTodayGroup && todayGroupRef) {
                      (todayGroupRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                    } else if (isYesterdayGroup && yesterdayGroupRef) {
                      (yesterdayGroupRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                    } else if (isClosestFuture && futureGroupRef) {
                      (futureGroupRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                    }
                  } else {
                    dateGroupRefs.current.delete(groupKey);
                  }
                };

                return (
                  <div
                    key={groupKey}
                    ref={setGroupRef}
                    className="date-group relative"
                  >
                    {/* Date Group Header - sticky within its container */}
                    <div className={`flex justify-between items-center px-4 py-2.5 bg-paper-light border-b border-paper-mid/50 sticky ${dateHeaderTop} z-10`}>
                      <span className="text-sub text-ink-dark">{group.label}</span>
                      <span className={`text-sub ${group.dailyTotal >= 0 ? 'text-semantic-positive' : 'text-ink-mid'}`}>
                        {group.dailyTotal >= 0 ? '+' : ''}{group.dailyTotal.toLocaleString()}원
                      </span>
                    </div>

                    {/* Transactions */}
                    <ul>
                      {group.transactions.map((tx) => {
                        const category = categoryMap.get(tx.categoryId);
                        return (
                          <li
                            key={tx.id}
                            onClick={() => navigate(`/transaction/${tx.id}`)}
                            className="px-4 py-4 border-b border-paper-mid cursor-pointer active:bg-paper-light transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className="text-ink-mid mt-0.5">
                                <Icon name={category?.icon || 'MoreHorizontal'} size={20} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-body text-ink-black truncate">
                                    {tx.description || category?.name || '거래'}
                                  </span>
                                  <span className="text-caption text-ink-light ml-2 whitespace-nowrap">
                                    {tx.time}
                                  </span>
                                </div>
                                <div className="flex justify-between items-baseline mt-1">
                                  <span className="text-sub text-ink-mid">
                                    {category?.name || '기타'}
                                  </span>
                                  <span className={`text-amount whitespace-nowrap ${
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
