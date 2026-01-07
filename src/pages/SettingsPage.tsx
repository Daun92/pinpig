import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Download, Trash2, Upload, RefreshCw, Tag, CreditCard, Wand2, CalendarClock, FileBarChart, Sun, Moon, Monitor, Bell, BellOff } from 'lucide-react';
import { getSettings, updateSettings, resetDatabase } from '@/services/database';
import { importTransactionsFromJSON, clearAllTransactions, getImportStatus } from '@/services/importData';
import { exportTransactionsToCSV } from '@/services/exportData';
import { useTheme, getThemeLabel } from '@/hooks/useTheme';
import {
  requestNotificationPermission,
  getNotificationPermission,
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from '@/services/notifications';
import type { Settings, ThemeMode } from '@/types';

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [, setSettings] = useState<Settings | null>(null);
  const [budget, setBudget] = useState('');
  const [importStatus, setImportStatus] = useState<{
    totalTransactions: number;
    oldestDate: Date | null;
    newestDate: Date | null;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(getNotificationSettings());

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: '라이트', icon: Sun },
    { value: 'dark', label: '다크', icon: Moon },
    { value: 'system', label: '시스템', icon: Monitor },
  ];

  useEffect(() => {
    getSettings().then((s) => {
      if (s) {
        setSettings(s);
        setBudget(s.monthlyBudget.toString());
      }
    });

    refreshImportStatus();
    setNotificationPermission(getNotificationPermission());
  }, []);

  const handleToggleBudgetAlert = async () => {
    const newSettings = {
      ...notificationSettings,
      budgetAlert: !notificationSettings.budgetAlert,
    };

    // 알림 활성화 시 권한 요청
    if (newSettings.budgetAlert && notificationPermission !== 'granted') {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      if (permission !== 'granted') {
        return;
      }
    }

    setNotificationSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const refreshImportStatus = async () => {
    const status = await getImportStatus();
    setImportStatus(status);
  };

  const handleSaveBudget = async () => {
    const newBudget = parseInt(budget) || 0;
    await updateSettings({ monthlyBudget: newBudget });
    setSettings((prev) => (prev ? { ...prev, monthlyBudget: newBudget } : null));
  };

  const handleImportData = async () => {
    if (isImporting) return;

    const confirmed = window.confirm(
      '기존 데이터에 추가로 가져옵니다. 계속하시겠습니까?'
    );
    if (!confirmed) return;

    setIsImporting(true);
    setImportMessage('데이터를 가져오는 중...');

    try {
      const count = await importTransactionsFromJSON('/import-data.json');
      setImportMessage(`${count.toLocaleString()}개의 거래를 가져왔습니다.`);
      await refreshImportStatus();
    } catch (error) {
      console.error('Import failed:', error);
      setImportMessage('가져오기 실패: ' + (error as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportData = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setImportMessage('');

    try {
      await exportTransactionsToCSV();
      setImportMessage('CSV 파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('Export failed:', error);
      setImportMessage('내보내기 실패: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
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
    <div className="min-h-screen bg-paper-white pb-20">
      {/* Header */}
      <header className="h-14 flex items-center px-6 border-b border-paper-mid">
        <h1 className="text-title text-ink-black">설정</h1>
      </header>

      {/* Budget Section */}
      <section className="px-6 pt-6">
        <h2 className="text-sub text-ink-light mb-2">예산</h2>
        <div className="border-b border-paper-mid">
          <div className="flex items-center justify-between py-4">
            <span className="text-body text-ink-black">월 예산</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
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
      </section>

      {/* Category & Payment Section */}
      <section className="px-6 pt-6">
        <h2 className="text-sub text-ink-light mb-2">카테고리 & 결제수단</h2>
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
            onClick={() => navigate('/settings/payment-methods')}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <CreditCard size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">결제수단 관리</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
      </section>

      {/* Data Section */}
      <section className="px-6 pt-6">
        <h2 className="text-sub text-ink-light mb-2">데이터</h2>
        <div className="border-b border-paper-mid">
          <button
            onClick={handleImportData}
            disabled={isImporting}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <Upload size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">
                {isImporting ? '가져오는 중...' : '데이터 가져오기'}
              </span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
        <div className="border-b border-paper-mid">
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <Download size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">
                {isExporting ? '내보내는 중...' : '데이터 내보내기 (CSV)'}
              </span>
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

      {/* Display Section */}
      <section className="px-6 pt-6">
        <h2 className="text-sub text-ink-light mb-2">화면</h2>
        <div className="border-b border-paper-mid">
          <button
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon size={20} className="text-ink-mid" />
              ) : theme === 'light' ? (
                <Sun size={20} className="text-ink-mid" />
              ) : (
                <Monitor size={20} className="text-ink-mid" />
              )}
              <span className="text-body text-ink-black">다크 모드</span>
            </div>
            <span className="text-body text-ink-mid">{getThemeLabel(theme)}</span>
          </button>
        </div>

        {/* Theme Selector */}
        {showThemeSelector && (
          <div className="py-2 bg-paper-light rounded-md mt-2">
            {themeOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value);
                    setShowThemeSelector(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 ${
                    theme === option.value ? 'bg-paper-mid' : ''
                  }`}
                >
                  <IconComponent size={18} className="text-ink-mid" />
                  <span className="text-body text-ink-black">{option.label}</span>
                  {theme === option.value && (
                    <span className="ml-auto text-semantic-positive">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Notification Section */}
      <section className="px-6 pt-6">
        <h2 className="text-sub text-ink-light mb-2">알림</h2>
        <div className="border-b border-paper-mid">
          <button
            onClick={handleToggleBudgetAlert}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              {notificationSettings.budgetAlert ? (
                <Bell size={20} className="text-ink-mid" />
              ) : (
                <BellOff size={20} className="text-ink-mid" />
              )}
              <div className="flex flex-col items-start">
                <span className="text-body text-ink-black">예산 알림</span>
                <span className="text-caption text-ink-light">
                  예산의 80% 사용 시 알림
                </span>
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                notificationSettings.budgetAlert ? 'bg-semantic-positive' : 'bg-paper-mid'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notificationSettings.budgetAlert ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>
        {notificationPermission === 'denied' && (
          <p className="text-caption text-semantic-caution mt-2">
            브라우저에서 알림이 차단되어 있습니다. 설정에서 허용해주세요.
          </p>
        )}
        {notificationPermission === 'unsupported' && (
          <p className="text-caption text-ink-light mt-2">
            이 브라우저는 알림을 지원하지 않습니다.
          </p>
        )}
      </section>

      {/* App Info Section */}
      <section className="px-6 pt-6">
        <h2 className="text-sub text-ink-light mb-2">정보</h2>
        <div className="border-b border-paper-mid">
          <div className="flex items-center justify-between py-4">
            <span className="text-body text-ink-black">버전</span>
            <span className="text-body text-ink-mid">0.1.0</span>
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
