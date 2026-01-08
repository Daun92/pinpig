import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { usePaymentMethodStore, selectPaymentMethods } from '@/stores/paymentMethodStore';
import { useFabStore } from '@/stores/fabStore';
import { Icon } from '@/components/common';

const AVAILABLE_ICONS = [
  'Banknote', 'CreditCard', 'Building', 'Wallet', 'Smartphone', 'QrCode',
];

const AVAILABLE_COLORS = [
  '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#F44336', '#607D8B',
  '#00BCD4', '#795548', '#E91E63', '#3F51B5',
];

export function PaymentMethodEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { fetchPaymentMethods, addPaymentMethod, updatePaymentMethod } = usePaymentMethodStore();
  const paymentMethods = usePaymentMethodStore(selectPaymentMethods);
  const { setSubmitHandler, setCanSubmit, reset: resetFab } = useFabStore();

  const [formData, setFormData] = useState({
    name: '',
    icon: 'CreditCard',
    color: '#2196F3',
    budget: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (isEditing && paymentMethods.length > 0) {
      const method = paymentMethods.find((pm) => pm.id === id);
      if (method) {
        setFormData({
          name: method.name,
          icon: method.icon,
          color: method.color,
          budget: method.budget ? method.budget.toString() : '',
        });
      }
    }
  }, [isEditing, id, paymentMethods]);

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const budgetValue = formData.budget ? parseInt(formData.budget.replace(/,/g, ''), 10) : undefined;

      if (isEditing && id) {
        await updatePaymentMethod(id, {
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          budget: budgetValue,
        });
      } else {
        await addPaymentMethod({
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          order: paymentMethods.length,
          budget: budgetValue,
        });
      }
      navigate(-1);
    } finally {
      setIsSaving(false);
    }
  }, [formData, isEditing, id, paymentMethods.length, updatePaymentMethod, addPaymentMethod, navigate, isSaving]);

  // 예산 입력 핸들러 (숫자만 허용, 천단위 콤마)
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    if (value === '') {
      setFormData((prev) => ({ ...prev, budget: '' }));
    } else {
      const numValue = parseInt(value, 10);
      setFormData((prev) => ({ ...prev, budget: numValue.toLocaleString() }));
    }
  };

  const canSubmit = formData.name.trim().length > 0 && !isSaving;

  // FAB 저장 버튼 연동
  useEffect(() => {
    setCanSubmit(canSubmit);
    setSubmitHandler(canSubmit ? handleSubmit : null);

    return () => {
      resetFab();
    };
  }, [canSubmit, handleSubmit, setCanSubmit, setSubmitHandler, resetFab]);

  return (
    <div className="min-h-screen bg-paper-white pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <h1 className="text-title text-ink-black">
          {isEditing ? '결제수단 수정' : '새 결제수단'}
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
      <div className="p-6 pb-24 space-y-6">
        {/* Name Input */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">이름</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="결제수단 이름 (예: 신한카드)"
            className="w-full px-4 py-3 bg-paper-light rounded-md text-body text-ink-black outline-none border border-transparent focus:border-ink-mid dark:focus:border-paper-mid"
            autoFocus
          />
        </div>

        {/* Budget Input */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">월 예산 한도 (선택)</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={formData.budget}
              onChange={handleBudgetChange}
              placeholder="0"
              className="w-full px-4 py-3 pr-10 bg-paper-light rounded-md text-body text-ink-black outline-none border border-transparent focus:border-ink-mid dark:focus:border-paper-mid"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-body text-ink-mid">원</span>
          </div>
          <p className="text-caption text-ink-light mt-1.5">
            설정하면 분석에서 사용현황을 확인할 수 있어요
          </p>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">아이콘</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_ICONS.map((iconName) => (
              <button
                key={iconName}
                onClick={() => setFormData((prev) => ({ ...prev, icon: iconName }))}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  formData.icon === iconName
                    ? 'bg-ink-black dark:bg-pig-pink'
                    : 'bg-paper-light'
                }`}
              >
                <Icon
                  name={iconName}
                  size={24}
                  className={formData.icon === iconName
                    ? 'text-paper-white'
                    : 'text-ink-mid'
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">색상</label>
          <div className="flex flex-wrap gap-3">
            {AVAILABLE_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setFormData((prev) => ({ ...prev, color }))}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  formData.color === color
                    ? 'ring-2 ring-offset-2 ring-ink-black dark:ring-paper-white dark:ring-offset-ink-black'
                    : ''
                }`}
                style={{ backgroundColor: color }}
              >
                {formData.color === color && <Check size={18} className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="text-sub text-ink-mid block mb-2">미리보기</label>
          <div className="flex items-center gap-3 p-4 bg-paper-light rounded-md">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: formData.color + '20' }}
            >
              <Icon name={formData.icon} size={20} style={{ color: formData.color }} />
            </div>
            <p className="text-body text-ink-black">
              {formData.name || '결제수단 이름'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
