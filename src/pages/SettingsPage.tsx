import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Download, Trash2, Upload, RefreshCw, Tag, CreditCard, Wand2, CalendarClock, FileBarChart, Sun, Moon, Monitor, Repeat, PieChart, Bell, BellOff, LayoutGrid } from 'lucide-react';
import { getSettings, updateSettings, resetDatabase } from '@/services/database';
import { getImportStatus, clearAllTransactions } from '@/services/excelImport';
import { useTheme } from '@/hooks/useTheme';
import { useCoachMark } from '@/components/coachmark';
import { SegmentedControl } from '@/components/common';
import type { Settings, ThemeMode } from '@/types';

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
      }
    });

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
          <button className="w-full flex items-center justify-between py-4">
            <span className="text-body text-ink-black">피드백 보내기</span>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
      </section>
    </div>
  );
}
