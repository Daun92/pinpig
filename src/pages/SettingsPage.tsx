import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Download, Trash2, Upload, RefreshCw, Tag, CreditCard, Wand2, CalendarClock, FileBarChart, Sun, Moon, Monitor, Repeat } from 'lucide-react';
import { getSettings, updateSettings, resetDatabase } from '@/services/database';
import { getImportStatus, clearAllTransactions } from '@/services/excelImport';
import { useTheme } from '@/hooks/useTheme';
import { SegmentedControl } from '@/components/common';
import type { Settings, ThemeMode } from '@/types';

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [, setSettings] = useState<Settings | null>(null);
  const [budget, setBudget] = useState('');

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

  useEffect(() => {
    getSettings().then((s) => {
      if (s) {
        setSettings(s);
        setBudget(s.monthlyBudget.toString());
      }
    });

    refreshImportStatus();
  }, []);

  const refreshImportStatus = async () => {
    const status = await getImportStatus();
    setImportStatus(status);
  };

  const handleSaveBudget = async () => {
    const newBudget = parseInt(budget) || 0;
    await updateSettings({ monthlyBudget: newBudget });
    setSettings((prev) => (prev ? { ...prev, monthlyBudget: newBudget } : null));
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
            onClick={() => navigate('/settings/import')}
            className="w-full flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-3">
              <Upload size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">데이터 가져오기 (Excel)</span>
            </div>
            <ChevronRight size={20} className="text-ink-light" />
          </button>
        </div>
        <div className="border-b border-paper-mid">
          <button className="w-full flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Download size={20} className="text-ink-mid" />
              <span className="text-body text-ink-black">데이터 내보내기 (CSV)</span>
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
