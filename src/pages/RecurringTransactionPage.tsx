import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Repeat, Wallet, TrendingDown } from 'lucide-react';
import { Icon, SwipeToDelete } from '@/components/common';
import {
  getRecurringTransactions,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from '@/services/queries';
import { db } from '@/services/database';
import type { RecurringTransaction, Category, RecurrenceFrequency } from '@/types';

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: '매일',
  weekly: '매주',
  biweekly: '2주마다',
  monthly: '매월',
  yearly: '매년',
};

export function RecurringTransactionPage() {
  const navigate = useNavigate();
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [recurring, cats] = await Promise.all([
        getRecurringTransactions(),
        db.categories.toArray(),
      ]);
      setRecurringList(recurring);
      setCategories(cats);
    } finally {
      setIsLoading(false);
    }
  };

  const goToAdd = () => {
    navigate('/settings/recurring/new');
  };

  const goToEdit = (item: RecurringTransaction) => {
    navigate(`/settings/recurring/${item.id}/edit`);
  };

  const handleDelete = async (id: string, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm('이 반복 거래를 삭제하시겠습니까?')) return;
    await deleteRecurringTransaction(id);
    await loadData();
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateRecurringTransaction(id, { isActive: !isActive });
    await loadData();
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  const incomeList = recurringList.filter((r) => r.type === 'income');
  const expenseList = recurringList.filter((r) => r.type === 'expense');

  const totalMonthlyIncome = incomeList
    .filter((r) => r.isActive && r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalMonthlyExpense = expenseList
    .filter((r) => r.isActive && r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="min-h-screen bg-paper-white dark:bg-ink-black pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid dark:border-ink-dark">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-ink-black dark:text-paper-white" />
        </button>
        <h1 className="text-title text-ink-black dark:text-paper-white">반복 거래</h1>
        <button
          onClick={goToAdd}
          className="w-10 h-10 flex items-center justify-center text-ink-black dark:text-paper-white"
        >
          <Plus size={24} />
        </button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-body text-ink-mid">로딩 중...</p>
        </div>
      ) : (
        <div className="px-4 py-4">
          {/* Summary */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={16} className="text-green-600 dark:text-green-400" />
                <span className="text-caption text-green-700 dark:text-green-400">예상 수입</span>
              </div>
              <p className="text-body font-medium text-green-700 dark:text-green-400">
                +{totalMonthlyIncome.toLocaleString()}원
              </p>
            </div>
            <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={16} className="text-red-600 dark:text-red-400" />
                <span className="text-caption text-red-700 dark:text-red-400">고정 지출</span>
              </div>
              <p className="text-body font-medium text-red-700 dark:text-red-400">
                {totalMonthlyExpense.toLocaleString()}원
              </p>
            </div>
          </div>

          {/* Income Section */}
          {incomeList.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sub text-ink-light mb-2">수입</h2>
              <div className="space-y-2">
                {incomeList.map((item) => {
                  const cat = getCategoryInfo(item.categoryId);
                  return (
                    <SwipeToDelete
                      key={item.id}
                      onDelete={() => handleDelete(item.id, true)}
                      confirmMessage={`"${item.description}" 반복 거래를 삭제하시겠습니까?`}
                    >
                      <div
                        className={`flex items-center gap-3 p-3 bg-paper-light dark:bg-ink-dark/30 rounded-lg ${
                          !item.isActive ? 'opacity-50' : ''
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: (cat?.color || '#4A7C59') + '20' }}
                        >
                          <Icon name={cat?.icon || 'Wallet'} size={20} style={{ color: cat?.color }} />
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => goToEdit(item)}>
                          <p className="text-body text-ink-black dark:text-paper-white truncate">{item.description}</p>
                          <div className="flex items-center gap-2 text-caption text-ink-light">
                            <Repeat size={12} />
                            <span>{FREQUENCY_LABELS[item.frequency]}</span>
                            {item.frequency === 'monthly' && item.dayOfMonth && (
                              <span>• {item.dayOfMonth}일</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-body font-medium text-green-600 dark:text-green-400">
                            +{item.amount.toLocaleString()}원
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleActive(item.id, item.isActive)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            item.isActive
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-paper-mid dark:bg-ink-dark/50'
                          }`}
                        >
                          <Check
                            size={16}
                            className={item.isActive ? 'text-green-600 dark:text-green-400' : 'text-ink-light'}
                          />
                        </button>
                      </div>
                    </SwipeToDelete>
                  );
                })}
              </div>
            </section>
          )}

          {/* Expense Section */}
          {expenseList.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sub text-ink-light mb-2">지출</h2>
              <div className="space-y-2">
                {expenseList.map((item) => {
                  const cat = getCategoryInfo(item.categoryId);
                  return (
                    <SwipeToDelete
                      key={item.id}
                      onDelete={() => handleDelete(item.id, true)}
                      confirmMessage={`"${item.description}" 반복 거래를 삭제하시겠습니까?`}
                    >
                      <div
                        className={`flex items-center gap-3 p-3 bg-paper-light dark:bg-ink-dark/30 rounded-lg ${
                          !item.isActive ? 'opacity-50' : ''
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: (cat?.color || '#FF6B6B') + '20' }}
                        >
                          <Icon name={cat?.icon || 'CreditCard'} size={20} style={{ color: cat?.color }} />
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => goToEdit(item)}>
                          <p className="text-body text-ink-black dark:text-paper-white truncate">{item.description}</p>
                          <div className="flex items-center gap-2 text-caption text-ink-light">
                            <Repeat size={12} />
                            <span>{FREQUENCY_LABELS[item.frequency]}</span>
                            {item.frequency === 'monthly' && item.dayOfMonth && (
                              <span>• {item.dayOfMonth}일</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-body font-medium text-ink-black dark:text-paper-white">
                            {item.amount.toLocaleString()}원
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleActive(item.id, item.isActive)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            item.isActive
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-paper-mid dark:bg-ink-dark/50'
                          }`}
                        >
                          <Check
                            size={16}
                            className={item.isActive ? 'text-green-600 dark:text-green-400' : 'text-ink-light'}
                          />
                        </button>
                      </div>
                    </SwipeToDelete>
                  );
                })}
              </div>
            </section>
          )}

          {/* Empty State */}
          {recurringList.length === 0 && (
            <div className="text-center py-20">
              <Repeat size={48} className="text-ink-light mx-auto mb-4" />
              <p className="text-body text-ink-mid mb-2">등록된 반복 거래가 없습니다</p>
              <p className="text-caption text-ink-light mb-6">
                월급, 구독료 등 정기적인 거래를 등록해보세요
              </p>
              <button
                onClick={goToAdd}
                className="px-6 py-3 bg-ink-black dark:bg-pig-pink text-paper-white rounded-lg text-body"
              >
                반복 거래 추가
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
