import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Calendar, FileText } from 'lucide-react';
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
import {
  useIncomeSourceStore,
  selectIncomeSources,
} from '@/stores/incomeSourceStore';
import { useFabStore } from '@/stores/fabStore';
import { Icon, DateTimePicker } from '@/components/common';
import { db } from '@/services/database';
import type { Transaction, TransactionType } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';

export function EditTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const fetchTransactions = useTransactionStore((state) => state.fetchTransactions);
  const { fetchCategories } = useCategoryStore();
  const { fetchPaymentMethods } = usePaymentMethodStore();
  const { setSubmitHandler, setCanSubmit } = useFabStore();

  const expenseCategories = useCategoryStore(selectExpenseCategories);
  const incomeCategories = useCategoryStore(selectIncomeCategories);
  const paymentMethods = usePaymentMethodStore(selectPaymentMethods);
  const { fetchIncomeSources } = useIncomeSourceStore();
  const incomeSources = useIncomeSourceStore(selectIncomeSources);

  const [originalTransaction, setOriginalTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [selectedIncomeSourceId, setSelectedIncomeSourceId] = useState<string>('');
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;
  const isValidAmount = amount && parseInt(amount) > 0;

  // Load transaction data
  useEffect(() => {
    const loadTransaction = async () => {
      if (!id) {
        navigate('/history');
        return;
      }

      try {
        const transaction = await db.transactions.get(id);
        if (!transaction) {
          alert('거래를 찾을 수 없습니다.');
          navigate('/history');
          return;
        }

        setOriginalTransaction(transaction);
        setType(transaction.type);
        setAmount(transaction.amount.toString());
        setSelectedCategoryId(transaction.categoryId);
        setSelectedPaymentMethodId(transaction.paymentMethodId || '');
        setSelectedIncomeSourceId(transaction.incomeSourceId || '');
        setMemo(transaction.memo || '');
        setDate(new Date(transaction.date));
        setTime(transaction.time);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load transaction:', error);
        alert('거래를 불러오는데 실패했습니다.');
        navigate('/history');
      }
    };

    fetchCategories();
    fetchPaymentMethods();
    fetchIncomeSources();
    loadTransaction();
  }, [id, navigate, fetchCategories, fetchPaymentMethods, fetchIncomeSources]);

  // Handle category change when type changes
  useEffect(() => {
    if (originalTransaction && currentCategories.length > 0) {
      // If we're changing type, select the first category of the new type
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
        incomeSourceId: type === 'income' ? selectedIncomeSourceId : undefined,
        memo: memo || '',
        date,
        time,
      });

      await fetchTransactions();
      navigate('/history');
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
    selectedIncomeSourceId,
    memo,
    date,
    time,
    updateTransaction,
    fetchTransactions,
    navigate,
  ]);

  // Register submit handler for FAB
  useEffect(() => {
    setSubmitHandler(handleSubmit);
    return () => {
      setSubmitHandler(null);
      setCanSubmit(false);
    };
  }, [handleSubmit, setSubmitHandler, setCanSubmit]);

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
    return format(d, 'M월 d일', { locale: ko });
  };

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
      <header className="h-14 flex items-center justify-between px-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center text-ink-mid"
        >
          <X size={24} />
        </button>
        <h1 className="text-title text-ink-black">거래 수정</h1>
        <button
          onClick={handleSubmit}
          disabled={!isValidAmount}
          className={`text-body ${isValidAmount ? 'text-ink-black' : 'text-ink-light'}`}
        >
          저장
        </button>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-nav">
        {/* Type Toggle */}
        <div className="flex justify-center gap-2 px-6 py-4">
          <button
            onClick={() => setType('expense')}
            className={`px-4 py-2 rounded-sm text-body transition-colors ${
              type === 'expense'
                ? 'bg-ink-black text-paper-white'
                : 'bg-transparent text-ink-light'
            }`}
          >
            지출
          </button>
          <button
            onClick={() => setType('income')}
            className={`px-4 py-2 rounded-sm text-body transition-colors ${
              type === 'income'
                ? 'bg-ink-black text-paper-white'
                : 'bg-transparent text-ink-light'
            }`}
          >
            수입
          </button>
        </div>

        {/* Amount Input */}
        <div className="text-center py-6 px-6">
          <div className="flex items-center justify-center gap-2">
            <input
              ref={inputRef}
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
            <span className="text-title text-ink-mid">원</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-paper-mid mx-6" />

        {/* Category Picker */}
        <div className="py-4">
          <div className="flex gap-3 px-6 overflow-x-auto pb-2">
            {currentCategories.map((category) => {
              const isSelected = category.id === selectedCategoryId;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className="flex flex-col items-center min-w-[60px] shrink-0"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isSelected
                        ? 'bg-ink-black text-paper-white'
                        : 'bg-paper-light text-ink-mid'
                    }`}
                  >
                    <Icon name={category.icon} size={24} />
                  </div>
                  <span
                    className={`text-caption mt-2 ${
                      isSelected ? 'text-ink-black' : 'text-ink-light'
                    }`}
                  >
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Method (expense only) */}
        {type === 'expense' && paymentMethods.length > 0 && (
          <>
            <div className="h-px bg-paper-mid mx-6" />
            <div className="px-6 py-4">
              <p className="text-caption text-ink-light mb-2">결제수단</p>
              <div className="flex gap-2 flex-wrap">
                {paymentMethods.map((pm) => {
                  const isSelected = pm.id === selectedPaymentMethodId;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => setSelectedPaymentMethodId(pm.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-caption transition-colors ${
                        isSelected
                          ? 'bg-ink-black text-paper-white'
                          : 'bg-paper-light text-ink-mid'
                      }`}
                    >
                      <Icon name={pm.icon} size={14} />
                      <span>{pm.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Income Source (income only) */}
        {type === 'income' && incomeSources.length > 0 && (
          <>
            <div className="h-px bg-paper-mid mx-6" />
            <div className="px-6 py-4">
              <p className="text-caption text-ink-light mb-2">수입수단</p>
              <div className="flex gap-2 flex-wrap">
                {incomeSources.map((source) => {
                  const isSelected = source.id === selectedIncomeSourceId;
                  return (
                    <button
                      key={source.id}
                      onClick={() => setSelectedIncomeSourceId(source.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-caption transition-colors ${
                        isSelected
                          ? 'bg-ink-black text-paper-white'
                          : 'bg-paper-light text-ink-mid'
                      }`}
                    >
                      <Icon name={source.icon} size={14} />
                      <span>{source.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="h-px bg-paper-mid mx-6" />

        {/* Date & Memo Inputs */}
        <div className="px-6">
          {/* Date/Time Picker Trigger */}
          <button
            onClick={() => setShowDatePicker(true)}
            className="w-full flex items-center justify-between py-4 border-b border-paper-mid"
          >
            <div className="flex items-center gap-3 text-ink-mid">
              <Calendar size={20} />
              <div className="flex flex-col items-start">
                <span className="text-body text-ink-dark">
                  {formatDateLabel(date)}
                </span>
                <span className="text-caption text-ink-light">
                  {format(date, 'yyyy.M.d', { locale: ko })} {time}
                </span>
              </div>
            </div>
          </button>

          {/* Memo */}
          <div className="flex items-center py-4">
            <div className="flex items-center gap-3 text-ink-mid flex-1">
              <FileText size={20} />
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모 추가"
                className="text-body text-ink-dark bg-transparent outline-none flex-1"
              />
            </div>
          </div>
        </div>
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
