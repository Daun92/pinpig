import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Trash2, ChevronDown, Calendar, CreditCard, Tag, MessageSquare } from 'lucide-react';
import { useTransactionStore } from '@/stores/transactionStore';
import {
  useCategoryStore,
  selectExpenseCategories,
  selectIncomeCategories,
} from '@/stores/categoryStore';
import {
  usePaymentMethodStore,
  selectPaymentMethods,
} from '@/stores/paymentMethodStore';
import { useFabStore } from '@/stores/fabStore';
import { Icon, DateTimePicker } from '@/components/common';
import { db } from '@/services/database';
import { getRecentMemos } from '@/services/queries';
import type { Transaction, TransactionType } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';

type ExpandedSection = 'none' | 'category' | 'payment' | 'extra';

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const amountInputRef = useRef<HTMLInputElement>(null);
  const memoInputRef = useRef<HTMLInputElement>(null);

  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const fetchTransactions = useTransactionStore((state) => state.fetchTransactions);
  const { fetchCategories } = useCategoryStore();
  const { fetchPaymentMethods } = usePaymentMethodStore();
  const { setSubmitHandler, setCanSubmit } = useFabStore();

  const expenseCategories = useCategoryStore(selectExpenseCategories);
  const incomeCategories = useCategoryStore(selectIncomeCategories);
  const paymentMethods = usePaymentMethodStore(selectPaymentMethods);

  const [originalTransaction, setOriginalTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>('none');
  const [hasUserSelectedCategory, setHasUserSelectedCategory] = useState(true);
  const [hasUserSelectedPayment, setHasUserSelectedPayment] = useState(true);
  // 최근 사용 메모 (태그 제안용)
  const [recentMemos, setRecentMemos] = useState<string[]>([]);

  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;
  const selectedCategory = currentCategories.find(c => c.id === selectedCategoryId);
  const selectedPaymentMethod = paymentMethods.find(p => p.id === selectedPaymentMethodId);

  // Load transaction data
  useEffect(() => {
    const loadTransaction = async () => {
      if (!id) {
        navigate(-1);
        return;
      }

      try {
        const transaction = await db.transactions.get(id);
        if (!transaction) {
          alert('거래를 찾을 수 없습니다.');
          navigate(-1);
          return;
        }

        setOriginalTransaction(transaction);
        setType(transaction.type);
        setAmount(transaction.amount.toString());
        setSelectedCategoryId(transaction.categoryId);
        setSelectedPaymentMethodId(transaction.paymentMethodId || '');
        // description과 memo를 통합하여 memo로 사용
        const combinedMemo = [transaction.description, transaction.memo].filter(Boolean).join(' ').trim();
        setMemo(combinedMemo);
        setDate(new Date(transaction.date));
        setTime(transaction.time);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load transaction:', error);
        alert('거래를 불러오는데 실패했습니다.');
        navigate(-1);
      }
    };

    fetchCategories();
    fetchPaymentMethods();
    loadTransaction();
    // 최근 메모 불러오기
    getRecentMemos(8).then(setRecentMemos);
  }, [id, navigate, fetchCategories, fetchPaymentMethods]);

  // Handle category change when type changes
  useEffect(() => {
    if (originalTransaction && currentCategories.length > 0) {
      const originalType = originalTransaction.type;
      if (type !== originalType) {
        setSelectedCategoryId(currentCategories[0]?.id || '');
      }
    }
  }, [type, currentCategories, originalTransaction]);

  const handleSubmit = useCallback(async () => {
    if (!id || !amount || parseInt(amount) <= 0 || !selectedCategoryId) return;

    try {
      await updateTransaction(id, {
        type,
        amount: parseInt(amount),
        categoryId: selectedCategoryId,
        paymentMethodId: type === 'expense' ? selectedPaymentMethodId : undefined,
        description: '', // deprecated, kept for backward compatibility
        memo: memo || '',
        date,
        time,
      });

      await fetchTransactions();
      navigate(-1);
    } catch (error) {
      console.error('Failed to update transaction:', error);
      alert('거래 수정에 실패했습니다.');
    }
  }, [
    id,
    type,
    amount,
    selectedCategoryId,
    selectedPaymentMethodId,
    memo,
    date,
    time,
    updateTransaction,
    fetchTransactions,
    navigate,
  ]);

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('이 거래를 삭제하시겠습니까?')) return;

    try {
      await deleteTransaction(id);
      await fetchTransactions();
      navigate(-1);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('거래 삭제에 실패했습니다.');
    }
  };

  // Register submit handler for FAB
  useEffect(() => {
    setSubmitHandler(handleSubmit);
    return () => {
      setSubmitHandler(null);
    };
  }, [handleSubmit, setSubmitHandler]);

  useEffect(() => {
    const canSubmit = Boolean(amount && parseInt(amount) > 0 && selectedCategoryId);
    setCanSubmit(canSubmit);
  }, [amount, selectedCategoryId, setCanSubmit]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 10) {
      setAmount(value);
    }
  };

  const handleDateTimeSelect = (newDate: Date, newTime: string) => {
    setDate(newDate);
    setTime(newTime);
  };

  const formatDateLabel = (d: Date) => {
    if (isToday(d)) return '오늘';
    if (isYesterday(d)) return '어제';
    return format(d, 'M/d (EEE)', { locale: ko });
  };

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(prev => prev === section ? 'none' : section);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setHasUserSelectedCategory(true);
    setTimeout(() => {
      if (type === 'expense' && !hasUserSelectedPayment) {
        setExpandedSection('payment');
      } else {
        setExpandedSection('none');
      }
    }, 150);
  };

  const handlePaymentSelect = (paymentId: string) => {
    setSelectedPaymentMethodId(paymentId);
    setHasUserSelectedPayment(true);
    setTimeout(() => setExpandedSection('none'), 150);
  };

  const handleMemoToggle = () => {
    const willExpand = expandedSection !== 'extra';
    toggleSection('extra');
    if (willExpand) {
      setTimeout(() => {
        memoInputRef.current?.focus();
      }, 100);
    }
  };

  const handleTagSelect = (tag: string) => {
    // 이미 있으면 무시, 없으면 추가
    if (!memo.includes(tag)) {
      setMemo(memo ? `${memo} ${tag}` : tag);
    }
  };

  // 현재 입력과 겹치지 않는 태그만 필터링
  const availableTags = recentMemos.filter(tag => !memo.includes(tag));

  const showCategoryAsChip = hasUserSelectedCategory && expandedSection !== 'category';
  const showPaymentAsChip = hasUserSelectedPayment && expandedSection !== 'payment';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-paper-white">
        <p className="text-body text-ink-mid">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-paper-white safe-top">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center text-ink-mid -ml-1"
        >
          <X size={22} />
        </button>

        {/* Type Toggle */}
        <div className="flex bg-paper-light rounded-full p-0.5">
          <button
            onClick={() => setType('expense')}
            className={`px-4 py-1.5 rounded-full text-sub font-medium transition-colors ${
              type === 'expense'
                ? 'bg-ink-black text-paper-white'
                : 'text-ink-light'
            }`}
          >
            지출
          </button>
          <button
            onClick={() => setType('income')}
            className={`px-4 py-1.5 rounded-full text-sub font-medium transition-colors ${
              type === 'income'
                ? 'bg-ink-black text-paper-white'
                : 'text-ink-light'
            }`}
          >
            수입
          </button>
        </div>

        <button
          onClick={handleDelete}
          className="w-10 h-10 flex items-center justify-center text-semantic-negative -mr-1"
        >
          <Trash2 size={20} />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto px-5">
        {/* ==================== */}
        {/* 1. 일시 선택 */}
        {/* ==================== */}
        <div className="pt-[50px] pb-4 flex justify-center">
          <button
            onClick={() => setShowDatePicker(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper-light"
          >
            <Calendar size={14} className="text-ink-mid" />
            <span className="text-sub text-ink-dark">
              {formatDateLabel(date)} {time}
            </span>
          </button>
        </div>

        {/* ==================== */}
        {/* 2. 금액 입력 (Hero) */}
        {/* ==================== */}
        <div className="flex flex-col items-center py-6">
          <div className="flex items-baseline justify-center gap-1 w-full">
            <input
              ref={amountInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount ? parseInt(amount).toLocaleString() : ''}
              onChange={handleAmountChange}
              placeholder="0"
              className={`text-hero text-center bg-transparent outline-none w-full max-w-xs ${
                amount ? 'text-ink-black' : 'text-ink-light'
              }`}
            />
            <span className="text-amount text-ink-mid">원</span>
          </div>

          {/* 미니멀 칩 영역 - 선택 완료된 항목들 */}
          {(showCategoryAsChip || showPaymentAsChip || (memo && expandedSection !== 'extra')) && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-[27px]">
              {/* 카테고리 미니 칩 */}
              {showCategoryAsChip && selectedCategory && (
                <button
                  onClick={() => toggleSection('category')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink-black text-paper-white text-caption"
                >
                  <Icon name={selectedCategory.icon} size={12} />
                  <span>{selectedCategory.name}</span>
                </button>
              )}

              {/* 결제수단 미니 칩 */}
              {showPaymentAsChip && selectedPaymentMethod && type === 'expense' && (
                <button
                  onClick={() => toggleSection('payment')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink-black text-paper-white text-caption"
                >
                  <Icon name={selectedPaymentMethod.icon} size={12} />
                  <span>{selectedPaymentMethod.name}</span>
                </button>
              )}

              {/* 메모 미니 칩 */}
              {memo && expandedSection !== 'extra' && (
                <button
                  onClick={handleMemoToggle}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-paper-light text-caption text-ink-mid max-w-[120px]"
                >
                  <MessageSquare size={12} />
                  <span className="truncate">{memo}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ================================ */}
        {/* 3. 카테고리 / 결제수단 (필수) */}
        {/* ================================ */}
        <div className="space-y-2">
          {/* 카테고리 선택 */}
          {!showCategoryAsChip && (
            <div>
              <button
                onClick={() => toggleSection('category')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                  expandedSection === 'category' ? 'bg-paper-mid' : 'bg-paper-light'
                }`}
              >
                {selectedCategory ? (
                  <>
                    <div className="w-9 h-9 rounded-full bg-ink-black text-paper-white flex items-center justify-center">
                      <Icon name={selectedCategory.icon} size={18} />
                    </div>
                    <span className="text-body text-ink-dark flex-1 text-left font-medium">
                      {selectedCategory.name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-paper-mid flex items-center justify-center">
                      <Tag size={18} className="text-ink-light" />
                    </div>
                    <span className="text-body text-ink-light flex-1 text-left">
                      카테고리 선택
                    </span>
                  </>
                )}
                <ChevronDown
                  size={16}
                  className={`text-ink-light transition-transform ${
                    expandedSection === 'category' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* 카테고리 그리드 (펼침) */}
              {expandedSection === 'category' && (
                <div className="mt-1.5 p-2.5 bg-paper-light rounded-xl animate-fade-in">
                  <div className="grid grid-cols-5 gap-1">
                    {currentCategories.map((category) => {
                      const isSelected = category.id === selectedCategoryId;
                      return (
                        <button
                          key={category.id}
                          onClick={() => handleCategorySelect(category.id)}
                          className="flex flex-col items-center py-1.5"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-ink-black text-paper-white' : 'bg-paper-white text-ink-mid'
                            }`}
                          >
                            <Icon name={category.icon} size={20} />
                          </div>
                          <span
                            className={`text-caption mt-0.5 truncate w-full text-center ${
                              isSelected ? 'text-ink-black font-medium' : 'text-ink-light'
                            }`}
                          >
                            {category.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 결제수단 선택 (지출일 때만) */}
          {type === 'expense' && !showPaymentAsChip && (
            <div>
              <button
                onClick={() => toggleSection('payment')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                  expandedSection === 'payment' ? 'bg-paper-mid' : 'bg-paper-light'
                }`}
              >
                {selectedPaymentMethod ? (
                  <>
                    <div className="w-9 h-9 rounded-full bg-paper-mid flex items-center justify-center">
                      <Icon name={selectedPaymentMethod.icon} size={18} className="text-ink-mid" />
                    </div>
                    <span className="text-body text-ink-dark flex-1 text-left">
                      {selectedPaymentMethod.name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-paper-mid flex items-center justify-center">
                      <CreditCard size={18} className="text-ink-light" />
                    </div>
                    <span className="text-body text-ink-light flex-1 text-left">
                      결제수단 선택
                    </span>
                  </>
                )}
                <ChevronDown
                  size={16}
                  className={`text-ink-light transition-transform ${
                    expandedSection === 'payment' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* 결제수단 목록 (펼침) */}
              {expandedSection === 'payment' && (
                <div className="mt-1.5 p-2.5 bg-paper-light rounded-xl animate-fade-in">
                  <div className="flex flex-wrap gap-1.5">
                    {paymentMethods.map((pm) => {
                      const isSelected = pm.id === selectedPaymentMethodId;
                      return (
                        <button
                          key={pm.id}
                          onClick={() => handlePaymentSelect(pm.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sub transition-colors ${
                            isSelected
                              ? 'bg-ink-black text-paper-white'
                              : 'bg-paper-white text-ink-mid'
                          }`}
                        >
                          <Icon name={pm.icon} size={16} />
                          <span>{pm.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================== */}
        {/* 4. 메모 (선택) - 태그 시스템 */}
        {/* ========================== */}
        {(!memo || expandedSection === 'extra') && (
          <div className="mt-3">
            <button
              onClick={handleMemoToggle}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                expandedSection === 'extra' ? 'bg-paper-mid' : 'bg-paper-light'
              }`}
            >
              <MessageSquare size={18} className="text-ink-light" />
              <span className="text-body text-ink-light flex-1 text-left">
                {memo ? (
                  <span className="text-ink-dark">{memo}</span>
                ) : (
                  '메모 추가'
                )}
              </span>
              <ChevronDown
                size={16}
                className={`text-ink-light transition-transform ${
                  expandedSection === 'extra' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* 메모 입력 (펼침) - 태그 칩 + 단일 입력 */}
            {expandedSection === 'extra' && (
              <div className="mt-1.5 p-3 bg-paper-light rounded-xl animate-fade-in space-y-2.5">
                {/* 최근 사용 태그 칩 */}
                {availableTags.length > 0 && (
                  <div>
                    <label className="text-caption text-ink-light mb-1.5 block">최근</label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags.slice(0, 6).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagSelect(tag)}
                          className="px-2.5 py-1.5 rounded-full bg-paper-white text-sub text-ink-mid hover:bg-paper-mid transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* 메모 입력 필드 */}
                <div>
                  <input
                    ref={memoInputRef}
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="메모 입력..."
                    className="w-full px-3 py-2.5 rounded-lg bg-paper-white text-body text-ink-dark outline-none focus:ring-2 focus:ring-ink-light placeholder:text-ink-light"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Spacer */}
        <div className="pb-nav mt-4" />
      </div>

      {/* Date/Time Picker Modal */}
      <DateTimePicker
        isOpen={showDatePicker}
        selectedDate={date}
        selectedTime={time}
        onClose={() => setShowDatePicker(false)}
        onSelect={handleDateTimeSelect}
        disableFuture={true}
      />
    </div>
  );
}
