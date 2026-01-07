import { X, Edit3, Trash2, Calendar, Store, FileText, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/common';
import { useCategoryStore, selectCategoryMap } from '@/stores/categoryStore';
import { usePaymentMethodStore, selectPaymentMethods } from '@/stores/paymentMethodStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { format, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Transaction } from '@/types';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailModalProps) {
  const navigate = useNavigate();
  const categoryMap = useCategoryStore(selectCategoryMap);
  const paymentMethods = usePaymentMethodStore(selectPaymentMethods);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const fetchTransactions = useTransactionStore((state) => state.fetchTransactions);

  if (!isOpen || !transaction) return null;

  const category = categoryMap.get(transaction.categoryId);
  const paymentMethod = paymentMethods.find(
    (pm) => pm.id === transaction.paymentMethodId
  );

  const formatDateLabel = (d: Date) => {
    if (isToday(d)) return '오늘';
    if (isYesterday(d)) return '어제';
    return format(d, 'M월 d일 (E)', { locale: ko });
  };

  const handleEdit = () => {
    onClose();
    navigate(`/transaction/${transaction.id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('이 거래를 삭제하시겠습니까?')) return;

    try {
      await deleteTransaction(transaction.id);
      await fetchTransactions();
      onClose();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('거래 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-paper-white w-full max-w-lg rounded-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-paper-mid">
          <h2 className="text-title text-ink-black">거래 상세</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center"
          >
            <X size={20} className="text-ink-mid" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Amount */}
          <div className="text-center mb-6">
            <p
              className={`text-hero ${
                transaction.type === 'income'
                  ? 'text-semantic-positive'
                  : 'text-ink-black'
              }`}
            >
              {transaction.type === 'income' ? '+ ' : ''}
              {transaction.amount.toLocaleString()}원
            </p>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-caption ${
                transaction.type === 'income'
                  ? 'bg-semantic-positive/10 text-semantic-positive'
                  : 'bg-paper-light text-ink-mid'
              }`}
            >
              {transaction.type === 'income' ? '수입' : '지출'}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Category */}
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: category?.color + '20' }}
              >
                <Icon
                  name={category?.icon || 'MoreHorizontal'}
                  size={20}
                  style={{ color: category?.color }}
                />
              </div>
              <div>
                <p className="text-caption text-ink-light">카테고리</p>
                <p className="text-body text-ink-black">
                  {category?.name || '기타'}
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-paper-light flex items-center justify-center">
                <Calendar size={20} className="text-ink-mid" />
              </div>
              <div>
                <p className="text-caption text-ink-light">일시</p>
                <p className="text-body text-ink-black">
                  {formatDateLabel(transaction.date)} {transaction.time}
                </p>
              </div>
            </div>

            {/* Payment Method (expense only) */}
            {transaction.type === 'expense' && paymentMethod && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-paper-light flex items-center justify-center">
                  <CreditCard size={20} className="text-ink-mid" />
                </div>
                <div>
                  <p className="text-caption text-ink-light">결제수단</p>
                  <p className="text-body text-ink-black">{paymentMethod.name}</p>
                </div>
              </div>
            )}

            {/* Description (Merchant) */}
            {transaction.description && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-paper-light flex items-center justify-center">
                  <Store size={20} className="text-ink-mid" />
                </div>
                <div>
                  <p className="text-caption text-ink-light">가맹점</p>
                  <p className="text-body text-ink-black">
                    {transaction.description}
                  </p>
                </div>
              </div>
            )}

            {/* Memo */}
            {transaction.memo && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-paper-light flex items-center justify-center">
                  <FileText size={20} className="text-ink-mid" />
                </div>
                <div>
                  <p className="text-caption text-ink-light">메모</p>
                  <p className="text-body text-ink-black">{transaction.memo}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 border-t border-paper-mid pt-4">
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-semantic-negative/10 text-semantic-negative rounded-lg"
            >
              <Trash2 size={18} />
              삭제
            </button>
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-ink-black text-paper-white rounded-lg"
            >
              <Edit3 size={18} />
              수정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
