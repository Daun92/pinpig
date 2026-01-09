import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, ChevronDown, ChevronUp, Calendar, CreditCard, Tag, MessageSquare, Plus } from 'lucide-react';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore, selectExpenseCategories, selectIncomeCategories } from '@/stores/categoryStore';
import { usePaymentMethodStore, selectPaymentMethods, selectDefaultPaymentMethod } from '@/stores/paymentMethodStore';
import { useIncomeSourceStore, selectIncomeSources, selectDefaultIncomeSource } from '@/stores/incomeSourceStore';
import { useFabStore } from '@/stores/fabStore';
import { useCoachMark } from '@/components/coachmark';
import { Icon, DateTimePicker } from '@/components/common';
import { getTagSuggestions } from '@/services/queries';
import type { TransactionType } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
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
  // 태그 제안 (카테고리별 + 전체)
  const [categoryTags, setCategoryTags] = useState<string[]>([]);
  const [recentTags, setRecentTags] = useState<string[]>([]);

  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;
  const selectedCategory = currentCategories.find(c => c.id === selectedCategoryId);
  const selectedPaymentMethod = paymentMethods.find(p => p.id === selectedPaymentMethodId);
  const selectedIncomeSource = incomeSources.find(s => s.id === selectedIncomeSourceId);

  useEffect(() => {
    fetchCategories();
    fetchPaymentMethods();
    fetchIncomeSources();
  }, [fetchCategories, fetchPaymentMethods, fetchIncomeSources]);

  // 카테고리 변경 시 태그 제안 업데이트
  useEffect(() => {
    const loadTags = async () => {
      const suggestions = await getTagSuggestions(selectedCategoryId || null);
      setCategoryTags(suggestions.categoryTags);
      setRecentTags(suggestions.recentTags);
    };
    loadTags();
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
  }, [type]);

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

  // 태그 + 커스텀 메모를 합쳐서 최종 메모 생성
  const combinedMemo = [...tags, customMemo].filter(Boolean).join(' ');
  const hasMemoContent = tags.length > 0 || customMemo.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (!amount || parseInt(amount) <= 0 || !selectedCategoryId) return;

    await addTransaction({
      type,
      amount: parseInt(amount),
      categoryId: selectedCategoryId,
      paymentMethodId: type === 'expense' ? selectedPaymentMethodId : undefined,
      incomeSourceId: type === 'income' ? selectedIncomeSourceId : undefined,
      memo: combinedMemo || '',
      date,
      time,
    });

    navigate('/');
  }, [type, amount, selectedCategoryId, selectedPaymentMethodId, selectedIncomeSourceId, combinedMemo, date, time, addTransaction, navigate]);

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

  const handleTagSelect = (tag: string) => {
    // 이미 선택된 태그면 제거, 아니면 추가
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleTagRemove = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // 태그 추가 함수 (엔터키 또는 + 버튼)
  const handleAddTag = () => {
    const newTag = customMemo.trim();
    if (newTag.length >= 1 && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setCustomMemo('');
    }
  };

  // 엔터키로 태그 추가
  const handleMemoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // 현재 선택되지 않은 태그만 제안 (카테고리별 + 일반)
  const availableCategoryTags = categoryTags.filter(tag => !tags.includes(tag));
  const availableRecentTags = recentTags.filter(tag => !tags.includes(tag));

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

          {/* 미니멀 칩 영역 - 선택 완료된 항목들 */}
          {(showCategoryAsChip || showPaymentAsChip || (hasMemoContent && expandedSection !== 'extra')) && (
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

              {/* 메모/태그 미니 칩들 */}
              {hasMemoContent && expandedSection !== 'extra' && (
                <>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={handleMemoToggle}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-paper-light text-caption text-ink-mid"
                    >
                      <span>{tag}</span>
                    </button>
                  ))}
                  {customMemo && (
                    <button
                      onClick={handleMemoToggle}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-paper-light text-caption text-ink-mid max-w-[120px]"
                    >
                      <MessageSquare size={12} />
                      <span className="truncate">{customMemo}</span>
                    </button>
                  )}
                </>
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
        {/* 4. 메모 (선택) - 멀티 태그 시스템 */}
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
                  <span className="text-ink-dark truncate">{combinedMemo}</span>
                ) : (
                  '메모 추가'
                )}
              </span>
              {expandedSection === 'extra' ? (
                <ChevronUp size={16} className="text-ink-light" />
              ) : (
                <ChevronDown size={16} className="text-ink-light" />
              )}
            </button>

            {/* 메모 입력 (펼침) - 멀티 태그 + 직접 입력 */}
            {expandedSection === 'extra' && (
              <div className="mt-1.5 p-3 bg-paper-light rounded-xl animate-fade-in space-y-3">
                {/* 선택된 태그 (삭제 가능) */}
                {tags.length > 0 && (
                  <div>
                    <label className="text-caption text-ink-light mb-1.5 block">선택됨</label>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagRemove(tag)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-ink-black text-paper-white text-sub transition-colors"
                        >
                          <span>{tag}</span>
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 카테고리 관련 태그 (선택 가능) */}
                {availableCategoryTags.length > 0 && (
                  <div>
                    <label className="text-caption text-ink-light mb-1.5 block">
                      {selectedCategory?.name || '카테고리'} 관련
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCategoryTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagSelect(tag)}
                          className="px-2.5 py-1.5 rounded-full bg-accent-blue/10 text-sub text-accent-blue hover:bg-accent-blue/20 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 최근 사용 태그 (선택 가능) */}
                {availableRecentTags.length > 0 && (
                  <div>
                    <label className="text-caption text-ink-light mb-1.5 block">자주 사용</label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableRecentTags.slice(0, 8).map((tag) => (
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

                {/* 직접 메모 입력 필드 + 추가 버튼 */}
                <div>
                  <label className="text-caption text-ink-light mb-1.5 block">직접 입력</label>
                  <div className="flex gap-2">
                    <input
                      ref={memoInputRef}
                      type="text"
                      value={customMemo}
                      onChange={(e) => setCustomMemo(e.target.value)}
                      onKeyDown={handleMemoKeyDown}
                      placeholder="메모 입력 후 엔터 또는 +"
                      className="flex-1 px-3 py-2.5 rounded-lg bg-paper-white text-body text-ink-dark outline-none focus:ring-2 focus:ring-ink-light placeholder:text-ink-light"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      disabled={!customMemo.trim()}
                      className="w-11 h-11 flex items-center justify-center rounded-lg bg-ink-black text-paper-white disabled:bg-paper-mid disabled:text-ink-light transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* 닫기 버튼 */}
                <button
                  onClick={handleMemoClose}
                  className="w-full py-2.5 rounded-lg bg-paper-white text-sub text-ink-mid hover:bg-paper-mid transition-colors"
                >
                  확인
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
