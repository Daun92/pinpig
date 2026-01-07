import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, GripVertical } from 'lucide-react';
import { usePaymentMethodStore, selectPaymentMethods } from '@/stores/paymentMethodStore';
import { Icon, SwipeToDelete } from '@/components/common';
import type { PaymentMethod } from '@/types';

export function PaymentMethodManagePage() {
  const navigate = useNavigate();
  const { fetchPaymentMethods, deletePaymentMethod, reorderPaymentMethods } = usePaymentMethodStore();
  const paymentMethods = usePaymentMethodStore(selectPaymentMethods);

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [localMethods, setLocalMethods] = useState<PaymentMethod[]>([]);
  const dragStartY = useRef<number>(0);
  const draggedElement = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  useEffect(() => {
    setLocalMethods(paymentMethods);
  }, [paymentMethods]);

  const handleDelete = async (id: string, skipConfirm = false) => {
    const method = paymentMethods.find((p) => p.id === id);
    if (method?.isDefault) {
      alert('기본 결제수단은 삭제할 수 없습니다.');
      return;
    }

    if (!skipConfirm && !window.confirm('이 결제수단을 삭제하시겠습니까?')) {
      return;
    }
    await deletePaymentMethod(id);
  };

  const goToEdit = (pm: PaymentMethod) => {
    navigate(`/settings/payment-methods/${pm.id}/edit`);
  };

  const goToAdd = () => {
    navigate('/settings/payment-methods/new');
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent, pm: PaymentMethod) => {
    const target = e.currentTarget as HTMLDivElement;
    const touch = e.touches[0];

    // Only start drag if touching the grip handle area (first 44px)
    const rect = target.getBoundingClientRect();
    if (touch.clientX - rect.left > 44) return;

    setDraggedId(pm.id);
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
        await reorderPaymentMethods(newMethods);
      }
    }

    setDraggedId(null);
    setDragOverId(null);
    draggedElement.current = null;
  };

  // Mouse drag handlers
  const handleDragStart = (e: React.DragEvent, pm: PaymentMethod) => {
    setDraggedId(pm.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pm.id);
    (e.currentTarget as HTMLDivElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLDivElement).style.opacity = '1';
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, pm: PaymentMethod) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && pm.id !== draggedId) {
      setDragOverId(pm.id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetPm: PaymentMethod) => {
    e.preventDefault();

    if (!draggedId || draggedId === targetPm.id) {
      setDragOverId(null);
      return;
    }

    const fromIndex = localMethods.findIndex(m => m.id === draggedId);
    const toIndex = localMethods.findIndex(m => m.id === targetPm.id);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newMethods = [...localMethods];
      const [removed] = newMethods.splice(fromIndex, 1);
      newMethods.splice(toIndex, 0, removed);
      setLocalMethods(newMethods);
      await reorderPaymentMethods(newMethods);
    }

    setDragOverId(null);
  };

  return (
    <div className="min-h-screen bg-paper-white dark:bg-ink-black pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid dark:border-ink-dark">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-ink-black dark:text-paper-white" />
        </button>
        <h1 className="text-title text-ink-black dark:text-paper-white">결제수단 관리</h1>
        <button onClick={goToAdd} className="w-10 h-10 flex items-center justify-center">
          <Plus size={24} className="text-ink-black dark:text-paper-white" />
        </button>
      </header>

      {/* Drag instruction */}
      {localMethods.length > 1 && (
        <div className="px-6 py-2 bg-paper-light dark:bg-ink-dark">
          <p className="text-caption text-ink-mid text-center">
            ≡ 아이콘을 드래그하여 순서를 변경할 수 있습니다
          </p>
        </div>
      )}

      {/* Payment Method List */}
      <section className="px-6 py-4">
        {localMethods.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-body text-ink-light">등록된 결제수단이 없습니다</p>
            <button
              onClick={goToAdd}
              className="mt-4 px-4 py-2 bg-ink-black dark:bg-paper-white text-paper-white dark:text-ink-black rounded-md text-body"
            >
              결제수단 추가
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {localMethods.map((pm) => (
              <SwipeToDelete
                key={pm.id}
                onDelete={() => handleDelete(pm.id, true)}
                confirmMessage={`"${pm.name}" 결제수단을 삭제하시겠습니까?`}
                disabled={pm.isDefault}
              >
                <div
                  data-method-id={pm.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, pm)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, pm)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, pm)}
                  onTouchStart={(e) => handleTouchStart(e, pm)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`flex items-center gap-3 p-4 bg-paper-light dark:bg-ink-dark rounded-md transition-all cursor-grab active:cursor-grabbing ${
                    draggedId === pm.id ? 'opacity-50 scale-[1.02]' : ''
                  } ${
                    dragOverId === pm.id ? 'ring-2 ring-ink-black dark:ring-paper-white' : ''
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
                    style={{ backgroundColor: pm.color + '20' }}
                  >
                    <Icon name={pm.icon} size={20} style={{ color: pm.color }} />
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => goToEdit(pm)}>
                    <p className="text-body text-ink-black dark:text-paper-white truncate">{pm.name}</p>
                    {pm.isDefault && (
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
        <div className="p-4 bg-paper-light dark:bg-ink-dark rounded-md">
          <p className="text-caption text-ink-mid">
            카드별로 결제수단을 추가하면 각 카드의 사용 내역을 따로 확인할 수 있습니다.
            순서를 변경하면 거래 입력 시 표시되는 순서가 바뀝니다.
          </p>
        </div>
      </section>
    </div>
  );
}
