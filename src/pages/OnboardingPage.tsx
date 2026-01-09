import { useState } from 'react';
import { PiggyBank, Wallet, CalendarDays, TrendingUp } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { HomeIllustration, AddFlowIllustration, ChartIllustration } from '@/components/onboarding/illustrations';

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [budget, setBudget] = useState(2000000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setMonthlyBudget, completeOnboarding } = useSettingsStore();

  const handleNext = () => {
    if (step < 5) {
      setStep((prev) => (prev + 1) as OnboardingStep);
    }
  };

  const handleComplete = async (skipBudget = false) => {
    setIsSubmitting(true);
    try {
      if (!skipBudget) {
        await setMonthlyBudget(budget);
      }
      await completeOnboarding();
    } catch (error) {
      console.error('온보딩 완료 실패:', error);
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const totalSteps = 5;

  return (
    <div className="fixed inset-0 bg-paper-white flex flex-col">
      {/* Progress Indicator */}
      <div className="h-1 bg-paper-mid">
        <div
          className="h-full bg-ink-black transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Step 1: 웰컴 */}
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 animate-fade-in">
            {/* 앱 아이콘 */}
            <div className="w-20 h-20 bg-ink-black rounded-2xl flex items-center justify-center mb-8 animate-bounce-gentle">
              <PiggyBank className="w-10 h-10 text-paper-white" strokeWidth={1.5} />
            </div>

            {/* 메인 카피 */}
            <h1 className="text-2xl font-medium text-ink-black text-center mb-3">
              "오늘 얼마나 쓸 수 있지?"
            </h1>

            {/* 서브 카피 */}
            <p className="text-body text-ink-mid text-center">
              매일 아침, 1초만에 확인하세요
            </p>
          </div>
        )}

        {/* Step 2: 홈 기능 - 남은 예산 확인 */}
        {step === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in">
            {/* 헤드라인 */}
            <h1 className="text-xl font-medium text-ink-black text-center mb-2">
              열면 바로 보여요
            </h1>
            <p className="text-sub text-ink-mid text-center mb-8">
              남은 예산을 한눈에
            </p>

            {/* 홈 화면 일러스트 */}
            <HomeIllustration className="mb-8" />

            {/* 가치 포인트 */}
            <div className="space-y-2 w-full max-w-xs">
              <div className="flex items-center gap-3 px-4 py-2 bg-paper-light rounded-lg">
                <Wallet size={20} className="text-ink-mid" strokeWidth={1.5} />
                <span className="text-sub text-ink-dark">이번 달 남은 예산</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-paper-light rounded-lg">
                <CalendarDays size={20} className="text-ink-mid" strokeWidth={1.5} />
                <span className="text-sub text-ink-dark">하루 권장 금액</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-paper-light rounded-lg">
                <TrendingUp size={20} className="text-ink-mid" strokeWidth={1.5} />
                <span className="text-sub text-ink-dark">예산 사용 진행률</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 기록 기능 - 3터치 입력 */}
        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in">
            {/* 헤드라인 */}
            <h1 className="text-xl font-medium text-ink-black text-center mb-2">
              3번 터치로 끝
            </h1>
            <p className="text-sub text-ink-mid text-center mb-8">
              금액, 카테고리, 저장
            </p>

            {/* 3터치 플로우 일러스트 */}
            <AddFlowIllustration className="mb-8" />

            {/* 추가 설명 */}
            <div className="text-center max-w-xs">
              <p className="text-sub text-ink-mid">
                복잡한 입력 없이<br />
                빠르게 기록하세요
              </p>
            </div>
          </div>
        )}

        {/* Step 4: 분석 기능 - 소비 패턴 리포트 */}
        {step === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in">
            {/* 헤드라인 */}
            <h1 className="text-xl font-medium text-ink-black text-center mb-2">
              내 소비 패턴이 보여요
            </h1>
            <p className="text-sub text-ink-mid text-center mb-6">
              카테고리별, 기간별 분석
            </p>

            {/* 차트 일러스트 */}
            <ChartIllustration className="mb-6" />

            {/* 가치 포인트 */}
            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
              <span className="px-3 py-1.5 bg-paper-light rounded-full text-caption text-ink-mid">
                카테고리별 비율
              </span>
              <span className="px-3 py-1.5 bg-paper-light rounded-full text-caption text-ink-mid">
                월별 추이
              </span>
              <span className="px-3 py-1.5 bg-paper-light rounded-full text-caption text-ink-mid">
                수단별 분석
              </span>
            </div>
          </div>
        )}

        {/* Step 5: 예산 설정 */}
        {step === 5 && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 animate-fade-in">
            {/* 질문 */}
            <h1 className="text-xl font-medium text-ink-black text-center mb-2">
              이번 달 쓸 수 있는 돈은
            </h1>
            <h1 className="text-xl font-medium text-ink-black text-center mb-8">
              얼마인가요?
            </h1>

            {/* 금액 표시 */}
            <p className="text-hero text-ink-black mb-8">
              {formatCurrency(budget)}
            </p>

            {/* 슬라이더 */}
            <div className="w-full max-w-xs mb-4">
              <input
                type="range"
                min={500000}
                max={5000000}
                step={50000}
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value))}
                className="w-full h-2 bg-paper-mid rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:bg-ink-black
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between mt-2">
                <span className="text-caption text-ink-light">50만</span>
                <span className="text-caption text-ink-light">500만</span>
              </div>
            </div>

            {/* 안심 문구 */}
            <p className="text-sub text-ink-light text-center mt-6">
              나중에 설정에서 바꿀 수 있어요
            </p>
          </div>
        )}
      </div>

      {/* Footer Button */}
      <div className="p-6 pb-8">
        {step < 5 ? (
          <button
            onClick={handleNext}
            className="w-full py-4 bg-ink-black text-paper-white rounded-xl text-body font-medium
              active:bg-ink-dark transition-colors"
          >
            {step === 1 ? '시작하기' : '다음'}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => handleComplete(false)}
              disabled={isSubmitting}
              className="w-full py-4 bg-ink-black text-paper-white rounded-xl text-body font-medium
                active:bg-ink-dark transition-colors disabled:opacity-50"
            >
              {isSubmitting ? '설정 중...' : '완료'}
            </button>
            <button
              onClick={() => handleComplete(true)}
              disabled={isSubmitting}
              className="w-full py-3 text-ink-mid text-sub"
            >
              나중에 설정할게요
            </button>
          </div>
        )}

        {/* Step indicators (dots) */}
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalSteps }, (_, i) => (
            <button
              key={i}
              onClick={() => setStep((i + 1) as OnboardingStep)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                step === i + 1
                  ? 'bg-ink-black w-4'
                  : step > i + 1
                  ? 'bg-ink-mid'
                  : 'bg-paper-mid'
              }`}
              aria-label={`단계 ${i + 1}로 이동`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
