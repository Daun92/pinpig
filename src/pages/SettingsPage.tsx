import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/services/database';
import type { Settings } from '@/types';

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [budget, setBudget] = useState('');

  useEffect(() => {
    getSettings().then((s) => {
      if (s) {
        setSettings(s);
        setBudget(s.monthlyBudget.toString());
      }
    });
  }, []);

  const handleSaveBudget = async () => {
    const newBudget = parseInt(budget) || 0;
    await updateSettings({ monthlyBudget: newBudget });
    setSettings((prev) => (prev ? { ...prev, monthlyBudget: newBudget } : null));
  };

  return (
    <div className="px-sm pt-safe-top pb-24">
      <header className="py-md">
        <h1 className="text-title text-ink-black">설정</h1>
      </header>

      {/* Monthly Budget */}
      <section className="bg-paper-light rounded-md p-sm mb-sm">
        <label className="text-sub text-ink-mid block mb-xs">월 예산</label>
        <div className="flex gap-xs">
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="0"
            className="flex-1 bg-paper-white rounded-sm px-sm py-xs text-body text-ink-black border border-paper-mid focus:outline-none focus:border-ink-mid"
          />
          <button
            onClick={handleSaveBudget}
            className="px-sm py-xs bg-ink-black text-paper-white rounded-sm text-body"
          >
            저장
          </button>
        </div>
        {settings && (
          <p className="text-caption text-ink-light mt-xs">
            현재 설정: {settings.monthlyBudget.toLocaleString()}원
          </p>
        )}
      </section>

      {/* App Info */}
      <section className="bg-paper-light rounded-md p-sm">
        <h2 className="text-sub text-ink-mid mb-xs">앱 정보</h2>
        <p className="text-body text-ink-dark">PinPig v0.1.0</p>
        <p className="text-caption text-ink-light mt-xs">
          심플하고 귀여운 나만의 가계부 앱
        </p>
      </section>
    </div>
  );
}
