import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, ChevronRight, CreditCard } from 'lucide-react';
import { usePaymentMethodStore, selectPaymentMethods } from '@/stores/paymentMethodStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Icon } from '@/components/common';
import { DEFAULT_PAYMENT_METHOD_ALERT_THRESHOLDS } from '@/types';
import type { PaymentMethodAlertSetting, PaymentMethod } from '@/types';

// 선택 가능한 임계값 옵션
const THRESHOLD_OPTIONS = [50, 60, 70, 80, 90, 100];

interface PaymentMethodAlertEntry {
  methodId: string;
  methodName: string;
  methodIcon: string;
  methodColor: string;
  budget: number;
  alertSetting: PaymentMethodAlertSetting;
}

export function PaymentMethodAlertSettingsPage() {
  const navigate = useNavigate();

  // Stores
  const { fetchPaymentMethods } = usePaymentMethodStore();
  const { fetchSettings, settings, updateSettings } = useSettingsStore();
  const paymentMethods = usePaymentMethodStore(selectPaymentMethods);

  // Local state
  const [methodData, setMethodData] = useState<PaymentMethodAlertEntry[]>([]);
  const [expandedMethodId, setExpandedMethodId] = useState<string | null>(null);

  // 마스터 토글 상태
  const masterEnabled = settings?.paymentMethodAlertEnabled ?? true;

  useEffect(() => {
    fetchSettings();
    fetchPaymentMethods();
  }, [fetchSettings, fetchPaymentMethods]);

  // Initialize method data from store
  useEffect(() => {
    if (paymentMethods.length === 0 || !settings) return;

    const methodAlertSettings = settings.paymentMethodAlertSettings || {};

    // 예산이 설정된 결제수단만 필터링
    const methodsWithBudget = paymentMethods.filter(
      (method: PaymentMethod) => method.budget && method.budget > 0
    );

    const data: PaymentMethodAlertEntry[] = methodsWithBudget.map((method: PaymentMethod) => {
      const existingSetting = methodAlertSettings[method.id];
      return {
        methodId: method.id,
        methodName: method.name,
        methodIcon: method.icon,
        methodColor: method.color,
        budget: method.budget || 0,
        alertSetting: existingSetting || {
          enabled: true,
          thresholds: [...DEFAULT_PAYMENT_METHOD_ALERT_THRESHOLDS],
        },
      };
    });

    setMethodData(data);
  }, [paymentMethods, settings]);

  // 마스터 토글 변경
  const handleMasterToggle = async () => {
    const newValue = !masterEnabled;
    await updateSettings({ paymentMethodAlertEnabled: newValue });
  };

  // 개별 결제수단 토글
  const handleMethodToggle = async (methodId: string) => {
    const method = methodData.find((m) => m.methodId === methodId);
    if (!method) return;

    const newEnabled = !method.alertSetting.enabled;
    const newSetting: PaymentMethodAlertSetting = {
      ...method.alertSetting,
      enabled: newEnabled,
    };

    // Local state 업데이트
    setMethodData((prev) =>
      prev.map((m) =>
        m.methodId === methodId ? { ...m, alertSetting: newSetting } : m
      )
    );

    // DB 저장
    const currentSettings = settings?.paymentMethodAlertSettings || {};
    await updateSettings({
      paymentMethodAlertSettings: {
        ...currentSettings,
        [methodId]: newSetting,
      },
    });
  };

  // 임계값 토글
  const handleThresholdToggle = async (methodId: string, threshold: number) => {
    const method = methodData.find((m) => m.methodId === methodId);
    if (!method) return;

    const currentThresholds = method.alertSetting.thresholds;
    let newThresholds: number[];

    if (currentThresholds.includes(threshold)) {
      // 제거 (최소 1개는 유지)
      if (currentThresholds.length > 1) {
        newThresholds = currentThresholds.filter((t) => t !== threshold);
      } else {
        return; // 최소 1개 유지
      }
    } else {
      // 추가
      newThresholds = [...currentThresholds, threshold].sort((a, b) => a - b);
    }

    const newSetting: PaymentMethodAlertSetting = {
      ...method.alertSetting,
      thresholds: newThresholds,
    };

    // Local state 업데이트
    setMethodData((prev) =>
      prev.map((m) =>
        m.methodId === methodId ? { ...m, alertSetting: newSetting } : m
      )
    );

    // DB 저장
    const currentSettings = settings?.paymentMethodAlertSettings || {};
    await updateSettings({
      paymentMethodAlertSettings: {
        ...currentSettings,
        [methodId]: newSetting,
      },
    });
  };

  // 결제수단 확장/축소 토글
  const handleExpandToggle = (methodId: string) => {
    setExpandedMethodId((prev) => (prev === methodId ? null : methodId));
  };

  // 예산 없는 결제수단 안내
  const methodsWithoutBudget = paymentMethods.filter(
    (method: PaymentMethod) => !method.budget || method.budget <= 0
  );

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
        <h1 className="text-title text-ink-black">결제수단별 알림</h1>
        <div className="w-10" />
      </header>

      {/* Master Toggle */}
      <section className="px-6 pt-6">
        <div className="bg-paper-light rounded-lg p-4">
          <button
            onClick={handleMasterToggle}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {masterEnabled ? (
                <Bell size={20} className="text-ink-mid" />
              ) : (
                <BellOff size={20} className="text-ink-light" />
              )}
              <div>
                <p className="text-body text-ink-black text-left">결제수단 예산 알림</p>
                <p className="text-caption text-ink-light text-left mt-0.5">
                  개별 결제수단 예산 도달 시 알림
                </p>
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                masterEnabled ? 'bg-ink-black' : 'bg-paper-mid'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-paper-white shadow transition-transform ${
                  masterEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>
      </section>

      {/* Method List */}
      {masterEnabled && (
        <section className="px-6 pt-6">
          <h2 className="text-sub text-ink-light mb-3">
            결제수단별 설정
            <span className="text-caption ml-2">
              (예산 설정된 결제수단만 표시)
            </span>
          </h2>

          {methodData.length === 0 ? (
            <div className="bg-paper-light rounded-lg p-6 text-center">
              <CreditCard size={32} className="text-ink-light mx-auto mb-3" />
              <p className="text-body text-ink-mid">
                예산이 설정된 결제수단이 없습니다
              </p>
              <button
                onClick={() => navigate('/settings/methods')}
                className="mt-3 text-sub text-ink-black underline"
              >
                결제수단 관리하기
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {methodData.map((method) => {
                const isExpanded = expandedMethodId === method.methodId;
                const isEnabled = method.alertSetting.enabled;

                return (
                  <div
                    key={method.methodId}
                    className="bg-paper-light rounded-lg overflow-hidden"
                  >
                    {/* Method Header */}
                    <div className="p-4 flex items-center justify-between">
                      <button
                        onClick={() => handleExpandToggle(method.methodId)}
                        className="flex-1 flex items-center gap-3"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: method.methodColor + '20' }}
                        >
                          <Icon
                            name={method.methodIcon}
                            size={20}
                            style={{ color: method.methodColor }}
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-body text-ink-black">
                            {method.methodName}
                          </p>
                          <p className="text-caption text-ink-light">
                            예산 {method.budget.toLocaleString()}원
                            {isEnabled && (
                              <span className="ml-2">
                                · {method.alertSetting.thresholds.join(', ')}%
                              </span>
                            )}
                          </p>
                        </div>
                        <ChevronRight
                          size={20}
                          className={`text-ink-light transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>

                      {/* Toggle */}
                      <button
                        onClick={() => handleMethodToggle(method.methodId)}
                        className={`ml-3 w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                          isEnabled ? 'bg-ink-black' : 'bg-paper-mid'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-paper-white shadow transition-transform ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Expanded Threshold Selection */}
                    {isExpanded && isEnabled && (
                      <div className="px-4 pb-4 border-t border-paper-mid pt-3">
                        <p className="text-sub text-ink-mid mb-3">
                          알림 받을 시점 선택
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {THRESHOLD_OPTIONS.map((threshold) => {
                            const isSelected =
                              method.alertSetting.thresholds.includes(threshold);
                            return (
                              <button
                                key={threshold}
                                onClick={() =>
                                  handleThresholdToggle(method.methodId, threshold)
                                }
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Methods without budget info */}
      {masterEnabled && methodsWithoutBudget.length > 0 && methodData.length > 0 && (
        <section className="px-6 pt-6">
          <p className="text-caption text-ink-light mb-2">
            예산 미설정 결제수단 ({methodsWithoutBudget.length}개)
          </p>
          <div className="flex flex-wrap gap-2">
            {methodsWithoutBudget.slice(0, 5).map((method: PaymentMethod) => (
              <span
                key={method.id}
                className="px-3 py-1 bg-paper-light rounded-full text-caption text-ink-mid"
              >
                {method.name}
              </span>
            ))}
            {methodsWithoutBudget.length > 5 && (
              <span className="px-3 py-1 text-caption text-ink-light">
                +{methodsWithoutBudget.length - 5}개
              </span>
            )}
          </div>
        </section>
      )}

      {/* Link to Methods Management */}
      {masterEnabled && (
        <section className="px-6 pt-6 pb-8">
          <button
            onClick={() => navigate('/settings/methods')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-paper-light rounded-lg text-body text-ink-black hover:bg-paper-mid transition-colors"
          >
            <CreditCard size={18} className="text-ink-mid" />
            <span>결제수단 관리</span>
          </button>
        </section>
      )}

      {/* Info */}
      <section className="px-6 pb-8">
        <div className="bg-paper-light/50 rounded-lg p-4">
          <p className="text-caption text-ink-light leading-relaxed">
            결제수단별 예산을 설정하면 카드별, 계좌별로 지출을 관리할 수 있어요.
            설정 &gt; 수단 관리에서 결제수단 예산을 설정하세요.
          </p>
        </div>
      </section>
    </div>
  );
}
