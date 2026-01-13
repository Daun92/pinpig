/**
 * InsightSettingsPage - 인사이트 카드 설정 페이지
 *
 * 사용자가 홈 화면에 표시할 인사이트 위젯을 선택할 수 있는 설정 페이지
 * 최대 3개까지 선택 가능
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Info } from 'lucide-react';
import { getSettings, updateSettings } from '@/services/database';
import { INSIGHT_WIDGET_CONFIG, DEFAULT_INSIGHT_WIDGETS } from '@/types';
import type { InsightWidgetType, Settings } from '@/types';

const MAX_WIDGETS = 3;

// 위젯 순서 정의
const WIDGET_ORDER: InsightWidgetType[] = ['caution', 'room', 'compare', 'interest', 'upcoming'];

export function InsightSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedWidgets, setSelectedWidgets] = useState<InsightWidgetType[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      if (s) {
        setSettings(s);
        setSelectedWidgets(s.insightWidgets || DEFAULT_INSIGHT_WIDGETS);
      }
    });
  }, []);

  const handleToggle = (widget: InsightWidgetType) => {
    setSelectedWidgets((prev) => {
      if (prev.includes(widget)) {
        // 선택 해제
        return prev.filter((w) => w !== widget);
      } else {
        // 선택 추가 (최대 3개)
        if (prev.length >= MAX_WIDGETS) {
          return prev;
        }
        return [...prev, widget];
      }
    });
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await updateSettings({ insightWidgets: selectedWidgets });
      navigate(-1);
    } catch (error) {
      console.error('Failed to save insight settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isChanged = settings &&
    JSON.stringify(selectedWidgets.sort()) !== JSON.stringify((settings.insightWidgets || DEFAULT_INSIGHT_WIDGETS).sort());

  return (
    <div className="min-h-screen bg-paper-white pb-safe">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center -ml-2"
        >
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <h1 className="text-title text-ink-black">인사이트 카드</h1>
        <button
          onClick={handleSave}
          disabled={!isChanged || isSaving}
          className={`px-3 py-1 rounded-md text-sub transition-colors ${
            isChanged && !isSaving
              ? 'bg-ink-black text-paper-white'
              : 'bg-paper-mid text-ink-light'
          }`}
        >
          저장
        </button>
      </header>

      {/* Info Section */}
      <section className="px-6 py-4 bg-paper-light border-b border-paper-mid">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-ink-mid flex-shrink-0 mt-0.5" />
          <p className="text-sub text-ink-mid">
            홈 화면에 표시할 인사이트를 선택하세요.
            <br />
            <span className="text-caption text-ink-light">최대 {MAX_WIDGETS}개까지 선택할 수 있습니다.</span>
          </p>
        </div>
      </section>

      {/* Widget Selection */}
      <section className="px-6 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sub text-ink-light">인사이트 위젯</h2>
          <span className="text-caption text-ink-mid">
            {selectedWidgets.length}/{MAX_WIDGETS}개 선택
          </span>
        </div>

        <div className="space-y-2">
          {WIDGET_ORDER.map((widgetType) => {
            const config = INSIGHT_WIDGET_CONFIG[widgetType];
            const isSelected = selectedWidgets.includes(widgetType);
            const isDisabled = !isSelected && selectedWidgets.length >= MAX_WIDGETS;

            return (
              <button
                key={widgetType}
                onClick={() => handleToggle(widgetType)}
                disabled={isDisabled}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-ink-black/5 border-ink-black'
                    : isDisabled
                    ? 'bg-paper-light border-paper-mid opacity-50'
                    : 'bg-paper-white border-paper-mid hover:border-ink-light'
                }`}
              >
                <div className="flex-1 text-left">
                  <p className={`text-body ${isSelected ? 'text-ink-black' : 'text-ink-dark'}`}>
                    {config.label}
                  </p>
                  <p className="text-caption text-ink-light mt-0.5">
                    {config.description}
                  </p>
                  {/* 조건 표시 */}
                  {(config.requiresCategoryBudget || config.requiresLastMonthData || config.requiresUpcoming) && (
                    <p className="text-caption text-ink-light mt-1">
                      {config.requiresCategoryBudget && '카테고리 예산 설정 시 표시'}
                      {config.requiresLastMonthData && '전월 데이터가 있을 때 표시'}
                      {config.requiresUpcoming && '예정 거래가 있을 때 표시'}
                    </p>
                  )}
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ml-4 ${
                    isSelected
                      ? 'bg-ink-black'
                      : 'border-2 border-paper-dark'
                  }`}
                >
                  {isSelected && <Check size={14} className="text-paper-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selection Order Info */}
      {selectedWidgets.length > 0 && (
        <section className="px-6 pt-6">
          <h2 className="text-sub text-ink-light mb-3">표시 순서</h2>
          <div className="flex flex-wrap gap-2">
            {selectedWidgets.map((widget, index) => (
              <div
                key={widget}
                className="flex items-center gap-2 px-3 py-1.5 bg-paper-light rounded-full"
              >
                <span className="text-caption text-ink-mid">{index + 1}</span>
                <span className="text-sub text-ink-dark">
                  {INSIGHT_WIDGET_CONFIG[widget].label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-caption text-ink-light mt-3">
            선택한 순서대로 홈 화면에 표시됩니다.
          </p>
        </section>
      )}

      {/* Reset to Default */}
      <section className="px-6 pt-8 pb-6">
        <button
          onClick={() => setSelectedWidgets([...DEFAULT_INSIGHT_WIDGETS])}
          className="w-full py-3 text-sub text-ink-mid hover:text-ink-dark transition-colors"
        >
          기본값으로 초기화
        </button>
      </section>
    </div>
  );
}
