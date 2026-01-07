import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyBank, ChevronRight, ChevronLeft } from 'lucide-react';
import { updateSettings } from '@/services/database';

type Step = 'welcome' | 'budget' | 'complete';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [budget, setBudget] = useState(1500000);

  const handleStart = () => {
    setStep('budget');
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setBudget(value);
  };

  const handleComplete = async () => {
    setStep('complete');

    // 설정 저장
    await updateSettings({
      monthlyBudget: budget,
      isOnboardingComplete: true,
    });

    // 잠시 후 홈으로 이동
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 1500);
  };

  const handleBack = () => {
    setStep('welcome');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 웰컴 화면
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-paper-white flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-pink-500 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
            <PiggyBank size={48} className="text-white" />
          </div>

          {/* App Name */}
          <h1 className="text-4xl font-bold text-ink-black mb-4">PinPig</h1>

          {/* Tagline */}
          <p className="text-lg text-ink-mid mb-2">
            기록하는 가계부가 아니라
          </p>
          <p className="text-lg text-ink-mid mb-12">
            비춰주는 거울
          </p>

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full max-w-xs bg-ink-black text-white py-4 px-8 rounded-xl text-lg font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            시작하기
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Footer */}
        <p className="absolute bottom-8 text-caption text-ink-light">
          "얼마 남았지?"에 집중합니다
        </p>
      </div>
    );
  }

  // 예산 설정 화면
  if (step === 'budget') {
    return (
      <div className="min-h-screen bg-paper-white flex flex-col">
        {/* Header */}
        <header className="h-14 flex items-center px-4">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-ink-mid"
          >
            <ChevronLeft size={24} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h2 className="text-xl font-medium text-ink-black mb-2">
            월 예산을 설정해주세요
          </h2>
          <p className="text-sub text-ink-mid mb-12">
            언제든 변경할 수 있어요
          </p>

          {/* Budget Display */}
          <div className="text-center mb-12">
            <span className="text-hero font-light text-ink-black">
              {formatCurrency(budget)}
            </span>
            <span className="text-2xl text-ink-mid ml-1">원</span>
          </div>

          {/* Slider */}
          <div className="w-full max-w-sm mb-8">
            <input
              type="range"
              min={500000}
              max={5000000}
              step={100000}
              value={budget}
              onChange={handleBudgetChange}
              className="w-full h-2 bg-paper-mid rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-6
                [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:bg-ink-black
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-md"
            />
            <div className="flex justify-between mt-2 text-caption text-ink-light">
              <span>50만</span>
              <span>150만</span>
              <span>300만</span>
              <span>500만</span>
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex gap-2 mb-12">
            {[1000000, 1500000, 2000000, 3000000].map((amount) => (
              <button
                key={amount}
                onClick={() => setBudget(amount)}
                className={`px-4 py-2 rounded-full text-sub transition-colors ${
                  budget === amount
                    ? 'bg-ink-black text-white'
                    : 'bg-paper-light text-ink-mid'
                }`}
              >
                {amount / 10000}만
              </button>
            ))}
          </div>

          {/* Complete Button */}
          <button
            onClick={handleComplete}
            className="w-full max-w-xs bg-ink-black text-white py-4 px-8 rounded-xl text-lg font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            완료
          </button>
        </div>
      </div>
    );
  }

  // 완료 화면
  return (
    <div className="min-h-screen bg-paper-white flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center text-center">
        {/* Check Animation */}
        <div className="w-20 h-20 bg-semantic-positive rounded-full flex items-center justify-center mb-8 animate-bounce">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-medium text-ink-black mb-2">
          준비 완료!
        </h2>
        <p className="text-body text-ink-mid">
          이제 PinPig와 함께 시작해볼까요?
        </p>
      </div>
    </div>
  );
}
