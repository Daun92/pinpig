import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Calendar, Tag, CreditCard, FileText, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Icon } from '@/components/common';
import { useCategoryStore, selectCategoryMap } from '@/stores/categoryStore';
import { usePaymentMethodStore, selectPaymentMethods } from '@/stores/paymentMethodStore';
import { useTransactionStore } from '@/stores/transactionStore';
import type { Transaction } from '@/types';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
}

export function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailModalProps) {
  const navigate = useNavigate();
  const categoryMap = useCategoryStore(selectCategoryMap);
  const paymentMethods = usePaymentMethodStore(selectPaymentMethods);
  const { deleteTransaction } = useTransactionStore();
  const [isDeleting, setIsDeleting] = useState(false);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const category = categoryMap.get(transaction.categoryId);
  const paymentMethod = paymentMethods.find(pm => pm.id === transaction.paymentMethodId);

  const handleDelete = async () => {
    if (!transaction) return;

    const confirmed = window.confirm('이 거래를 삭제하시겠습니까?');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    // AddPage에 수정 모드로 이동 (쿼리 파라미터로 transaction id 전달)
    navigate(`/add?edit=${transaction.id}`);
    onClose();
  };

  const formatDate = (date: Date) => {
    return format(date, 'yyyy년 M월 d일 (EEE)', { locale: ko });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-paper-white rounded-t-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-paper-white flex items-center justify-between px-4 py-3 border-b border-paper-mid">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-ink-mid"
          >
            <X size={24} />
          </button>
          <h2 className="text-title text-ink-black">거래 상세</h2>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 -mr-2 text-red-500 disabled:opacity-50"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pt-6 pb-8">
          {/* Main Info */}
          <div className="flex flex-col items-center mb-8">
            {/* Category Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: category?.color || '#B8B8B8' }}
            >
              <Icon
                name={category?.icon || 'MoreHorizontal'}
                size={32}
                className="text-white"
              />
            </div>

            {/* Description */}
            <p className="text-lg font-medium text-ink-black mb-2">
              {transaction.description || category?.name || '거래'}
            </p>

            {/* Amount */}
            <p className={`text-hero font-light ${
              transaction.type === 'income' ? 'text-semantic-positive' : 'text-ink-black'
            }`}>
              {transaction.type === 'income' ? '+' : ''}{transaction.amount.toLocaleString()}원
            </p>
          </div>

          {/* Details */}
          <div className="space-y-0">
            {/* Category */}
            <div className="flex items-center justify-between py-4 border-b border-paper-mid">
              <div className="flex items-center gap-3 text-ink-mid">
                <Tag size={20} />
                <span className="text-body">카테고리</span>
              </div>
              <span className="text-body text-ink-black">{category?.name || '기타'}</span>
            </div>

            {/* Date */}
            <div className="flex items-center justify-between py-4 border-b border-paper-mid">
              <div className="flex items-center gap-3 text-ink-mid">
                <Calendar size={20} />
                <span className="text-body">날짜</span>
              </div>
              <span className="text-body text-ink-black">
                {formatDate(transaction.date)} {transaction.time}
              </span>
            </div>

            {/* Payment Method (지출인 경우만) */}
            {transaction.type === 'expense' && (
              <div className="flex items-center justify-between py-4 border-b border-paper-mid">
                <div className="flex items-center gap-3 text-ink-mid">
                  <CreditCard size={20} />
                  <span className="text-body">결제수단</span>
                </div>
                <span className="text-body text-ink-black">
                  {paymentMethod?.name || '-'}
                </span>
              </div>
            )}

            {/* Memo */}
            <div className="flex items-center justify-between py-4 border-b border-paper-mid">
              <div className="flex items-center gap-3 text-ink-mid">
                <FileText size={20} />
                <span className="text-body">메모</span>
              </div>
              <span className="text-body text-ink-black">
                {transaction.memo || '-'}
              </span>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={handleEdit}
            className="w-full mt-8 py-4 bg-ink-black text-white rounded-xl text-body font-medium flex items-center justify-center gap-2"
          >
            <Edit3 size={20} />
            수정하기
          </button>
        </div>
      </div>
    </div>
  );
}
