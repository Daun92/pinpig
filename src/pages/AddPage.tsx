import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, FileText, ChevronRight, Delete } from 'lucide-react';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore, selectExpenseCategories, selectIncomeCategories } from '@/stores/categoryStore';
import { Icon } from '@/components/common';
import type { TransactionType } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

function getDefaultCategoryByTime(hour: number): string {
  if (hour >= 7 && hour < 10) return 'transport';
  if (hour >= 11 && hour < 14) return 'food';
  if (hour >= 14 && hour < 17) return 'cafe';
  if (hour >= 18 && hour < 21) return 'food';
  return 'etc';
}

export function AddPage() {
  const navigate = useNavigate();
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const { fetchCategories } = useCategoryStore();
  const expenseCategories = useCategoryStore(selectExpenseCategories);
  const incomeCategories = useCategoryStore(selectIncomeCategories);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [memo, setMemo] = useState('');
  const [date] = useState(new Date());
  const [time] = useState(format(new Date(), 'HH:mm'));

  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
    }
  }, [type]);

  const handleSubmit = async () => {
    if (!amount || parseInt(amount) === 0 || !selectedCategoryId) return;

    await addTransaction({
      type,
      amount: parseInt(amount),
      categoryId: selectedCategoryId,
      description: '',
      memo: memo || undefined,
      date,
      time,
    });

    navigate('/');
  };

  const handleNumberClick = (num: string) => {
    if (num === 'back') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (num === '00') {
      if (amount.length > 0) {
        setAmount((prev) => prev + '00');
      }
    } else {
      if (amount.length < 10) {
        setAmount((prev) => prev + num);
      }
    }
  };

  const formattedDate = format(date, 'M월 d일', { locale: ko });
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex flex-col h-screen bg-paper-white safe-top">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center text-ink-mid"
        >
          <X size={24} />
        </button>
        <button
          onClick={handleSubmit}
          disabled={!amount || parseInt(amount) === 0}
          className={`text-body ${
            amount && parseInt(amount) > 0 ? 'text-ink-black' : 'text-ink-light'
          }`}
        >
          저장
        </button>
      </header>

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

      {/* Amount Display */}
      <div className="text-center py-6">
        <span className={`text-hero ${amount ? 'text-ink-black' : 'text-ink-light'}`}>
          {amount ? parseInt(amount).toLocaleString() : '0'}
        </span>
        <span className="text-title text-ink-mid ml-1">원</span>
      </div>

      {/* Divider */}
      <div className="h-px bg-paper-mid mx-6" />

      {/* Category Picker */}
      <div className="py-4 overflow-x-auto">
        <div className="flex gap-3 px-6">
          {currentCategories.map((category) => {
            const isSelected = category.id === selectedCategoryId;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className="flex flex-col items-center min-w-[60px]"
              >
                <div className={`p-2 rounded-full ${isSelected ? 'text-ink-black' : 'text-ink-light'}`}>
                  <Icon name={category.icon} size={24} />
                </div>
                <span className={`text-caption mt-1 ${isSelected ? 'text-ink-black' : 'text-ink-light'}`}>
                  {category.name}
                </span>
                {isSelected && (
                  <div className="w-1 h-1 rounded-full bg-ink-black mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-paper-mid mx-6" />

      {/* Date & Memo Inputs */}
      <div className="px-6">
        <button className="w-full flex items-center justify-between py-4 border-b border-paper-mid">
          <div className="flex items-center gap-3 text-ink-mid">
            <Calendar size={20} />
            <span className="text-body text-ink-dark">
              {isToday ? '오늘' : ''} ({formattedDate})
            </span>
          </div>
          <ChevronRight size={20} className="text-ink-light" />
        </button>

        <button className="w-full flex items-center justify-between py-4">
          <div className="flex items-center gap-3 text-ink-mid">
            <FileText size={20} />
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모 추가"
              className="text-body text-ink-dark bg-transparent outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ChevronRight size={20} className="text-ink-light" />
        </button>
      </div>

      {/* Number Pad */}
      <div className="mt-auto bg-paper-light p-2 safe-bottom">
        <div className="grid grid-cols-3 gap-px">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="h-14 bg-paper-white flex items-center justify-center text-amount text-ink-black active:bg-paper-mid transition-colors"
            >
              {num === 'back' ? <Delete size={24} /> : num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
