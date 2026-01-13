import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Trash2, ChevronDown, ChevronUp, Calendar, CreditCard, Tag, MessageSquare } from 'lucide-react';
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
import { getCategorySuggestions } from '@/services/queries';
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
  const [tags, setTags] = useState<string[]>([]); // 멀티 태그 배열
  const [customMemo, setCustomMemo] = useState(''); // 직접 입력 메모
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>('none');
  const [hasUserSelectedCategory, setHasUserSelectedCategory] = useState(true);
  const [hasUserSelectedPayment, setHasUserSelectedPayment] = useState(true);
  // 카테고리별 추천 (메모 + 태그)
  const [suggestedMemos, setSuggestedMemos] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  // 태그 직접 입력
  const [newTagInput, setNewTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

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
        // tags 필드와 memo 필드를 분리해서 로드
        setTags(transaction.tags || []);
        setCustomMemo(transaction.memo || '');
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
  }, [id, navigate, fetchCategories, fetchPaymentMethods]);

  // 카테고리 변경 시 추천 메모/태그 로드
  useEffect(() => {
    if (selectedCategoryId) {
      getCategorySuggestions(selectedCategoryId, 6, 6).then(({ memos, tags }) => {
        setSuggestedMemos(memos);
        setSuggestedTags(tags);
      });
    }
  }, [selectedCategoryId]);

  // Handle category change when type changes
  useEffect(() => {
    if (originalTransaction && currentCategories.length > 0) {
      const originalType = originalTransaction.type;
      if (type !== originalType) {
        setSelectedCategoryId(currentCategories[0]?.id || '');
      }
    }
  }, [type, currentCategories, originalTransaction]);

  // 메모 섹션이 열릴 때 자동 포커스 (useEffect로 안정적 처리)
  const [shouldFocusMemo, setShouldFocusMemo] = useState(false);
  useEffect(() => {
    if (shouldFocusMemo && expandedSection === 'extra') {
      // DOM 업데이트 후 포커스 (requestAnimationFrame + setTimeout 조합)
      const rafId = requestAnimationFrame(() => {
        setTimeout(() => {
          if (memoInputRef.current) {
            memoInputRef.current.focus();
          }
          setShouldFocusMemo(false);
        }, 100);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [shouldFocusMemo, expandedSection]);

  // 메모 내용 존재 여부 (태그 또는 메모)
  const hasMemoContent = tags.length > 0 || customMemo.trim().length > 0;

  // 추천 메모 클릭 시 메모 설정
  const handleSuggestedMemoClick = (memo: string) => {
    setCustomMemo(memo);
  };

  // 추천 태그 클릭 시 태그 배열에 직접 추가
  const handleSuggestedTagClick = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  // 태그 삭제
  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // 엔터키로 태그 추가
  const handleAddNewTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, ''); // # 제거
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  // Enter 키로 태그 추가
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewTag();
    }
  };

  // 추천 중 아직 선택되지 않은 것만 표시
  const availableSuggestedMemos = suggestedMemos.filter(m => m !== customMemo.trim());
  const availableSuggestedTags = suggestedTags.filter(t => !tags.includes(t));

  const handleSubmit = useCallback(async () => {
    if (!id || !amount || parseInt(amount) <= 0 || !selectedCategoryId) return;

    try {
      await updateTransaction(id, {
        type,
        amount: parseInt(amount),
        categoryId: selectedCategoryId,
        paymentMethodId: type === 'expense' ? selectedPaymentMethodId : undefined,
        memo: customMemo.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
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
    customMemo,
    tags,
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
    // 선택 후 다음 단계로 이동
    setTimeout(() => {
      if (type === 'expense' && !hasUserSelectedPayment) {
        // 지출: 결제수단 선택으로 이동
        setExpandedSection('payment');
      } else {
        // 수입: 메모 입력창 자동 열기 + 커서 포커스
        setExpandedSection('extra');
        setShouldFocusMemo(true);
      }
    }, 150);
  };

  const handlePaymentSelect = (paymentId: string) => {
    setSelectedPaymentMethodId(paymentId);
    setHasUserSelectedPayment(true);
    // 선택 후 메모 입력창 자동 열기 + 커서 포커스
    setTimeout(() => {
      setExpandedSection('extra');
      setShouldFocusMemo(true);
    }, 150);
  };

  const handleMemoToggle = () => {
    const willExpand = expandedSection !== 'extra';
    toggleSection('extra');
    if (willExpand) {
      setShouldFocusMemo(true);
    }
  };

  const handleMemoClose = () => {
    setExpandedSection('none');
  };

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

          {/* 미니멀 칩 영역 - 2행 구조 */}
          {(showCategoryAsChip || showPaymentAsChip || (hasMemoContent && expandedSection !== 'extra')) && (
            <div className="flex flex-col items-center gap-1.5 mt-[27px]">
              {/* 1행: 카테고리 | 수단 | 메모 */}
              {(showCategoryAsChip || showPaymentAsChip || (customMemo.trim() && expandedSection !== 'extra')) && (
                <div className="flex items-center justify-center gap-1.5">
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

                  {/* 메모 칩 */}
                  {customMemo.trim() && expandedSection !== 'extra' && (
                    <button
                      onClick={handleMemoToggle}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink-black text-paper-white text-caption max-w-[120px]"
                    >
                      <MessageSquare size={12} />
                      <span className="truncate">{customMemo.trim()}</span>
                    </button>
                  )}
                </div>
              )}

              {/* 2행: 태그들 */}
              {tags.length > 0 && expandedSection !== 'extra' && (
                <div className="flex items-center justify-center gap-1.5">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={handleMemoToggle}
                      className="px-2 py-1 rounded-full bg-paper-mid text-caption text-ink-mid"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
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
        {/* 4. 메모/태그 (선택) - 통합 입력 UI (B안) */}
        {/* ========================== */}
        {(!hasMemoContent || expandedSection === 'extra') && (
          <div className="mt-3">
            <button
              onClick={handleMemoToggle}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                expandedSection === 'extra' ? 'bg-paper-mid' : 'bg-paper-light'
              }`}
            >
              <MessageSquare size={18} className="text-ink-light" />
              <span className="text-body text-ink-light flex-1 text-left">
                {hasMemoContent ? (
                  <span className="text-ink-dark flex items-center gap-1 overflow-hidden">
                    {customMemo.trim() && <span className="truncate">{customMemo.trim()}</span>}
                    {tags.map((tag) => (
                      <span key={tag} className="shrink-0 px-1.5 py-0.5 rounded bg-paper-mid text-caption text-ink-mid">#{tag}</span>
                    ))}
                  </span>
                ) : (
                  '메모 / 태그 추가'
                )}
              </span>
              {expandedSection === 'extra' ? (
                <ChevronUp size={16} className="text-ink-light" />
              ) : (
                <ChevronDown size={16} className="text-ink-light" />
              )}
            </button>

            {/* 메모/태그 분리 입력 (펼침) */}
            {expandedSection === 'extra' && (
              <div className="mt-1.5 p-4 bg-paper-light rounded-xl animate-fade-in space-y-5">
                {/* 메모 섹션 */}
                <div className="space-y-2">
                  <label className="text-sub text-ink-dark font-medium">메모</label>
                  <input
                    ref={memoInputRef}
                    type="text"
                    value={customMemo}
                    onChange={(e) => setCustomMemo(e.target.value)}
                    placeholder="메모를 입력하세요"
                    className="w-full px-3 py-2.5 rounded-lg bg-paper-white text-body text-ink-dark outline-none focus:ring-2 focus:ring-ink-light placeholder:text-ink-light"
                  />
                  {/* 추천 메모 - 메모 입력 바로 아래 */}
                  {availableSuggestedMemos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {availableSuggestedMemos.slice(0, 4).map((memo) => (
                        <button
                          key={memo}
                          onClick={() => handleSuggestedMemoClick(memo)}
                          className="px-2.5 py-1.5 rounded-full bg-paper-white text-caption text-ink-mid hover:bg-paper-mid transition-colors"
                        >
                          {memo}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 구분선 */}
                <div className="h-px bg-paper-mid" />

                {/* 태그 섹션 */}
                <div className="space-y-2">
                  <label className="text-sub text-ink-dark font-medium">태그</label>

                  {/* 선택된 태그 칩들 */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagRemove(tag)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-ink-black text-caption text-paper-white hover:bg-ink-mid transition-colors"
                        >
                          #{tag}
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 태그 입력 */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="태그 입력 후 Enter"
                      className="flex-1 px-3 py-2 rounded-lg bg-paper-white text-body text-ink-dark outline-none focus:ring-2 focus:ring-ink-light placeholder:text-ink-light"
                    />
                    <button
                      onClick={handleAddNewTag}
                      disabled={!newTagInput.trim()}
                      className="px-3 py-2 rounded-lg bg-paper-white text-sub text-ink-mid hover:bg-paper-mid disabled:opacity-40 transition-colors"
                    >
                      추가
                    </button>
                  </div>

                  {/* 추천 태그 - 태그 입력 바로 아래 */}
                  {availableSuggestedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {availableSuggestedTags.slice(0, 6).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleSuggestedTagClick(tag)}
                          className="px-2.5 py-1.5 rounded-full bg-paper-white text-caption text-ink-mid hover:bg-paper-mid transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 확인 버튼 */}
                <button
                  onClick={handleMemoClose}
                  className="w-full py-3 rounded-lg bg-ink-black text-paper-white text-body font-medium hover:bg-ink-dark transition-colors"
                >
                  완료
                </button>
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
