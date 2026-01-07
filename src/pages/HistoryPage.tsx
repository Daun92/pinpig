import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore, selectCategoryMap, selectExpenseCategories, selectIncomeCategories } from '@/stores/categoryStore';
import { Icon } from '@/components/common';
import { isToday, isYesterday, format, subMonths, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Transaction } from '@/types';

interface DateGroup {
  label: string;
  date: Date;
  transactions: Transaction[];
  dailyTotal: number;
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return '오늘';
  if (isYesterday(date)) return '어제';
  return format(date, 'M월 d일', { locale: ko });
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

  useEffect(() => {
    fetchCategories();
    fetchTransactions(new Date());
  }, [fetchCategories, fetchTransactions]);

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

  const dateGroups = groupTransactionsByDate(filteredTransactions);
  const currentMonthLabel = format(currentMonth, 'M월', { locale: ko });

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
    <div className="min-h-screen bg-paper-white pb-nav">
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
        <div className="px-4 py-2 bg-paper-light border-b border-paper-mid">
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

      {/* Transaction List */}
      {dateGroups.length === 0 ? (
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
          {dateGroups.map((group) => (
            <div key={group.label}>
              {/* Date Group Header */}
              <div className="flex justify-between items-center px-4 py-3 bg-paper-light">
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
          ))}
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
