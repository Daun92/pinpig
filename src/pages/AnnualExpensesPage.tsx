import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Bell, BellOff, Calendar, Loader2 } from 'lucide-react';
import {
  detectAnnualLargeExpenses,
  getAnnualExpensePatterns,
  saveAnnualExpensePatterns,
  updateAnnualExpensePattern,
  deleteAnnualExpensePattern,
} from '@/services/queries';
import { Icon } from '@/components/common/Icon';
import type { AnnualExpensePattern } from '@/types';

export function AnnualExpensesPage() {
  const navigate = useNavigate();
  const [patterns, setPatterns] = useState<AnnualExpensePattern[]>([]);
  const [detectedPatterns, setDetectedPatterns] = useState<AnnualExpensePattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [showDetected, setShowDetected] = useState(false);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    setIsLoading(true);
    try {
      const saved = await getAnnualExpensePatterns();
      setPatterns(saved);
    } catch (error) {
      console.error('Failed to load patterns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const detected = await detectAnnualLargeExpenses();
      // Filter out already saved patterns
      const savedIds = new Set(patterns.map((p) => `${p.description}-${p.month}`));
      const newPatterns = detected.filter((d) => !savedIds.has(`${d.description}-${d.month}`));
      setDetectedPatterns(newPatterns);
      setShowDetected(true);
    } catch (error) {
      console.error('Failed to scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddDetected = async (pattern: AnnualExpensePattern) => {
    try {
      await saveAnnualExpensePatterns([pattern]);
      setPatterns((prev) => [...prev, pattern].sort((a, b) => a.month - b.month));
      setDetectedPatterns((prev) => prev.filter((p) => p.id !== pattern.id));
    } catch (error) {
      console.error('Failed to add pattern:', error);
    }
  };

  const handleToggleEnabled = async (pattern: AnnualExpensePattern) => {
    try {
      await updateAnnualExpensePattern(pattern.id, { isEnabled: !pattern.isEnabled });
      setPatterns((prev) =>
        prev.map((p) => (p.id === pattern.id ? { ...p, isEnabled: !p.isEnabled } : p))
      );
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const handleDelete = async (pattern: AnnualExpensePattern) => {
    const confirmed = window.confirm(`"${pattern.description}" 알림을 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      await deleteAnnualExpensePattern(pattern.id);
      setPatterns((prev) => prev.filter((p) => p.id !== pattern.id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const getDaysUntil = (month: number, day: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    let targetDate = new Date(currentYear, month - 1, day);

    if (targetDate < now) {
      targetDate = new Date(currentYear + 1, month - 1, day);
    }

    const diff = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const totalAnnualExpense = patterns
    .filter((p) => p.isEnabled)
    .reduce((sum, p) => sum + p.amount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper-white flex items-center justify-center">
        <Loader2 size={32} className="text-ink-mid animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-white pb-20">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <h1 className="text-title text-ink-black">연간 지출 관리</h1>
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="w-10 h-10 flex items-center justify-center"
        >
          {isScanning ? (
            <Loader2 size={20} className="text-ink-mid animate-spin" />
          ) : (
            <Calendar size={20} className="text-ink-mid" />
          )}
        </button>
      </header>

      {/* Detected Patterns Modal */}
      {showDetected && detectedPatterns.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetected(false)} />
          <div className="relative w-full max-w-lg bg-paper-white rounded-t-2xl max-h-[70vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-title text-ink-black mb-2">올해 예상되는 큰 지출</h2>
              <p className="text-sub text-ink-mid mb-6">작년 데이터를 분석해봤어요</p>

              <div className="space-y-4">
                {detectedPatterns.map((pattern) => (
                  <div
                    key={pattern.id}
                    className="p-4 bg-paper-light rounded-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: pattern.categoryColor + '20' }}
                        >
                          <Icon name={pattern.categoryIcon} size={20} className="text-ink-dark" />
                        </div>
                        <div>
                          <p className="text-body text-ink-black">{pattern.description}</p>
                          <p className="text-caption text-ink-light">
                            {pattern.year}년 {pattern.month}월 {pattern.day}일
                          </p>
                        </div>
                      </div>
                      <p className="text-body text-ink-black">{formatCurrency(pattern.amount)}</p>
                    </div>
                    <button
                      onClick={() => handleAddDetected(pattern)}
                      className="w-full mt-3 py-2 bg-ink-black text-paper-white rounded-md text-sub"
                    >
                      알림 추가
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowDetected(false)}
                className="w-full mt-6 py-3 text-ink-mid text-body"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {patterns.length > 0 && (
        <div className="px-6 py-4 border-b border-paper-mid">
          <p className="text-sub text-ink-mid">올해 예상 합계</p>
          <p className="text-title text-ink-black">{formatCurrency(totalAnnualExpense)}</p>
          <p className="text-caption text-ink-light mt-1">
            월 평균 {formatCurrency(Math.round(totalAnnualExpense / 12))} 추가 필요
          </p>
        </div>
      )}

      {/* Pattern List */}
      <div className="px-6 pt-4">
        {patterns.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar size={48} className="text-ink-light mx-auto mb-4" />
            <p className="text-body text-ink-mid mb-2">등록된 연간 지출이 없어요</p>
            <p className="text-sub text-ink-light mb-6">
              작년 데이터를 스캔해서
              <br />
              큰 지출을 찾아볼까요?
            </p>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="px-6 py-3 bg-ink-black text-paper-white rounded-md text-body"
            >
              {isScanning ? '분석 중...' : '작년 데이터 분석하기'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {patterns.map((pattern) => {
              const daysUntil = getDaysUntil(pattern.month, pattern.day);

              return (
                <div
                  key={pattern.id}
                  className={`p-4 rounded-md border ${
                    pattern.isEnabled ? 'border-paper-mid bg-paper-white' : 'border-paper-mid bg-paper-light opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: pattern.categoryColor + '20' }}
                      >
                        <Icon name={pattern.categoryIcon} size={20} className="text-ink-dark" />
                      </div>
                      <div>
                        <p className="text-body text-ink-black">{pattern.description}</p>
                        <p className="text-caption text-ink-light">
                          {pattern.month}월 · D-{daysUntil}
                        </p>
                      </div>
                    </div>
                    <p className="text-body text-ink-black">{formatCurrency(pattern.amount)}</p>
                  </div>

                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => handleToggleEnabled(pattern)}
                      className="p-2 rounded-md bg-paper-light"
                    >
                      {pattern.isEnabled ? (
                        <Bell size={18} className="text-ink-mid" />
                      ) : (
                        <BellOff size={18} className="text-ink-light" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(pattern)}
                      className="p-2 rounded-md bg-paper-light"
                    >
                      <Trash2 size={18} className="text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Button */}
      {patterns.length > 0 && (
        <div className="px-6 mt-6">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full py-3 border border-paper-mid rounded-md text-body text-ink-mid flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            작년 데이터에서 찾기
          </button>
        </div>
      )}
    </div>
  );
}
