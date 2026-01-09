import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, GripVertical } from 'lucide-react';
import { usePaymentMethodStore, selectPaymentMethods } from '@/stores/paymentMethodStore';
import { useIncomeSourceStore, selectIncomeSources } from '@/stores/incomeSourceStore';
import { Icon, SwipeToDelete } from '@/components/common';
import type { PaymentMethod, IncomeSource } from '@/types';

type MethodType = 'expense' | 'income';

export function MethodManagePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MethodType>('expense');

  // Payment Methods (지출수단)
  const { fetchPaymentMethods, deletePaymentMethod, reorderPaymentMethods } = usePaymentMethodStore();
  const paymentMethods = usePaymentMethodStore(selectPaymentMethods);

  // Income Sources (수입수단)
  const { fetchIncomeSources, deleteIncomeSource, reorderIncomeSources } = useIncomeSourceStore();
  const incomeSources = useIncomeSourceStore(selectIncomeSources);

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [localMethods, setLocalMethods] = useState<(PaymentMethod | IncomeSource)[]>([]);
  const dragStartY = useRef<number>(0);
  const draggedElement = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
    fetchIncomeSources();
  }, [fetchPaymentMethods, fetchIncomeSources]);

  const displayMethods = activeTab === 'expense' ? paymentMethods : incomeSources;

  useEffect(() => {
    setLocalMethods(displayMethods);
  }, [displayMethods]);

  const handleDelete = async (id: string, skipConfirm = false) => {
    const method = displayMethods.find((m) => m.id === id);
    if (method?.isDefault) {
      alert(activeTab === 'expense' ? '기본 결제수단은 삭제할 수 없습니다.' : '기본 수입수단은 삭제할 수 없습니다.');
      return;
    }

    const typeName = activeTab === 'expense' ? '결제수단' : '수입수단';
    if (!skipConfirm && !window.confirm(`이 ${typeName}을 삭제하시겠습니까?`)) {
      return;
    }

    if (activeTab === 'expense') {
      await deletePaymentMethod(id);
    } else {
      await deleteIncomeSource(id);
    }
  };

  const goToEdit = (method: PaymentMethod | IncomeSource) => {
    if (activeTab === 'expense') {
      navigate(`/settings/payment-methods/${method.id}/edit`);
    } else {
      navigate(`/settings/income-sources/${method.id}/edit`);
    }
  };

  const goToAdd = () => {
    if (activeTab === 'expense') {
      navigate('/settings/payment-methods/new');
    } else {
      navigate('/settings/income-sources/new');
    }
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent, method: PaymentMethod | IncomeSource) => {
    const target = e.currentTarget as HTMLDivElement;
    const touch = e.touches[0];

    // Only start drag if touching the grip handle area (first 44px)
    const rect = target.getBoundingClientRect();
    if (touch.clientX - rect.left > 44) return;

    setDraggedId(method.id);
    dragStartY.current = touch.clientY;
    draggedElement.current = target;
    target.style.opacity = '0.7';
    target.style.transform = 'scale(1.02)';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedId) return;

    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);

    for (const el of elements) {
      const id = (el as HTMLElement).dataset?.methodId;
      if (id && id !== draggedId) {
        setDragOverId(id);
        break;
      }
    }
  };

  const handleTouchEnd = async () => {
    if (draggedElement.current) {
      draggedElement.current.style.opacity = '1';
      draggedElement.current.style.transform = '';
    }

    if (draggedId && dragOverId && draggedId !== dragOverId) {
      const fromIndex = localMethods.findIndex(m => m.id === draggedId);
      const toIndex = localMethods.findIndex(m => m.id === dragOverId);

      if (fromIndex !== -1 && toIndex !== -1) {
        const newMethods = [...localMethods];
        const [removed] = newMethods.splice(fromIndex, 1);
        newMethods.splice(toIndex, 0, removed);
        setLocalMethods(newMethods);

        if (activeTab === 'expense') {
          await reorderPaymentMethods(newMethods as PaymentMethod[]);
        } else {
          await reorderIncomeSources(newMethods as IncomeSource[]);
        }
      }
    }

    setDraggedId(null);
    setDragOverId(null);
    draggedElement.current = null;
  };

  // Mouse drag handlers
  const handleDragStart = (e: React.DragEvent, method: PaymentMethod | IncomeSource) => {
    setDraggedId(method.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', method.id);
    (e.currentTarget as HTMLDivElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLDivElement).style.opacity = '1';
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, method: PaymentMethod | IncomeSource) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && method.id !== draggedId) {
      setDragOverId(method.id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetMethod: PaymentMethod | IncomeSource) => {
    e.preventDefault();

    if (!draggedId || draggedId === targetMethod.id) {
      setDragOverId(null);
      return;
    }

    const fromIndex = localMethods.findIndex(m => m.id === draggedId);
    const toIndex = localMethods.findIndex(m => m.id === targetMethod.id);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newMethods = [...localMethods];
      const [removed] = newMethods.splice(fromIndex, 1);
      newMethods.splice(toIndex, 0, removed);
      setLocalMethods(newMethods);

      if (activeTab === 'expense') {
        await reorderPaymentMethods(newMethods as PaymentMethod[]);
      } else {
        await reorderIncomeSources(newMethods as IncomeSource[]);
      }
    }

    setDragOverId(null);
  };

  const typeName = activeTab === 'expense' ? '결제수단' : '수입수단';

  return (
    <div className="min-h-screen bg-paper-white pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <h1 className="text-title text-ink-black">수단 관리</h1>
        <button onClick={goToAdd} className="w-10 h-10 flex items-center justify-center">
          <Plus size={24} className="text-ink-black" />
        </button>
      </header>

      {/* Tab Bar */}
      <div className="flex border-b border-paper-mid">
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-3 text-center text-body transition-colors ${
            activeTab === 'expense'
              ? 'text-ink-black border-b-2 border-ink-black dark:border-paper-white'
              : 'text-ink-mid'
          }`}
        >
          지출
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-3 text-center text-body transition-colors ${
            activeTab === 'income'
              ? 'text-ink-black border-b-2 border-ink-black dark:border-paper-white'
              : 'text-ink-mid'
          }`}
        >
          수입
        </button>
      </div>

      {/* Drag instruction */}
      {localMethods.length > 1 && (
        <div className="px-6 py-2 bg-paper-light">
          <p className="text-caption text-ink-mid text-center">
            ≡ 아이콘을 드래그하여 순서를 변경할 수 있습니다
          </p>
        </div>
      )}

      {/* Method List */}
      <section className="px-6 py-4">
        {localMethods.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-body text-ink-light">등록된 {typeName}이 없습니다</p>
            <button
              onClick={goToAdd}
              className="mt-4 px-4 py-2 bg-ink-black dark:bg-pig-pink text-paper-white rounded-md text-body"
            >
              {typeName} 추가
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {localMethods.map((method) => (
              <SwipeToDelete
                key={method.id}
                onDelete={() => handleDelete(method.id, true)}
                confirmMessage={`"${method.name}" ${typeName}을 삭제하시겠습니까?`}
                disabled={method.isDefault}
              >
                <div
                  data-method-id={method.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, method)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, method)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, method)}
                  onTouchStart={(e) => handleTouchStart(e, method)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`flex items-center gap-3 p-4 bg-paper-light rounded-md transition-all cursor-grab active:cursor-grabbing ${
                    draggedId === method.id ? 'opacity-50 scale-[1.02]' : ''
                  } ${
                    dragOverId === method.id ? 'ring-2 ring-ink-black dark:ring-paper-white' : ''
                  }`}
                >
                  <div
                    data-grip
                    className="touch-none cursor-grab active:cursor-grabbing p-1"
                  >
                    <GripVertical size={20} className="text-ink-light" />
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: method.color + '20' }}
                  >
                    <Icon name={method.icon} size={20} style={{ color: method.color }} />
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => goToEdit(method)}>
                    <p className="text-body text-ink-black truncate">{method.name}</p>
                    {'budget' in method && method.budget && method.budget > 0 && (
                      <p className="text-caption text-ink-mid">
                        예산: {method.budget.toLocaleString()}원
                      </p>
                    )}
                    {method.isDefault && (
                      <p className="text-caption text-ink-light">기본</p>
                    )}
                  </div>
                </div>
              </SwipeToDelete>
            ))}
          </div>
        )}
      </section>

      {/* Info */}
      <section className="px-6 py-4">
        <div className="p-4 bg-paper-light rounded-md">
          <p className="text-caption text-ink-mid">
            {activeTab === 'expense'
              ? '카드별로 결제수단을 추가하면 각 카드의 사용 내역을 따로 확인할 수 있습니다.'
              : '수입수단을 추가하면 수입 내역을 출처별로 확인할 수 있습니다.'}
            {' '}순서를 변경하면 거래 입력 시 표시되는 순서가 바뀝니다.
          </p>
        </div>
      </section>
    </div>
  );
}
