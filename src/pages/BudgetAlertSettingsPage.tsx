import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, Plus, X } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

// 선택 가능한 기본 임계값 옵션
const PRESET_THRESHOLDS = [50, 60, 70, 80, 90, 100];

export function BudgetAlertSettingsPage() {
  const navigate = useNavigate();

  // Store
  const { fetchSettings, settings, updateSettings } = useSettingsStore();

  // Local state
  const [enabled, setEnabled] = useState(true);
  const [thresholds, setThresholds] = useState<number[]>([50, 80, 100]);
  const [customValue, setCustomValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.budgetAlertEnabled ?? true);
      setThresholds(settings.budgetAlertThresholds ?? [50, 80, 100]);
    }
  }, [settings]);

  // 마스터 토글 변경
  const handleToggle = async () => {
    const newValue = !enabled;
    setEnabled(newValue);
    await updateSettings({ budgetAlertEnabled: newValue });
  };

  // 임계값 토글
  const handleThresholdToggle = async (threshold: number) => {
    let newThresholds: number[];

    if (thresholds.includes(threshold)) {
      // 제거 (최소 1개는 유지)
      if (thresholds.length > 1) {
        newThresholds = thresholds.filter((t) => t !== threshold);
      } else {
        return;
      }
    } else {
      // 추가
      newThresholds = [...thresholds, threshold].sort((a, b) => a - b);
    }

    setThresholds(newThresholds);
    await updateSettings({ budgetAlertThresholds: newThresholds });
  };

  // 사용자 지정 임계값 추가
  const handleAddCustom = async () => {
    const value = parseInt(customValue);
    if (isNaN(value) || value < 1 || value > 200) {
      return;
    }

    if (thresholds.includes(value)) {
      setCustomValue('');
      setShowCustomInput(false);
      return;
    }

    const newThresholds = [...thresholds, value].sort((a, b) => a - b);
    setThresholds(newThresholds);
    await updateSettings({ budgetAlertThresholds: newThresholds });
    setCustomValue('');
    setShowCustomInput(false);
  };

  // 임계값 삭제 (사용자 지정 항목)
  const handleRemoveThreshold = async (threshold: number) => {
    if (thresholds.length <= 1) return;

    const newThresholds = thresholds.filter((t) => t !== threshold);
    setThresholds(newThresholds);
    await updateSettings({ budgetAlertThresholds: newThresholds });
  };

  // 프리셋에 없는 사용자 지정 임계값 목록
  const customThresholds = thresholds.filter((t) => !PRESET_THRESHOLDS.includes(t));

  return (
    <div className="min-h-screen bg-paper-white pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center"
        >
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <h1 className="text-title text-ink-black">예산 알림</h1>
        <div className="w-10" />
      </header>

      {/* Master Toggle */}
      <section className="px-6 pt-6">
        <div className="bg-paper-light rounded-lg p-4">
          <button
            onClick={handleToggle}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {enabled ? (
                <Bell size={20} className="text-ink-mid" />
              ) : (
                <BellOff size={20} className="text-ink-light" />
              )}
              <div>
                <p className="text-body text-ink-black text-left">예산 도달 알림</p>
                <p className="text-caption text-ink-light text-left mt-0.5">
                  월 예산 사용률 기준 알림
                </p>
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                enabled ? 'bg-ink-black' : 'bg-paper-mid'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-paper-white shadow transition-transform ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>
      </section>

      {/* Threshold Selection */}
      {enabled && (
        <section className="px-6 pt-6">
          <h2 className="text-sub text-ink-light mb-3">알림 받을 시점</h2>

          {/* Preset Thresholds */}
          <div className="bg-paper-light rounded-lg p-4">
            <p className="text-sub text-ink-mid mb-3">기본 옵션</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_THRESHOLDS.map((threshold) => {
                const isSelected = thresholds.includes(threshold);
                return (
                  <button
                    key={threshold}
                    onClick={() => handleThresholdToggle(threshold)}
                    className={`px-4 py-2 rounded-full text-sub transition-colors ${
                      isSelected
                        ? 'bg-ink-black text-paper-white'
                        : 'bg-paper-white text-ink-mid border border-paper-dark'
                    }`}
                  >
                    {threshold}%
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Thresholds */}
          <div className="bg-paper-light rounded-lg p-4 mt-3">
            <p className="text-sub text-ink-mid mb-3">사용자 지정</p>

            {/* Custom threshold chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {customThresholds.map((threshold) => (
                <div
                  key={threshold}
                  className="flex items-center gap-1 px-3 py-1.5 bg-ink-black text-paper-white rounded-full"
                >
                  <span className="text-sub">{threshold}%</span>
                  <button
                    onClick={() => handleRemoveThreshold(threshold)}
                    className="ml-1 hover:bg-ink-dark rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {/* Add button or input */}
              {showCustomInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCustom();
                      if (e.key === 'Escape') {
                        setShowCustomInput(false);
                        setCustomValue('');
                      }
                    }}
                    placeholder="1~200"
                    autoFocus
                    className="w-20 px-3 py-1.5 bg-paper-white border border-paper-dark rounded-full text-sub text-ink-black text-center outline-none focus:border-ink-mid"
                  />
                  <span className="text-sub text-ink-mid">%</span>
                  <button
                    onClick={handleAddCustom}
                    className="px-3 py-1.5 bg-ink-black text-paper-white rounded-full text-sub"
                  >
                    추가
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomValue('');
                    }}
                    className="p-1.5 text-ink-light"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-paper-white text-ink-mid border border-dashed border-paper-dark rounded-full text-sub hover:border-ink-light transition-colors"
                >
                  <Plus size={14} />
                  <span>추가</span>
                </button>
              )}
            </div>

            {customThresholds.length === 0 && !showCustomInput && (
              <p className="text-caption text-ink-light">
                원하는 임계값을 추가할 수 있어요
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="bg-paper-light rounded-lg p-4 mt-3">
            <p className="text-sub text-ink-mid mb-2">현재 설정</p>
            <p className="text-body text-ink-black">
              {thresholds.length > 0
                ? `예산의 ${thresholds.join('%, ')}% 도달 시 알림`
                : '알림이 비활성화되어 있어요'}
            </p>
            <p className="text-caption text-ink-light mt-1">
              각 임계값은 월 1회만 알림됩니다
            </p>
          </div>
        </section>
      )}

      {/* Info */}
      <section className="px-6 pt-6 pb-8">
        <div className="bg-paper-light/50 rounded-lg p-4">
          <p className="text-caption text-ink-light leading-relaxed">
            예산 알림은 거래 입력 시 예산 사용률이 설정한 임계값에 도달하면 표시됩니다.
            동일한 임계값은 한 달에 한 번만 알림되며, 새 달이 시작되면 자동으로 초기화됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
