import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Download, Trash2, Upload, RefreshCw, Tag, CreditCard, Wand2, CalendarClock, FileBarChart, Sun, Moon, Monitor, Repeat, PieChart, Bell, BellOff, LayoutGrid, HardDriveDownload, ShieldCheck } from 'lucide-react';
import { getSettings, updateSettings, resetDatabase } from '@/services/database';
import { getImportStatus, clearAllTransactions } from '@/services/excelImport';
import { getBackupStatus, runBackup, webDownloadStorage } from '@/services/backupEngine';
import {
  applyTelemetrySettings,
  buildTelemetryConsentUpdate,
  getRecentErrors,
  clearRecentErrors,
} from '@/services/telemetry';
import { BACKUP_REMINDER_OPTIONS } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { useCoachMark } from '@/components/coachmark';
import { SegmentedControl } from '@/components/common';
import type { Settings, ThemeMode } from '@/types';

// 배포된 빌드 식별자 — 빌드 시각(현지)과 커밋 해시. vite.config.ts에서 주입된다.
const buildLabel = (() => {
  const d = new Date(__BUILD_TIME__);
  const stamp = Number.isNaN(d.getTime())
    ? __BUILD_TIME__
    : `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.` +
      `${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:` +
      `${String(d.getMinutes()).padStart(2, '0')}`;
  return `${stamp} · ${__BUILD_COMMIT__}`;
})();

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { startTour } = useCoachMark();
  const [, setSettings] = useState<Settings | null>(null);
  const [budget, setBudget] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [budgetAlertEnabled, setBudgetAlertEnabled] = useState(true);
  const [categoryAlertEnabled, setCategoryAlertEnabled] = useState(true);
  const [recurringAlertEnabled, setRecurringAlertEnabled] = useState(true);
  const [paymentMethodAlertEnabled, setPaymentMethodAlertEnabled] = useState(true);

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: '라이트', icon: <Sun size={16} /> },
    { value: 'dark', label: '다크', icon: <Moon size={16} /> },
    { value: 'system', label: '시스템', icon: <Monitor size={16} /> },
  ];
  const [importStatus, setImportStatus] = useState<{
    totalTransactions: number;
    totalCategories: number;
    totalPaymentMethods: number;
    oldestDate: Date | null;
    newestDate: Date | null;
  } | null>(null);
  const [importMessage, setImportMessage] = useState('');

  // 백업 (S2)
  const [backupReminderDays, setBackupReminderDays] = useState<number>(7);
  const [lastBackupAt, setLastBackupAt] = useState<Date | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');

  // 계측 (S1)
  const [telemetryErrors, setTelemetryErrors] = useState(false);
  const [telemetryUsage, setTelemetryUsage] = useState(false);
  const [recentErrorCount, setRecentErrorCount] = useState(0);

  // 예산 표시 포맷 (천단위 콤마)
  const formatBudgetDisplay = (value: string) => {
    const num = parseInt(value.replace(/,/g, '')) || 0;
    return num > 0 ? num.toLocaleString() : '';
  };

  // 예산 입력값에서 숫자만 추출
  const parseBudgetInput = (value: string) => {
    return value.replace(/[^0-9]/g, '');
  };

  useEffect(() => {
    getSettings().then((s) => {
      if (s) {
        setSettings(s);
        setBudget(s.monthlyBudget > 0 ? s.monthlyBudget.toLocaleString() : '');
        setNotificationEnabled(s.notificationEnabled ?? true);
        setBudgetAlertEnabled(s.budgetAlertEnabled ?? true);
        setCategoryAlertEnabled(s.categoryAlertEnabled ?? true);
        setRecurringAlertEnabled(s.recurringAlertEnabled ?? true);
        setPaymentMethodAlertEnabled(s.paymentMethodAlertEnabled ?? true);
        setBackupReminderDays(s.backupReminderDays ?? 7);
        setLastBackupAt(s.lastBackupAt ? new Date(s.lastBackupAt) : null);
        setTelemetryErrors(s.telemetryErrorsEnabled ?? false);
        setTelemetryUsage(s.telemetryUsageEnabled ?? false);
      }
    });
    setRecentErrorCount(getRecentErrors().length);

    refreshImportStatus();
    // Start settings tour on first visit
    startTour('settings');
  }, [startTour]);

  const refreshImportStatus = async () => {
    const status = await getImportStatus();
    setImportStatus(status);
  };

  const handleSaveBudget = async () => {
    const newBudget = parseInt(budget.replace(/,/g, '')) || 0;
    await updateSettings({ monthlyBudget: newBudget });
    setSettings((prev) => (prev ? { ...prev, monthlyBudget: newBudget } : null));
    // 저장 후 포맷된 값으로 표시
    setBudget(newBudget > 0 ? newBudget.toLocaleString() : '');
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseBudgetInput(e.target.value);
    setBudget(formatBudgetDisplay(rawValue));
  };

  const handleClearData = async () => {
    const confirmed = window.confirm(
      '모든 거래 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?'
    );
    if (!confirmed) return;

    try {
      await clearAllTransactions();
      setImportMessage('모든 거래 데이터가 삭제되었습니다.');
      await refreshImportStatus();
    } catch (error) {
      console.error('Clear failed:', error);
      setImportMessage('삭제 실패: ' + (error as Error).message);
    }
  };

  const handleResetCategories = async () => {
    const confirmed = window.confirm(
      '모든 데이터(거래, 카테고리, 설정)가 초기화됩니다. 계속하시겠습니까?'
    );
    if (!confirmed) return;

    try {
      await resetDatabase();
      setImportMessage('데이터베이스가 초기화되었습니다. 페이지를 새로고침합니다.');
      await refreshImportStatus();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Reset failed:', error);
      setImportMessage('초기화 실패: ' + (error as Error).message);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ---- 백업 ----
  const backupStatus = getBackupStatus(
    { backupReminderDays, lastBackupAt: lastBackupAt ?? undefined },
    importStatus?.totalTransactions ?? 0
  );
  const backupStatusLabel = (() => {
    if (!lastBackupAt) return '아직 백업한 적 없어요';
    const d = backupStatus.daysSince ?? 0;
    return d === 0 ? '오늘 백업했어요' : `마지막 백업 ${d}일 전`;
  })();

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    setBackupMessage('');
    try {
      const result = await runBackup(webDownloadStorage);
      if (result.success) {
        setLastBackupAt(new Date());
        setBackupMessage(`${result.recordCount.toLocaleString()}건을 ${result.filename}으로 저장했어요`);
      } else {
        setBackupMessage('백업 실패: ' + (result.error ?? '알 수 없는 오류'));
      }
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleReminderChange = async (days: number) => {
    setBackupReminderDays(days);
    await updateSettings({ backupReminderDays: days });
  };

  // ---- 계측 ----
  const handleTelemetryToggle = async (kind: 'errors' | 'usage') => {
    const next = kind === 'errors' ? !telemetryErrors : !telemetryUsage;
    const current = await getSettings();
    const update = buildTelemetryConsentUpdate(current, { [kind]: next });
    await updateSettings(update);
    setTelemetryErrors(update.telemetryErrorsEnabled);
    setTelemetryUsage(update.telemetryUsageEnabled);
    applyTelemetrySettings({ ...current, ...update });
  };

  const handleClearRecentErrors = () => {
    clearRecentErrors();
    setRecentErrorCount(0);
  };

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
        on ? 'bg-ink-black dark:bg-pig-pink' : 'bg-paper-mid'
      }`}
    >
      <div
        className={`w-5 h-5 bg-paper-white rounded-full transition-transform ${
          on ? 'translate-x-6' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-paper-white pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center px-6 border-b border-paper-mid">
        <h1 className="text-title text-ink-black">설정</h1>
      </header>

      {/* Budget Section */}
      <section className="px-6 pt-6" data-tour="settings-budget">
        <h2 className="text-sub text-ink-light mb-2">예산</h2>
        <div className="border-b border-paper-mid">
          <div className="flex items-center justify-between py-4">
            <span className="text-body text-ink-black">월 예산</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={budget}
                onChange={handleBudgetChange}
                onBlur={handleSaveBudget}
                placeholder="0"
                className="w-32 text-right bg-transparent text-body text-ink-mid outline-none"
              />
              <span className="text-body text-ink-mid">원</span>
              <ChevronRight size={20} className="text-ink-light" />
            </div>
          </div>
        </div>
        <div className="border-b border-paper-mid">
          <button
            onClick={() => navigate('/settings/budget-wizard')}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <Wand2 size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">예산 설정 마법사</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
        <div className="border-b border-paper-mid">
          <button
            onClick={() => navigate('/settings/category-budget')}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <PieChart size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">카테고리별 예산</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
        <div className="border-b border-paper-mid">
          <button
            onClick={() => navigate('/settings/annual-expenses')}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <CalendarClock size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">연간 대형 지출 관리</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
        <div className="border-b border-paper-mid">
          <button
            onClick={() => navigate('/review')}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <FileBarChart size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">월간 리뷰</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
        <div className="border-b border-paper-mid">
          <button
            onClick={() => navigate('/settings/recurring')}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <Repeat size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">반복 거래 관리</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
      </section>

      {/* Theme Section */}
      <section className="px-6 pt-6">
        <h2 className="text-sub text-ink-light mb-2">테마</h2>
        <div className="py-4">
          <SegmentedControl
            options={themeOptions}
            value={theme}
            onChange={setTheme}
          />
          <p className="text-caption text-ink-light mt-3">
            {theme === 'system' && '기기 설정에 따라 자동으로 변경됩니다'}
            {theme === 'light' && '항상 라이트 모드를 사용합니다'}
            {theme === 'dark' && '항상 다크 모드를 사용합니다'}
          </p>
        </div>
      </section>

      {/* Home Screen Section */}
      <section className="px-6 pt-6">
        <h2 className="text-sub text-ink-light mb-2">홈 화면</h2>
        <div className="border-b border-paper-mid">
          <button
            onClick={() => navigate('/settings/insights')}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <LayoutGrid size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">인사이트 카드</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
      </section>

      {/* Alert Section */}
      <section className="px-6 pt-6">
        <h2 className="text-sub text-ink-light mb-2">알림</h2>
        {/* Master toggle for all notifications */}
        <div className="border-b border-paper-mid">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              {notificationEnabled ? (
                <Bell size={20} className="text-ink-mid" />
              ) : (
                <BellOff size={20} className="text-ink-light" />
              )}
              <span className="text-body text-ink-black">앱 내 알림</span>
            </div>
            <button
              onClick={async () => {
                const newValue = !notificationEnabled;
                setNotificationEnabled(newValue);
                await updateSettings({ notificationEnabled: newValue });
              }}
              className={`w-12 h-6 rounded-full transition-colors ${
                notificationEnabled ? 'bg-ink-black dark:bg-pig-pink' : 'bg-paper-mid'
              }`}
            >
              <div
                className={`w-5 h-5 bg-paper-white rounded-full transition-transform ${
                  notificationEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Detailed alert settings - shown only when notifications are enabled */}
        {notificationEnabled && (
          <>
            <div className="border-b border-paper-mid">
              <button
                onClick={() => navigate('/settings/budget-alerts')}
                className="w-full flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-3">
                  {budgetAlertEnabled ? (
                    <Bell size={20} className="text-ink-mid" />
                  ) : (
                    <BellOff size={20} className="text-ink-light" />
                  )}
                  <span className="text-body text-ink-black">예산 알림</span>
                </div>
                <ChevronRight size={20} className="text-ink-light" />
              </button>
            </div>
            <div className="border-b border-paper-mid">
              <button
                onClick={() => navigate('/settings/category-alerts')}
                className="w-full flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-3">
                  {categoryAlertEnabled ? (
                    <Bell size={20} className="text-ink-mid" />
                  ) : (
                    <BellOff size={20} className="text-ink-light" />
                  )}
                  <span className="text-body text-ink-black">카테고리별 알림</span>
                </div>
                <ChevronRight size={20} className="text-ink-light" />
              </button>
            </div>
            <div className="border-b border-paper-mid">
              <button
                onClick={() => navigate('/settings/recurring-alerts')}
                className="w-full flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-3">
                  {recurringAlertEnabled ? (
                    <Bell size={20} className="text-ink-mid" />
                  ) : (
                    <BellOff size={20} className="text-ink-light" />
                  )}
                  <span className="text-body text-ink-black">반복 거래 알림</span>
                </div>
                <ChevronRight size={20} className="text-ink-light" />
              </button>
            </div>
            <div className="border-b border-paper-mid">
              <button
                onClick={() => navigate('/settings/payment-method-alerts')}
                className="w-full flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-3">
                  {paymentMethodAlertEnabled ? (
                    <Bell size={20} className="text-ink-mid" />
                  ) : (
                    <BellOff size={20} className="text-ink-light" />
                  )}
                  <span className="text-body text-ink-black">결제수단별 알림</span>
                </div>
                <ChevronRight size={20} className="text-ink-light" />
              </button>
            </div>
          </>
        )}
      </section>

      {/* Category & Payment Section */}
      <section className="px-6 pt-6" data-tour="settings-category">
        <h2 className="text-sub text-ink-light mb-2">카테고리 & 수단</h2>
        <div className="border-b border-paper-mid">
          <button
            onClick={() => navigate('/settings/categories')}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <Tag size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">카테고리 관리</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
        <div className="border-b border-paper-mid">
          <button
            onClick={() => navigate('/settings/methods')}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <CreditCard size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">수단 관리</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
      </section>

      {/* Data Section */}
      <section className="px-6 pt-6" data-tour="settings-data">
        <h2 className="text-sub text-ink-light mb-2">데이터</h2>
        <div className="border-b border-paper-mid">
          <button
            onClick={() => navigate('/settings/import')}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <Upload size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">데이터 가져오기</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
        <div className="border-b border-paper-mid">
          <button
            onClick={() => navigate('/settings/export')}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <Download size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">데이터 내보내기</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>

        {/* 백업 (S2) — 전체 백업 파일 저장 + 알림 주기 */}
        <div className="border-b border-paper-mid py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDriveDownload size={20} className="text-ink-mid" />
              <div>
                <span className="text-body text-ink-black block">백업</span>
                <span className="text-caption text-ink-light">{backupStatusLabel}</span>
              </div>
            </div>
            <button
              onClick={handleBackupNow}
              disabled={isBackingUp}
              className="px-3 py-1.5 rounded-sm bg-ink-black text-paper-white text-sub disabled:opacity-50"
            >
              {isBackingUp ? '저장 중' : '지금 백업'}
            </button>
          </div>
          <div className="mt-3">
            <SegmentedControl
              options={BACKUP_REMINDER_OPTIONS.map((d) => ({
                value: String(d),
                label: d === 0 ? '알림 끔' : `${d}일마다 알림`,
              }))}
              value={String(backupReminderDays)}
              onChange={(v) => handleReminderChange(Number(v))}
            />
          </div>
          {backupMessage && (
            <p className="text-caption text-ink-mid mt-2">{backupMessage}</p>
          )}
          <p className="text-caption text-ink-light mt-2">
            iOS는 저장 공간이 부족하면 브라우저 데이터를 지울 수 있어요. 백업 파일은 파일 앱에 남습니다
          </p>
        </div>
        <div className="border-b border-paper-mid">
          <button
            onClick={handleClearData}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={20} className="text-red-500" />
              <span className="text-body text-red-500">모든 거래 삭제</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
        <div className="border-b border-paper-mid">
          <button
            onClick={handleResetCategories}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <RefreshCw size={20} className="text-orange-500" />
              <span className="text-body text-orange-500">데이터베이스 초기화</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>

        {/* Import Status */}
        {importStatus && (
          <div className="py-4 bg-paper-light rounded-md mt-4 px-4">
            <p className="text-sub text-ink-mid">현재 저장된 데이터</p>
            <p className="text-body text-ink-black mt-1">
              {importStatus.totalTransactions.toLocaleString()}개의 거래
            </p>
            {importStatus.totalTransactions > 0 && (
              <p className="text-caption text-ink-light mt-1">
                {formatDate(importStatus.oldestDate)} ~ {formatDate(importStatus.newestDate)}
              </p>
            )}
          </div>
        )}

        {/* Import Message */}
        {importMessage && (
          <div className="py-3 px-4 bg-paper-light rounded-md mt-3">
            <p className="text-sub text-ink-dark">{importMessage}</p>
          </div>
        )}
      </section>

      {/* Privacy / Telemetry Section (S1) */}
      <section className="px-6 pt-6">
        <h2 className="text-sub text-ink-light mb-2">개인정보</h2>
        <div className="py-3 flex items-start gap-3">
          <ShieldCheck size={20} className="text-ink-mid flex-shrink-0 mt-0.5" />
          <p className="text-caption text-ink-mid">
            기록은 이 기기에만 저장돼요. 아래 두 항목을 켜면 그것만 익명으로 보내고, 금액·메모·카테고리 이름은 어떤 경우에도 포함되지 않아요.
            현재 버전은 전송처가 연결되어 있지 않아 기기 안에만 기록됩니다.
          </p>
        </div>
        <div className="border-b border-paper-mid">
          <div className="flex items-center justify-between py-4">
            <div>
              <span className="text-body text-ink-black block">오류 보고</span>
              <span className="text-caption text-ink-light">앱이 멈추면 오류 내용만 보내요</span>
            </div>
            <Toggle on={telemetryErrors} onClick={() => handleTelemetryToggle('errors')} />
          </div>
        </div>
        <div className="border-b border-paper-mid">
          <div className="flex items-center justify-between py-4">
            <div>
              <span className="text-body text-ink-black block">익명 사용 통계</span>
              <span className="text-caption text-ink-light">앱을 연 날, 기록 횟수 정도만 셉니다</span>
            </div>
            <Toggle on={telemetryUsage} onClick={() => handleTelemetryToggle('usage')} />
          </div>
        </div>
      </section>

      {/* App Info Section */}
      <section className="px-6 pt-6 pb-20">
        <h2 className="text-sub text-ink-light mb-2">정보</h2>
        <div className="border-b border-paper-mid">
          <div className="flex items-center justify-between py-4">
            <span className="text-body text-ink-black">버전</span>
            <span className="text-body text-ink-mid">{__APP_VERSION__}</span>
          </div>
        </div>
        <div className="border-b border-paper-mid">
          <div className="flex items-center justify-between py-4">
            <span className="text-body text-ink-black">빌드</span>
            <span className="text-body text-ink-mid">{buildLabel}</span>
          </div>
        </div>
        <div className="border-b border-paper-mid">
          <div className="flex items-center justify-between py-4">
            <span className="text-body text-ink-black">이 기기의 최근 오류</span>
            <div className="flex items-center gap-3">
              <span className="text-body text-ink-mid">{recentErrorCount}건</span>
              {recentErrorCount > 0 && (
                <button onClick={handleClearRecentErrors} className="text-sub text-ink-mid underline">
                  지우기
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="border-b border-paper-mid">
          <button className="w-full flex items-center justify-between py-4">
            <span className="text-body text-ink-black">피드백 보내기</span>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
      </section>
    </div>
  );
}
