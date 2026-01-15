import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Trash2, X } from 'lucide-react';
import { useFabStore } from '@/stores/fabStore';
import { Icon } from '@/components/common';
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  getCategorySuggestions,
} from '@/services/queries';
import { db } from '@/services/database';
import type { Category, PaymentMethod, IncomeSource, RecurrenceFrequency, RecurringExecutionMode, TransactionType } from '@/types';
import { format } from 'date-fns';

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'monthly', label: '매월' },
  { value: 'yearly', label: '매년' },
  { value: 'weekly', label: '매주' },
  { value: 'biweekly', label: '2주마다' },
  { value: 'daily', label: '매일' },
];

const EXECUTION_MODE_OPTIONS: { value: RecurringExecutionMode; label: string; description: string }[] = [
  { value: 'on_date', label: '실행일에 입력', description: '해당 날짜가 되면 거래가 자동 입력됩니다' },
  { value: 'start_of_month', label: '월초 선반영', description: '매월 1일에 해당 월의 거래가 미리 입력됩니다' },
];

export function RecurringTransactionEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') as TransactionType | null;
  const isEditing = !!id;

  const { setSubmitHandler, setCanSubmit, reset: resetFab } = useFabStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formType, setFormType] = useState<TransactionType>(typeParam || 'expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPaymentMethodId, setFormPaymentMethodId] = useState('');
  const [formIncomeSourceId, setFormIncomeSourceId] = useState('');
  const [formMemo, setFormMemo] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [suggestedMemos, setSuggestedMemos] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [formFrequency, setFormFrequency] = useState<RecurrenceFrequency>('monthly');
  const [formDayOfMonth, setFormDayOfMonth] = useState(new Date().getDate());
  const [formStartDate, setFormStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formEndDate, setFormEndDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formExecutionMode, setFormExecutionMode] = useState<RecurringExecutionMode>('on_date');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // 카테고리 변경 시 추천 메모/태그 로드
  useEffect(() => {
    if (formCategoryId) {
      getCategorySuggestions(formCategoryId, 6, 6).then(({ memos, tags }) => {
        setSuggestedMemos(memos);
        setSuggestedTags(tags);
      });
    }
  }, [formCategoryId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, methods, sources] = await Promise.all([
        db.categories.toArray(),
        db.paymentMethods.orderBy('order').toArray(),
        db.incomeSources.orderBy('order').toArray(),
      ]);
      setCategories(cats);
      setPaymentMethods(methods);
      setIncomeSources(sources);

      // Set default category if adding new
      if (!isEditing) {
        const defaultCat = cats.find((c) => c.type === (typeParam || 'expense'));
        if (defaultCat) setFormCategoryId(defaultCat.id);

        if (typeParam === 'expense' || !typeParam) {
          const defaultMethod = methods.find((p) => p.isDefault);
          if (defaultMethod) setFormPaymentMethodId(defaultMethod.id);
        } else {
          const defaultSource = sources.find((s) => s.isDefault);
          if (defaultSource) setFormIncomeSourceId(defaultSource.id);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing data when editing
  useEffect(() => {
    if (isEditing && !isLoading) {
      loadExistingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, isLoading]); // Only trigger on edit mode and loading state

  const loadExistingData = async () => {
    if (!id) return;
    const list = await getRecurringTransactions();
    const item = list.find((r) => r.id === id);
    if (item) {
      setFormType(item.type);
      setFormAmount(item.amount.toString());
      setFormCategoryId(item.categoryId);
      setFormPaymentMethodId(item.paymentMethodId || '');
      setFormIncomeSourceId(item.incomeSourceId || '');
      setFormMemo(item.memo || '');
      setFormTags(item.tags || []);
      setFormFrequency(item.frequency);
      setFormDayOfMonth(item.dayOfMonth || 1);
      setFormStartDate(format(item.startDate, 'yyyy-MM-dd'));
      setFormEndDate(item.endDate ? format(item.endDate, 'yyyy-MM-dd') : '');
      setFormIsActive(item.isActive);
      setFormExecutionMode(item.executionMode || 'on_date');
    }
  };

  // 추천 메모 클릭
  const handleSuggestedMemoClick = (memo: string) => {
    setFormMemo(memo);
  };

  // 추천 태그 클릭
  const handleSuggestedTagClick = (tag: string) => {
    if (!formTags.includes(tag)) {
      setFormTags([...formTags, tag]);
    }
  };

  // 태그 삭제
  const handleTagRemove = (tagToRemove: string) => {
    setFormTags(formTags.filter((t) => t !== tagToRemove));
  };

  // 엔터키로 태그 추가
  const handleAddNewTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, ''); // # 제거
    if (trimmed && !formTags.includes(trimmed)) {
      setFormTags([...formTags, trimmed]);
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
  const availableSuggestedMemos = suggestedMemos.filter((m) => m !== formMemo.trim());
  const availableSuggestedTags = suggestedTags.filter((t) => !formTags.includes(t));

  const handleSubmit = useCallback(async () => {
    const amount = parseInt(formAmount) || 0;
    if (amount <= 0 || !formCategoryId || isSaving) {
      if (!isSaving) {
        alert('금액과 카테고리를 입력해주세요.');
      }
      return;
    }

    setIsSaving(true);
    try {
      const startDate = new Date(formStartDate);
      const endDate = formEndDate ? new Date(formEndDate) : undefined;

      // Calculate next execution date
      let nextExecutionDate: Date;
      if (formFrequency === 'monthly') {
        const now = new Date();
        if (now.getDate() <= formDayOfMonth) {
          nextExecutionDate = new Date(now.getFullYear(), now.getMonth(), formDayOfMonth);
        } else {
          nextExecutionDate = new Date(now.getFullYear(), now.getMonth() + 1, formDayOfMonth);
        }
      } else {
        nextExecutionDate = startDate > new Date() ? startDate : new Date();
      }

      if (isEditing && id) {
        await updateRecurringTransaction(id, {
          type: formType,
          amount,
          categoryId: formCategoryId,
          paymentMethodId: formType === 'expense' ? formPaymentMethodId || undefined : undefined,
          incomeSourceId: formType === 'income' ? formIncomeSourceId || undefined : undefined,
          memo: formMemo.trim() || undefined,
          tags: formTags.length > 0 ? formTags : undefined,
          frequency: formFrequency,
          dayOfMonth: formFrequency === 'monthly' ? formDayOfMonth : undefined,
          startDate,
          endDate,
          isActive: formIsActive,
          executionMode: formExecutionMode,
          nextExecutionDate,
        });
      } else {
        await createRecurringTransaction({
          type: formType,
          amount,
          categoryId: formCategoryId,
          paymentMethodId: formType === 'expense' ? formPaymentMethodId || undefined : undefined,
          incomeSourceId: formType === 'income' ? formIncomeSourceId || undefined : undefined,
          memo: formMemo.trim() || undefined,
          tags: formTags.length > 0 ? formTags : undefined,
          frequency: formFrequency,
          dayOfMonth: formFrequency === 'monthly' ? formDayOfMonth : undefined,
          startDate,
          endDate,
          isActive: formIsActive,
          executionMode: formExecutionMode,
          nextExecutionDate,
        });
      }
      navigate(-1);
    } finally {
      setIsSaving(false);
    }
  }, [
    formAmount,
    formCategoryId,
    formMemo,
    formTags,
    formStartDate,
    formEndDate,
    formFrequency,
    formDayOfMonth,
    isEditing,
    id,
    formType,
    formPaymentMethodId,
    formIncomeSourceId,
    formIsActive,
    formExecutionMode,
    isSaving,
    navigate,
  ]);

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('이 반복 거래를 삭제하시겠습니까?')) return;
    await deleteRecurringTransaction(id);
    navigate(-1);
  };

  const amount = parseInt(formAmount) || 0;
  const canSubmit = amount > 0 && !!formCategoryId && !isSaving;

  // FAB 저장 버튼 연동
  useEffect(() => {
    setCanSubmit(canSubmit);
    setSubmitHandler(canSubmit ? handleSubmit : null);

    return () => {
      resetFab();
    };
  }, [canSubmit, handleSubmit, setCanSubmit, setSubmitHandler, resetFab]);

  const filteredCategories = categories.filter((c) => c.type === formType);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper-white pb-nav">
        <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft size={24} className="text-ink-black" />
          </button>
          <h1 className="text-title text-ink-black">
            {isEditing ? '반복 거래 수정' : '새 반복 거래'}
          </h1>
          <div className="w-10" />
        </header>
        <div className="flex items-center justify-center py-20">
          <p className="text-body text-ink-mid">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-white pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <h1 className="text-title text-ink-black">
          {isEditing ? '반복 거래 수정' : '새 반복 거래'}
        </h1>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-10 h-10 flex items-center justify-center ${
            canSubmit ? 'text-ink-black' : 'text-ink-light'
          }`}
        >
          <Check size={24} />
        </button>
      </header>

      {/* Form */}
      <div className="p-4 pb-24 space-y-4">
        {/* Type Toggle */}
        <div className="flex bg-paper-light dark:bg-ink-dark/30 rounded-lg p-1">
          <button
            onClick={() => {
              setFormType('expense');
              const cat = categories.find((c) => c.type === 'expense');
              if (cat) setFormCategoryId(cat.id);
              const method = paymentMethods.find((p) => p.isDefault);
              if (method) setFormPaymentMethodId(method.id);
            }}
            className={`flex-1 py-2.5 rounded-md text-body transition-all ${
              formType === 'expense'
                ? 'bg-ink-black dark:bg-pig-pink text-paper-white font-medium shadow-sm'
                : 'text-ink-light'
            }`}
          >
            지출
          </button>
          <button
            onClick={() => {
              setFormType('income');
              const cat = categories.find((c) => c.type === 'income');
              if (cat) setFormCategoryId(cat.id);
              const source = incomeSources.find((s) => s.isDefault);
              if (source) setFormIncomeSourceId(source.id);
            }}
            className={`flex-1 py-2.5 rounded-md text-body transition-all ${
              formType === 'income'
                ? 'bg-ink-black dark:bg-pig-pink text-paper-white font-medium shadow-sm'
                : 'text-ink-light'
            }`}
          >
            수입
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">금액</label>
          <div className="flex items-center bg-paper-light rounded-md px-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formAmount ? parseInt(formAmount).toLocaleString() : ''}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 10) {
                  setFormAmount(value);
                }
              }}
              placeholder="0"
              className="flex-1 py-3 bg-transparent text-body text-ink-black outline-none"
              autoFocus
            />
            <span className="text-ink-mid">원</span>
          </div>
        </div>

        {/* Memo & Tags - 분리 입력 UI */}
        <div className="space-y-4">
          {/* 메모 섹션 */}
          <div>
            <label className="text-sub text-ink-mid block mb-2">메모 (선택)</label>
            <input
              type="text"
              value={formMemo}
              onChange={(e) => setFormMemo(e.target.value)}
              placeholder="예: 넷플릭스 구독료"
              className="w-full py-3 px-4 bg-paper-light rounded-md text-body text-ink-black outline-none"
            />
            {/* 추천 메모 */}
            {availableSuggestedMemos.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {availableSuggestedMemos.slice(0, 4).map((memo) => (
                  <button
                    key={memo}
                    onClick={() => handleSuggestedMemoClick(memo)}
                    className="px-2.5 py-1.5 rounded-full bg-paper-mid text-caption text-ink-mid hover:bg-paper-dark transition-colors"
                  >
                    {memo}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 태그 섹션 */}
          <div>
            <label className="text-sub text-ink-mid block mb-2">태그 (선택)</label>

            {/* 선택된 태그 칩들 */}
            {formTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {formTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagRemove(tag)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-ink-black dark:bg-pig-pink text-caption text-paper-white hover:opacity-80 transition-opacity"
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
                className="flex-1 py-2.5 px-4 bg-paper-light rounded-md text-body text-ink-black outline-none"
              />
              <button
                onClick={handleAddNewTag}
                disabled={!newTagInput.trim()}
                className="px-4 py-2.5 rounded-md bg-paper-light text-sub text-ink-mid hover:bg-paper-mid disabled:opacity-40 transition-colors"
              >
                추가
              </button>
            </div>

            {/* 추천 태그 */}
            {availableSuggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {availableSuggestedTags.slice(0, 6).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleSuggestedTagClick(tag)}
                    className="px-2.5 py-1.5 rounded-full bg-paper-mid text-caption text-ink-mid hover:bg-paper-dark transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">카테고리</label>
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFormCategoryId(cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                  formCategoryId === cat.id
                    ? 'border-ink-black dark:border-pig-pink bg-ink-black dark:bg-pig-pink text-paper-white'
                    : 'border-paper-mid text-ink-mid'
                }`}
              >
                <Icon name={cat.icon} size={16} />
                <span className="text-sub">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method (expense only) */}
        {formType === 'expense' && (
          <div>
            <label className="text-sub text-ink-mid block mb-2">결제수단</label>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setFormPaymentMethodId(method.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                    formPaymentMethodId === method.id
                      ? 'border-ink-black dark:border-pig-pink bg-ink-black dark:bg-pig-pink text-paper-white'
                      : 'border-paper-mid text-ink-mid'
                  }`}
                >
                  <Icon name={method.icon} size={16} />
                  <span className="text-sub">{method.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Income Source (income only) */}
        {formType === 'income' && (
          <div>
            <label className="text-sub text-ink-mid block mb-2">수입수단</label>
            <div className="flex flex-wrap gap-2">
              {incomeSources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => setFormIncomeSourceId(source.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                    formIncomeSourceId === source.id
                      ? 'border-ink-black dark:border-pig-pink bg-ink-black dark:bg-pig-pink text-paper-white'
                      : 'border-paper-mid text-ink-mid'
                  }`}
                >
                  <Icon name={source.icon} size={16} />
                  <span className="text-sub">{source.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Frequency */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">반복 주기</label>
          <div className="flex flex-wrap gap-2">
            {FREQUENCY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFormFrequency(opt.value)}
                className={`px-4 py-2 rounded-full border transition-colors ${
                  formFrequency === opt.value
                    ? 'border-ink-black dark:border-pig-pink bg-ink-black dark:bg-pig-pink text-paper-white'
                    : 'border-paper-mid text-ink-mid'
                }`}
              >
                <span className="text-sub">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Day of Month (for monthly) */}
        {formFrequency === 'monthly' && (
          <div>
            <label className="text-sub text-ink-mid block mb-2">매월 실행일</label>
            <div className="flex items-center bg-paper-light rounded-md px-4">
              <input
                type="number"
                min={1}
                max={31}
                value={formDayOfMonth}
                onChange={(e) => setFormDayOfMonth(parseInt(e.target.value) || 1)}
                className="flex-1 py-3 bg-transparent text-body text-ink-black outline-none"
              />
              <span className="text-ink-mid">일</span>
            </div>
          </div>
        )}

        {/* Start Date */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">시작일</label>
          <input
            type="date"
            value={formStartDate}
            onChange={(e) => setFormStartDate(e.target.value)}
            className="w-full py-3 px-4 bg-paper-light rounded-md text-body text-ink-black outline-none"
          />
        </div>

        {/* End Date (Optional) */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">종료일 (선택)</label>
          <input
            type="date"
            value={formEndDate}
            onChange={(e) => setFormEndDate(e.target.value)}
            className="w-full py-3 px-4 bg-paper-light rounded-md text-body text-ink-black outline-none"
          />
          <p className="text-caption text-ink-light mt-1">비워두면 무기한 반복됩니다</p>
        </div>

        {/* Execution Mode */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">실행 방식</label>
          <div className="space-y-2">
            {EXECUTION_MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFormExecutionMode(opt.value)}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  formExecutionMode === opt.value
                    ? 'border-ink-black dark:border-pig-pink bg-paper-light dark:bg-ink-dark/30'
                    : 'border-paper-mid'
                }`}
              >
                <span className={`text-body ${formExecutionMode === opt.value ? 'text-ink-black' : 'text-ink-mid'}`}>
                  {opt.label}
                </span>
                <p className="text-caption text-ink-light mt-0.5">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between py-3">
          <div className="flex-1 pr-4">
            <span className="text-body text-ink-black">활성화</span>
            <p className="text-caption text-ink-light mt-1">
              {formExecutionMode === 'on_date'
                ? '활성화하면 예상 거래로 표시되고, 해당 날짜에 실제 거래로 입력됩니다'
                : '활성화하면 매월 1일에 해당 월의 거래가 미리 입력됩니다'}
            </p>
          </div>
          <button
            onClick={() => setFormIsActive(!formIsActive)}
            className={`w-12 h-6 rounded-full transition-colors ${
              formIsActive ? 'bg-green-500' : 'bg-paper-mid'
            }`}
          >
            <div
              className={`w-5 h-5 bg-paper-white rounded-full transition-transform ${
                formIsActive ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Delete Button (edit mode only) */}
        {isEditing && (
          <button
            onClick={handleDelete}
            className="w-full py-3 text-red-500 flex items-center justify-center gap-2 mt-4"
          >
            <Trash2 size={18} />
            <span>삭제</span>
          </button>
        )}
      </div>
    </div>
  );
}
