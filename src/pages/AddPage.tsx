import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '@/stores/transactionStore';
import type { TransactionType } from '@/types';

export function AddPage() {
  const navigate = useNavigate();
  const addTransaction = useTransactionStore((state) => state.addTransaction);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const handleSubmit = async () => {
    if (!amount || parseInt(amount) === 0) return;

    await addTransaction({
      type,
      amount: parseInt(amount),
      categoryId: 'default',
      memo: memo || undefined,
      date: new Date(),
    });

    navigate('/');
  };

  const handleNumberClick = (num: string) => {
    if (num === 'clear') {
      setAmount('');
    } else if (num === 'back') {
      setAmount((prev) => prev.slice(0, -1));
    } else {
      setAmount((prev) => prev + num);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-paper-white">
      {/* Type Toggle */}
      <div className="flex gap-xs p-sm">
        <button
          onClick={() => setType('expense')}
          className={`flex-1 py-sm rounded-sm text-body ${
            type === 'expense'
              ? 'bg-ink-black text-paper-white'
              : 'bg-paper-light text-ink-mid'
          }`}
        >
          지출
        </button>
        <button
          onClick={() => setType('income')}
          className={`flex-1 py-sm rounded-sm text-body ${
            type === 'income'
              ? 'bg-ink-black text-paper-white'
              : 'bg-paper-light text-ink-mid'
          }`}
        >
          수입
        </button>
      </div>

      {/* Amount Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-md">
        <p className="text-hero text-ink-black">
          {amount ? parseInt(amount).toLocaleString() : '0'}
          <span className="text-title text-ink-mid ml-xs">원</span>
        </p>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모 (선택)"
          className="mt-md text-body text-center bg-transparent border-b border-paper-mid py-xs w-48 focus:outline-none focus:border-ink-mid"
        />
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-px bg-paper-mid p-px">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            className="bg-paper-white py-md text-amount text-ink-black active:bg-paper-light"
          >
            {num === 'clear' ? 'C' : num === 'back' ? '←' : num}
          </button>
        ))}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!amount || parseInt(amount) === 0}
        className="m-sm py-sm bg-ink-black text-paper-white rounded-sm text-body disabled:bg-paper-mid disabled:text-ink-light safe-bottom"
      >
        저장
      </button>
    </div>
  );
}
