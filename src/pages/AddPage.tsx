import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, ChevronDown, ChevronUp, Calendar, CreditCard, Tag, MessageSquare } from 'lucide-react';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore, selectExpenseCategories, selectIncomeCategories } from '@/stores/categoryStore';
import { usePaymentMethodStore, selectPaymentMethods, selectDefaultPaymentMethod } from '@/stores/paymentMethodStore';
import { useIncomeSourceStore, selectIncomeSources, selectDefaultIncomeSource } from '@/stores/incomeSourceStore';
import { useFabStore } from '@/stores/fabStore';
import { useCoachMark } from '@/components/coachmark';
import { Icon, DateTimePicker } from '@/components/common';
import { getCategorySuggestions } from '@/services/queries';
import type { TransactionType } from '@/types';
import { format, isToday, isYesterday, isTomorrow, isFuture, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';

function getDefaultCategoryByTime(hour: number): string {
  if (hour >= 7 && hour < 10) return 'transport';
  if (hour >= 11 && hour < 14) return 'food';
  if (hour >= 14 && hour < 17) return 'cafe';
  if (hour >= 18 && hour < 21) return 'food';
  return 'etc';
}

type ExpandedSection = 'none' | 'category' | 'payment' | 'extra';

export function AddPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amountInputRef = useRef<HTMLInputElement>(null);
  const memoInputRef = useRef<HTMLInputElement>(null);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const { fetchCategories } = useCategoryStore();
  const { fetchPaymentMethods } = usePaymentMethodStore();
  const { fetchIncomeSources } = useIncomeSourceStore();
  const { setSubmitHandler, setCanSubmit } = useFabStore();
  const { startTour } = useCoachMark();
  const expenseCategories = useCategoryStore(selectExpenseCategories);
  const incomeCategories = useCategoryStore(selectIncomeCategories);
  const paymentMethods = usePaymentMethodStore(selectPaymentMethods);
  const defaultPaymentMethod = usePaymentMethodStore(selectDefaultPaymentMethod);
  const incomeSources = useIncomeSourceStore(selectIncomeSources);
  const defaultIncomeSource = useIncomeSourceStore(selectDefaultIncomeSource);

  // URL 파라미터에서 type 읽기 (iOS 단축어 딥링크 지원)
  const initialType = searchParams.get('type') === 'income' ? 'income' : 'expense';
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [selectedIncomeSourceId, setSelectedIncomeSourceId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]); // 멀티 태그 배열
  const [customMemo, setCustomMemo] = useState(''); // 직접 입력 메모
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [showDatePicker, setShowDatePicker] = useState(false);
  // 첫 진입 시 카테고리/결제수단 열림 상태
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>('category');
  // 사용자가 직접 선택했는지 추적 (첫 선택 후 미니멀 칩으로 전환)
  const [hasUserSelectedCategory, setHasUserSelectedCategory] = useState(false);
  const [hasUserSelectedPayment, setHasUserSelectedPayment] = useState(false);
  // 카테고리별 추천 (메모 + 태그)
  const [suggestedMemos, setSuggestedMemos] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  // 태그 직접 입력
  const [newTagInput, setNewTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;
  const selectedCategory = currentCategories.find(c => c.id === selectedCategoryId);
  const selectedPaymentMethod = paymentMethods.find(p => p.id === selectedPaymentMethodId);
  const selectedIncomeSource = incomeSources.find(s => s.id === selectedIncomeSourceId);

  useEffect(() => {
    fetchCategories();
    fetchPaymentMethods();
    fetchIncomeSources();
  }, [fetchCategories, fetchPaymentMethods, fetchIncomeSources]);

  // 카테고리 변경 시 추천 메모/태그 로드
  useEffect(() => {
    if (selectedCategoryId) {
      getCategorySuggestions(selectedCategoryId, 6, 6).then(({ memos, tags }) => {
        setSuggestedMemos(memos);
        setSuggestedTags(tags);
      });
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    if (amountInputRef.current) {
      amountInputRef.current.focus();
    }
    // Start add tour on first visit
    startTour('add');
  }, [startTour]);

  useEffect(() => {
    if (currentCategories.length > 0 && !selectedCategoryId) {
      const hour = new Date().getHours();
      const defaultHint = getDefaultCategoryByTime(hour);

      let matchingCategory;
      if (defaultHint === 'food') {
        matchingCategory = currentCategories.find((c) => c.name.includes('식비'));
      } else if (defaultHint === 'cafe') {
        matchingCategory = currentCategories.find((c) => c.name.includes('카페'));
      } else if (defaultHint === 'transport') {
        matchingCategory = currentCategories.find((c) => c.name.includes('교통'));
      }

      setSelectedCategoryId(matchingCategory?.id || currentCategories[0]?.id || '');
    }
  }, [currentCategories, selectedCategoryId]);

  useEffect(() => {
    if (currentCategories.length > 0) {
      setSelectedCategoryId(currentCategories[0]?.id || '');
      // 타입 변경 시 상태 리셋 - 카테고리 다시 열림
      setHasUserSelectedCategory(false);
      setHasUserSelectedPayment(false);
      setExpandedSection('category');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]); // Only reset on type change, not on categories change

  useEffect(() => {
    if (defaultPaymentMethod && !selectedPaymentMethodId) {
      setSelectedPaymentMethodId(defaultPaymentMethod.id);
    }
  }, [defaultPaymentMethod, selectedPaymentMethodId]);

  useEffect(() => {
    if (defaultIncomeSource && !selectedIncomeSourceId) {
      setSelectedIncomeSourceId(defaultIncomeSource.id);
    }
  }, [defaultIncomeSource, selectedIncomeSourceId]);

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

  // 메모 내용 존재 여부 (태그 또는 커스텀 메모)
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
    if (!amount || parseInt(amount) <= 0 || !selectedCategoryId) return;

    await addTransaction({
      type,
      amount: parseInt(amount),
      categoryId: selectedCategoryId,
      paymentMethodId: type === 'expense' ? selectedPaymentMethodId : undefined,
      incomeSourceId: type === 'income' ? selectedIncomeSourceId : undefined,
      memo: customMemo.trim() || undefined,  // 순수 메모 텍스트만
      tags: tags.length > 0 ? tags : undefined,  // 태그는 별도 배열로 저장
      date,
      time,
    });

    navigate('/');
  }, [type, amount, selectedCategoryId, selectedPaymentMethodId, selectedIncomeSourceId, customMemo, tags, date, time, addTransaction, navigate]);

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
    if (isTomorrow(d)) return '내일';
    if (isFuture(startOfDay(d))) {
      return format(d, 'M/d (EEE)', { locale: ko }) + ' 예정';
    }
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
      } else if (type === 'income' && !hasUserSelectedPayment) {
        // 수입: 수입수단 선택으로 이동
        setExpandedSection('payment');
      } else {
        // 메모 입력창 자동 열기 + 커서 포커스
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

  const handleIncomeSourceSelect = (sourceId: string) => {
    setSelectedIncomeSourceId(sourceId);
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
    // 메모 펼칠 때 자동 포커스
    if (willExpand) {
      setShouldFocusMemo(true);
    }
  };

  const handleMemoClose = () => {
    setExpandedSection('none');
  };

  // 미니멀 칩 vs 풀 버튼 결정
  const showCategoryAsChip = hasUserSelectedCategory && expandedSection !== 'category';
  const showPaymentAsChip = hasUserSelectedPayment && expandedSection !== 'payment';

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

        <div className="w-10 -mr-1" />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto px-5">
        {/* ==================== */}
        {/* 1. 일시 선택 */}
        {/* ==================== */}
        <div className="pt-[50px] pb-4 flex justify-center">
          <button
            onClick={() => setShowDatePicker(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
              isFuture(startOfDay(date))
                ? 'bg-blue-100 dark:bg-blue-900/30'
                : 'bg-paper-light'
            }`}
          >
            <Calendar size={14} className={isFuture(startOfDay(date)) ? 'text-blue-500' : 'text-ink-mid'} />
            <span className={`text-sub ${isFuture(startOfDay(date)) ? 'text-blue-600 dark:text-blue-400' : 'text-ink-dark'}`}>
              {formatDateLabel(date)} {time}
            </span>
          </button>
        </div>

        {/* ==================== */}
        {/* 2. 금액 입력 (Hero) */}
        {/* ==================== */}
        <div className="flex flex-col items-center py-6" data-tour="add-amount">
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

                  {/* 결제수단 미니 칩 (지출) */}
                  {showPaymentAsChip && selectedPaymentMethod && type === 'expense' && (
                    <button
                      onClick={() => toggleSection('payment')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink-black text-paper-white text-caption"
                    >
                      <Icon name={selectedPaymentMethod.icon} size={12} />
                      <span>{selectedPaymentMethod.name}</span>
                    </button>
                  )}

                  {/* 수입수단 미니 칩 (수입) */}
                  {showPaymentAsChip && selectedIncomeSource && type === 'income' && (
                    <button
                      onClick={() => toggleSection('payment')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink-black text-paper-white text-caption"
                    >
                      <Icon name={selectedIncomeSource.icon} size={12} />
                      <span>{selectedIncomeSource.name}</span>
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
        <div className="space-y-2" data-tour="add-category">

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

          {/* 수입수단 선택 (수입일 때만) */}
          {type === 'income' && !showPaymentAsChip && (
            <div>
              <button
                onClick={() => toggleSection('payment')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                  expandedSection === 'payment' ? 'bg-paper-mid' : 'bg-paper-light'
                }`}
              >
                {selectedIncomeSource ? (
                  <>
                    <div className="w-9 h-9 rounded-full bg-paper-mid flex items-center justify-center">
                      <Icon name={selectedIncomeSource.icon} size={18} className="text-ink-mid" />
                    </div>
                    <span className="text-body text-ink-dark flex-1 text-left">
                      {selectedIncomeSource.name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-paper-mid flex items-center justify-center">
                      <CreditCard size={18} className="text-ink-light" />
                    </div>
                    <span className="text-body text-ink-light flex-1 text-left">
                      수입수단 선택
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

              {/* 수입수단 목록 (펼침) */}
              {expandedSection === 'payment' && (
                <div className="mt-1.5 p-2.5 bg-paper-light rounded-xl animate-fade-in">
                  <div className="flex flex-wrap gap-1.5">
                    {incomeSources.map((source) => {
                      const isSelected = source.id === selectedIncomeSourceId;
                      return (
                        <button
                          key={source.id}
                          onClick={() => handleIncomeSourceSelect(source.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sub transition-colors ${
                            isSelected
                              ? 'bg-ink-black text-paper-white'
                              : 'bg-paper-white text-ink-mid'
                          }`}
                        >
                          <Icon name={source.icon} size={16} />
                          <span>{source.name}</span>
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
        disableFuture={false}
      />
    </div>
  );
}
