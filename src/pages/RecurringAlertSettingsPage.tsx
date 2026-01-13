import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, ChevronRight, Calendar } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCategoryStore, selectCategoryMap } from '@/stores/categoryStore';
import { getRecurringTransactions } from '@/services/queries';
import { Icon } from '@/components/common';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { RecurringTransaction, RecurringAlertSetting } from '@/types';

// 알림 시점 옵션
const DAYS_BEFORE_OPTIONS = [
  { value: 0, label: '당일' },
  { value: 1, label: '1일 전' },
  { value: 3, label: '3일 전' },
  { value: 7, label: '7일 전' },
];

// 주기 표시
function getFrequencyLabel(rt: RecurringTransaction): string {
  switch (rt.frequency) {
    case 'daily':
      return '매일';
    case 'weekly': {
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return `매주 ${days[rt.dayOfWeek || 0]}요일`;
    }
    case 'biweekly':
      return '격주';
    case 'monthly':
      return `매월 ${rt.dayOfMonth || 1}일`;
    case 'yearly':
      return '매년';
    default:
      return '';
  }
}

export function RecurringAlertSettingsPage() {
  const navigate = useNavigate();

  // Stores
  const { fetchSettings, settings, updateSettings } = useSettingsStore();
  const { fetchCategories } = useCategoryStore();
  const categoryMap = useCategoryStore(selectCategoryMap);

  // Local state
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Settings
  const masterEnabled = settings?.recurringAlertEnabled ?? true;
  const defaultDaysBefore = settings?.recurringAlertDaysBefore ?? 1;

  useEffect(() => {
    fetchSettings();
    fetchCategories();
    loadRecurringTransactions();
  }, [fetchSettings, fetchCategories]);

  const loadRecurringTransactions = async () => {
    try {
      const list = await getRecurringTransactions();
      // 활성화된 것만 필터링하고 다음 실행일 순으로 정렬
      const activeList = list
        .filter((rt: RecurringTransaction) => rt.isActive)
        .sort((a: RecurringTransaction, b: RecurringTransaction) =>
          new Date(a.nextExecutionDate).getTime() - new Date(b.nextExecutionDate).getTime()
        );
      setRecurringList(activeList);
    } catch (error) {
      console.error('Failed to load recurring transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 마스터 토글 변경
  const handleMasterToggle = async () => {
    const newValue = !masterEnabled;
    await updateSettings({ recurringAlertEnabled: newValue });
  };

  // 기본 알림 시점 변경
  const handleDefaultDaysChange = async (days: number) => {
    await updateSettings({ recurringAlertDaysBefore: days });
  };

  // 개별 반복 거래 토글
  const handleRecurringToggle = async (recurringId: string) => {
    const currentSettings = settings?.recurringAlertSettings || {};
    const currentSetting = currentSettings[recurringId] || { enabled: true };

    const newSetting: RecurringAlertSetting = {
      ...currentSetting,
      enabled: !currentSetting.enabled,
    };

    await updateSettings({
      recurringAlertSettings: {
        ...currentSettings,
        [recurringId]: newSetting,
      },
    });
  };

  // 개별 반복 거래 알림 시점 변경
  const handleRecurringDaysChange = async (recurringId: string, days: number | undefined) => {
    const currentSettings = settings?.recurringAlertSettings || {};
    const currentSetting = currentSettings[recurringId] || { enabled: true };

    const newSetting: RecurringAlertSetting = {
      ...currentSetting,
      daysBefore: days, // undefined면 전역 설정 사용
    };

    await updateSettings({
      recurringAlertSettings: {
        ...currentSettings,
        [recurringId]: newSetting,
      },
    });
  };

  // 개별 설정 가져오기
  const getRecurringSetting = (recurringId: string): RecurringAlertSetting => {
    const currentSettings = settings?.recurringAlertSettings || {};
    return currentSettings[recurringId] || { enabled: true };
  };

  // 실제 알림 일수 (개별 설정 > 전역 설정)
  const getEffectiveDaysBefore = (recurringId: string): number => {
    const setting = getRecurringSetting(recurringId);
    return setting.daysBefore !== undefined ? setting.daysBefore : defaultDaysBefore;
  };

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
        <h1 className="text-title text-ink-black">반복 거래 알림</h1>
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
                <p className="text-body text-ink-black text-left">반복 거래 사전 알림</p>
                <p className="text-caption text-ink-light text-left mt-0.5">
                  예정된 거래 전에 미리 알림
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

      {masterEnabled && (
        <>
          {/* Default Days Before */}
          <section className="px-6 pt-6">
            <h2 className="text-sub text-ink-light mb-3">기본 알림 시점</h2>
            <div className="bg-paper-light rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {DAYS_BEFORE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDefaultDaysChange(option.value)}
                    className={`px-4 py-2 rounded-full text-sub transition-colors ${
                      defaultDaysBefore === option.value
                        ? 'bg-ink-black text-paper-white'
                        : 'bg-paper-white text-ink-mid border border-paper-dark'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-caption text-ink-light mt-3">
                개별 설정이 없는 반복 거래에 적용됩니다
              </p>
            </div>
          </section>

          {/* Recurring Transaction List */}
          <section className="px-6 pt-6">
            <h2 className="text-sub text-ink-light mb-3">
              개별 거래 설정
              <span className="text-caption ml-2">
                ({recurringList.length}개)
              </span>
            </h2>

            {isLoading ? (
              <div className="bg-paper-light rounded-lg p-6 text-center">
                <p className="text-body text-ink-mid">불러오는 중...</p>
              </div>
            ) : recurringList.length === 0 ? (
              <div className="bg-paper-light rounded-lg p-6 text-center">
                <p className="text-body text-ink-mid">활성화된 반복 거래가 없습니다</p>
                <button
                  onClick={() => navigate('/settings/recurring')}
                  className="mt-3 text-sub text-ink-black underline"
                >
                  반복 거래 관리하기
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recurringList.map((rt) => {
                  const category = categoryMap.get(rt.categoryId);
                  const setting = getRecurringSetting(rt.id);
                  const isEnabled = setting.enabled;
                  const isExpanded = expandedId === rt.id;
                  const effectiveDays = getEffectiveDaysBefore(rt.id);
                  const hasCustomDays = setting.daysBefore !== undefined;

                  return (
                    <div
                      key={rt.id}
                      className="bg-paper-light rounded-lg overflow-hidden"
                    >
                      {/* Header Row */}
                      <div className="p-4 flex items-center justify-between">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : rt.id)}
                          className="flex-1 flex items-center gap-3"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: (category?.color || '#888') + '20' }}
                          >
                            <Icon
                              name={category?.icon || 'MoreHorizontal'}
                              size={20}
                              style={{ color: category?.color || '#888' }}
                            />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-body text-ink-black truncate">
                              {rt.memo || category?.name || '반복 거래'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-caption text-ink-light">
                                {getFrequencyLabel(rt)}
                              </span>
                              {isEnabled && (
                                <>
                                  <span className="text-caption text-ink-light">·</span>
                                  <span className="text-caption text-ink-mid">
                                    {effectiveDays === 0 ? '당일' : `${effectiveDays}일 전`}
                                    {hasCustomDays ? '' : ' (기본)'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight
                            size={20}
                            className={`text-ink-light transition-transform shrink-0 ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </button>

                        {/* Toggle */}
                        <button
                          onClick={() => handleRecurringToggle(rt.id)}
                          className={`ml-3 w-12 h-7 rounded-full transition-colors flex items-center px-1 shrink-0 ${
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

                      {/* Expanded Settings */}
                      {isExpanded && isEnabled && (
                        <div className="px-4 pb-4 border-t border-paper-mid pt-3">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar size={16} className="text-ink-light" />
                            <span className="text-caption text-ink-light">
                              다음 실행: {format(new Date(rt.nextExecutionDate), 'M월 d일 (EEEE)', { locale: ko })}
                            </span>
                          </div>

                          <p className="text-sub text-ink-mid mb-2">알림 시점</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleRecurringDaysChange(rt.id, undefined)}
                              className={`px-3 py-1.5 rounded-full text-caption transition-colors ${
                                !hasCustomDays
                                  ? 'bg-ink-black text-paper-white'
                                  : 'bg-paper-white text-ink-mid border border-paper-dark'
                              }`}
                            >
                              기본 ({DAYS_BEFORE_OPTIONS.find(o => o.value === defaultDaysBefore)?.label})
                            </button>
                            {DAYS_BEFORE_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleRecurringDaysChange(rt.id, option.value)}
                                className={`px-3 py-1.5 rounded-full text-caption transition-colors ${
                                  hasCustomDays && setting.daysBefore === option.value
                                    ? 'bg-ink-black text-paper-white'
                                    : 'bg-paper-white text-ink-mid border border-paper-dark'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Link to Recurring Management */}
          <section className="px-6 pt-6 pb-8">
            <button
              onClick={() => navigate('/settings/recurring')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-paper-light rounded-lg text-body text-ink-black hover:bg-paper-mid transition-colors"
            >
              <Calendar size={18} className="text-ink-mid" />
              <span>반복 거래 관리</span>
            </button>
          </section>
        </>
      )}

      {/* Info */}
      <section className="px-6 pb-8">
        <div className="bg-paper-light/50 rounded-lg p-4">
          <p className="text-caption text-ink-light leading-relaxed">
            반복 거래 알림은 앱을 열 때 확인됩니다.
            설정한 시점에 예정된 거래가 있으면 알림이 표시됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
