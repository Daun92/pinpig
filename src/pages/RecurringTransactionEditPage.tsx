import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Trash2 } from 'lucide-react';
import { useFabStore } from '@/stores/fabStore';
import { Icon } from '@/components/common';
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from '@/services/queries';
import { db } from '@/services/database';
import type { Category, PaymentMethod, RecurrenceFrequency, TransactionType } from '@/types';
import { format } from 'date-fns';

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'monthly', label: '매월' },
  { value: 'weekly', label: '매주' },
  { value: 'biweekly', label: '2주마다' },
  { value: 'yearly', label: '매년' },
  { value: 'daily', label: '매일' },
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formType, setFormType] = useState<TransactionType>(typeParam || 'expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPaymentMethodId, setFormPaymentMethodId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMemo, setFormMemo] = useState('');
  const [formFrequency, setFormFrequency] = useState<RecurrenceFrequency>('monthly');
  const [formDayOfMonth, setFormDayOfMonth] = useState(new Date().getDate());
  const [formStartDate, setFormStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formEndDate, setFormEndDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, methods] = await Promise.all([
        db.categories.toArray(),
        db.paymentMethods.orderBy('order').toArray(),
      ]);
      setCategories(cats);
      setPaymentMethods(methods);

      // Set default category if adding new
      if (!isEditing) {
        const defaultCat = cats.find((c) => c.type === (typeParam || 'expense'));
        if (defaultCat) setFormCategoryId(defaultCat.id);
        const defaultMethod = methods.find((p) => p.isDefault);
        if (defaultMethod) setFormPaymentMethodId(defaultMethod.id);
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
  }, [isEditing, isLoading]);

  const loadExistingData = async () => {
    if (!id) return;
    const list = await getRecurringTransactions();
    const item = list.find((r) => r.id === id);
    if (item) {
      setFormType(item.type);
      setFormAmount(item.amount.toString());
      setFormCategoryId(item.categoryId);
      setFormPaymentMethodId(item.paymentMethodId || '');
      setFormDescription(item.description);
      setFormMemo(item.memo || '');
      setFormFrequency(item.frequency);
      setFormDayOfMonth(item.dayOfMonth || 1);
      setFormStartDate(format(item.startDate, 'yyyy-MM-dd'));
      setFormEndDate(item.endDate ? format(item.endDate, 'yyyy-MM-dd') : '');
      setFormIsActive(item.isActive);
    }
  };

  const handleSubmit = useCallback(async () => {
    const amount = parseInt(formAmount) || 0;
    if (amount <= 0 || !formCategoryId || !formDescription.trim() || isSaving) {
      if (!isSaving) {
        alert('금액, 카테고리, 설명을 입력해주세요.');
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
          paymentMethodId: formPaymentMethodId || undefined,
          description: formDescription.trim(),
          memo: formMemo.trim() || undefined,
          frequency: formFrequency,
          dayOfMonth: formFrequency === 'monthly' ? formDayOfMonth : undefined,
          startDate,
          endDate,
          isActive: formIsActive,
          nextExecutionDate,
        });
      } else {
        await createRecurringTransaction({
          type: formType,
          amount,
          categoryId: formCategoryId,
          paymentMethodId: formPaymentMethodId || undefined,
          description: formDescription.trim(),
          memo: formMemo.trim() || undefined,
          frequency: formFrequency,
          dayOfMonth: formFrequency === 'monthly' ? formDayOfMonth : undefined,
          startDate,
          endDate,
          isActive: formIsActive,
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
    formDescription,
    formStartDate,
    formEndDate,
    formFrequency,
    formDayOfMonth,
    isEditing,
    id,
    formType,
    formPaymentMethodId,
    formMemo,
    formIsActive,
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
  const canSubmit = amount > 0 && !!formCategoryId && !!formDescription.trim() && !isSaving;

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
        <div className="flex bg-paper-light/50 rounded-lg p-1">
          <button
            onClick={() => {
              setFormType('expense');
              const cat = categories.find((c) => c.type === 'expense');
              if (cat) setFormCategoryId(cat.id);
            }}
            className={`flex-1 py-2 rounded-md text-body transition-colors ${
              formType === 'expense'
                ? 'bg-paper-white text-ink-black'
                : 'text-ink-mid'
            }`}
          >
            지출
          </button>
          <button
            onClick={() => {
              setFormType('income');
              const cat = categories.find((c) => c.type === 'income');
              if (cat) setFormCategoryId(cat.id);
            }}
            className={`flex-1 py-2 rounded-md text-body transition-colors ${
              formType === 'income'
                ? 'bg-paper-white text-ink-black'
                : 'text-ink-mid'
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
              type="number"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="0"
              className="flex-1 py-3 bg-transparent text-body text-ink-black outline-none"
              autoFocus
            />
            <span className="text-ink-mid">원</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">설명</label>
          <input
            type="text"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="예: 넷플릭스, 월급, 월세"
            className="w-full py-3 px-4 bg-paper-light rounded-md text-body text-ink-black outline-none"
          />
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

        {/* Memo */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">메모 (선택)</label>
          <input
            type="text"
            value={formMemo}
            onChange={(e) => setFormMemo(e.target.value)}
            placeholder="메모"
            className="w-full py-3 px-4 bg-paper-light rounded-md text-body text-ink-black outline-none"
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between py-2">
          <span className="text-body text-ink-black">활성화</span>
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
