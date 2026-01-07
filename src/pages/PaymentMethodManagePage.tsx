import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { usePaymentMethodStore, selectPaymentMethods } from '@/stores/paymentMethodStore';
import { Icon } from '@/components/common';
import type { PaymentMethod } from '@/types';

const AVAILABLE_ICONS = [
  'Banknote', 'CreditCard', 'Building', 'Wallet', 'Smartphone', 'QrCode',
];

const AVAILABLE_COLORS = [
  '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#F44336', '#607D8B',
  '#00BCD4', '#795548', '#E91E63', '#3F51B5',
];

export function PaymentMethodManagePage() {
  const navigate = useNavigate();
  const { fetchPaymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } =
    usePaymentMethodStore();
  const paymentMethods = usePaymentMethodStore(selectPaymentMethods);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'CreditCard',
    color: '#2196F3',
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const resetForm = () => {
    setFormData({ name: '', icon: 'CreditCard', color: '#2196F3' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;

    await addPaymentMethod({
      name: formData.name.trim(),
      icon: formData.icon,
      color: formData.color,
      order: paymentMethods.length,
    });
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.name.trim()) return;

    await updatePaymentMethod(editingId, {
      name: formData.name.trim(),
      icon: formData.icon,
      color: formData.color,
    });
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const method = paymentMethods.find((p) => p.id === id);
    if (method?.isDefault) {
      alert('기본 결제수단은 삭제할 수 없습니다.');
      return;
    }

    if (window.confirm('이 결제수단을 삭제하시겠습니까?')) {
      await deletePaymentMethod(id);
    }
  };

  const startEditing = (pm: PaymentMethod) => {
    setEditingId(pm.id);
    setFormData({
      name: pm.name,
      icon: pm.icon,
      color: pm.color,
    });
    setIsAdding(false);
  };

  const startAdding = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({ name: '', icon: 'CreditCard', color: '#2196F3' });
  };

  return (
    <div className="min-h-screen bg-paper-white pb-20">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <h1 className="text-title text-ink-black">결제수단 관리</h1>
        <button onClick={startAdding} className="w-10 h-10 flex items-center justify-center">
          <Plus size={24} className="text-ink-black" />
        </button>
      </header>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <section className="px-6 py-4 bg-paper-light border-b border-paper-mid">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="결제수단 이름 (예: 신한카드)"
            className="w-full px-4 py-3 bg-paper-white rounded-md text-body text-ink-black outline-none border border-paper-mid focus:border-ink-mid"
            autoFocus
          />

          {/* Icon Selection */}
          <div className="mt-4">
            <p className="text-caption text-ink-mid mb-2">아이콘</p>
            <div className="flex gap-2 flex-wrap">
              {AVAILABLE_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  onClick={() => setFormData((prev) => ({ ...prev, icon: iconName }))}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    formData.icon === iconName
                      ? 'bg-ink-black text-paper-white'
                      : 'bg-paper-white text-ink-mid border border-paper-mid'
                  }`}
                >
                  <Icon name={iconName} size={20} />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="mt-4">
            <p className="text-caption text-ink-mid mb-2">색상</p>
            <div className="flex gap-2 flex-wrap">
              {AVAILABLE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full ${
                    formData.color === color ? 'ring-2 ring-ink-black ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={resetForm}
              className="flex-1 py-3 bg-paper-white rounded-md text-body text-ink-mid border border-paper-mid"
            >
              취소
            </button>
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={!formData.name.trim()}
              className={`flex-1 py-3 rounded-md text-body ${
                formData.name.trim()
                  ? 'bg-ink-black text-paper-white'
                  : 'bg-paper-mid text-ink-light'
              }`}
            >
              {editingId ? '수정' : '추가'}
            </button>
          </div>
        </section>
      )}

      {/* Payment Method List */}
      <section className="px-6 py-4">
        {paymentMethods.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-body text-ink-light">등록된 결제수단이 없습니다</p>
            <button
              onClick={startAdding}
              className="mt-4 px-4 py-2 bg-ink-black text-paper-white rounded-md text-body"
            >
              결제수단 추가
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center gap-3 p-4 bg-paper-light rounded-md"
              >
                <GripVertical size={20} className="text-ink-light" />
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: pm.color + '20' }}
                >
                  <Icon name={pm.icon} size={20} style={{ color: pm.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-body text-ink-black">{pm.name}</p>
                  {pm.isDefault && (
                    <p className="text-caption text-ink-light">기본</p>
                  )}
                </div>
                <button
                  onClick={() => startEditing(pm)}
                  className="px-3 py-1 text-caption text-ink-mid"
                >
                  수정
                </button>
                {!pm.isDefault && (
                  <button
                    onClick={() => handleDelete(pm.id)}
                    className="w-8 h-8 flex items-center justify-center text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Info */}
      <section className="px-6 py-4">
        <div className="p-4 bg-paper-light rounded-md">
          <p className="text-caption text-ink-mid">
            카드별로 결제수단을 추가하면 각 카드의 사용 내역을 따로 확인할 수 있습니다.
          </p>
        </div>
      </section>
    </div>
  );
}
