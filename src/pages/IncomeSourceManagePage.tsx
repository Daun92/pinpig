import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, GripVertical } from 'lucide-react';
import { useIncomeSourceStore, selectIncomeSources } from '@/stores/incomeSourceStore';
import { Icon, SwipeToDelete } from '@/components/common';
import type { IncomeSource } from '@/types';

export function IncomeSourceManagePage() {
  const navigate = useNavigate();
  const { fetchIncomeSources, deleteIncomeSource, reorderIncomeSources } = useIncomeSourceStore();
  const incomeSources = useIncomeSourceStore(selectIncomeSources);

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [localSources, setLocalSources] = useState<IncomeSource[]>([]);
  const dragStartY = useRef<number>(0);
  const draggedElement = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchIncomeSources();
  }, [fetchIncomeSources]);

  useEffect(() => {
    setLocalSources(incomeSources);
  }, [incomeSources]);

  const handleDelete = async (id: string, skipConfirm = false) => {
    const source = incomeSources.find((s) => s.id === id);
    if (source?.isDefault) {
      alert('기본 수입수단은 삭제할 수 없습니다.');
      return;
    }

    if (!skipConfirm && !window.confirm('이 수입수단을 삭제하시겠습니까?')) {
      return;
    }
    await deleteIncomeSource(id);
  };

  const goToEdit = (source: IncomeSource) => {
    navigate(`/settings/income-sources/${source.id}/edit`);
  };

  const goToAdd = () => {
    navigate('/settings/income-sources/new');
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent, source: IncomeSource) => {
    const target = e.currentTarget as HTMLDivElement;
    const touch = e.touches[0];

    // Only start drag if touching the grip handle area (first 44px)
    const rect = target.getBoundingClientRect();
    if (touch.clientX - rect.left > 44) return;

    setDraggedId(source.id);
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
      const id = (el as HTMLElement).dataset?.sourceId;
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
      const fromIndex = localSources.findIndex(s => s.id === draggedId);
      const toIndex = localSources.findIndex(s => s.id === dragOverId);

      if (fromIndex !== -1 && toIndex !== -1) {
        const newSources = [...localSources];
        const [removed] = newSources.splice(fromIndex, 1);
        newSources.splice(toIndex, 0, removed);
        setLocalSources(newSources);
        await reorderIncomeSources(newSources);
      }
    }

    setDraggedId(null);
    setDragOverId(null);
    draggedElement.current = null;
  };

  // Mouse drag handlers
  const handleDragStart = (e: React.DragEvent, source: IncomeSource) => {
    setDraggedId(source.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', source.id);
    (e.currentTarget as HTMLDivElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLDivElement).style.opacity = '1';
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, source: IncomeSource) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && source.id !== draggedId) {
      setDragOverId(source.id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetSource: IncomeSource) => {
    e.preventDefault();

    if (!draggedId || draggedId === targetSource.id) {
      setDragOverId(null);
      return;
    }

    const fromIndex = localSources.findIndex(s => s.id === draggedId);
    const toIndex = localSources.findIndex(s => s.id === targetSource.id);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newSources = [...localSources];
      const [removed] = newSources.splice(fromIndex, 1);
      newSources.splice(toIndex, 0, removed);
      setLocalSources(newSources);
      await reorderIncomeSources(newSources);
    }

    setDragOverId(null);
  };

  return (
    <div className="min-h-screen bg-paper-white pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <h1 className="text-title text-ink-black">수입수단 관리</h1>
        <button onClick={goToAdd} className="w-10 h-10 flex items-center justify-center">
          <Plus size={24} className="text-ink-black" />
        </button>
      </header>

      {/* Drag instruction */}
      {localSources.length > 1 && (
        <div className="px-6 py-2 bg-paper-light">
          <p className="text-caption text-ink-mid text-center">
            ≡ 아이콘을 드래그하여 순서를 변경할 수 있습니다
          </p>
        </div>
      )}

      {/* Income Source List */}
      <section className="px-6 py-4">
        {localSources.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-body text-ink-light">등록된 수입수단이 없습니다</p>
            <button
              onClick={goToAdd}
              className="mt-4 px-4 py-2 bg-ink-black dark:bg-pig-pink text-paper-white rounded-md text-body"
            >
              수입수단 추가
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {localSources.map((source) => (
              <SwipeToDelete
                key={source.id}
                onDelete={() => handleDelete(source.id, true)}
                confirmMessage={`"${source.name}" 수입수단을 삭제하시겠습니까?`}
                disabled={source.isDefault}
              >
                <div
                  data-source-id={source.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, source)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, source)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, source)}
                  onTouchStart={(e) => handleTouchStart(e, source)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`flex items-center gap-3 p-4 bg-paper-light rounded-md transition-all cursor-grab active:cursor-grabbing ${
                    draggedId === source.id ? 'opacity-50 scale-[1.02]' : ''
                  } ${
                    dragOverId === source.id ? 'ring-2 ring-ink-black dark:ring-paper-white' : ''
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
                    style={{ backgroundColor: source.color + '20' }}
                  >
                    <Icon name={source.icon} size={20} style={{ color: source.color }} />
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => goToEdit(source)}>
                    <p className="text-body text-ink-black truncate">{source.name}</p>
                    {source.isDefault && (
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
            수입수단을 추가하면 수입 내역을 출처별로 확인할 수 있습니다.
            순서를 변경하면 거래 입력 시 표시되는 순서가 바뀝니다.
          </p>
        </div>
      </section>
    </div>
  );
}
