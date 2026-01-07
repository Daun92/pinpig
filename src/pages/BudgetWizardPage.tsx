import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { getBudgetRecommendation, applyBudgetRecommendation } from '@/services/queries';
import { Icon } from '@/components/common/Icon';
import type { BudgetRecommendation, CategoryBudgetRecommendation } from '@/types';

type WizardStep = 1 | 2 | 3 | 4;

interface CategoryBudgetState extends CategoryBudgetRecommendation {
  budget: number;
}

export function BudgetWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recommendation, setRecommendation] = useState<BudgetRecommendation | null>(null);
  const [totalBudget, setTotalBudget] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudgetState[]>([]);
  const [isAutoDistribute, setIsAutoDistribute] = useState(true);

  useEffect(() => {
    loadRecommendation();
  }, []);

  const loadRecommendation = async () => {
    setIsLoading(true);
    try {
      const rec = await getBudgetRecommendation();
      setRecommendation(rec);
      setTotalBudget(rec.avgExpense3Months || 2000000);
      setCategoryBudgets(
        rec.categoryBreakdown.map((cat) => ({
          ...cat,
          budget: cat.recommendedBudget,
        }))
      );
    } catch (error) {
      console.error('Failed to load recommendation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
    } else {
      setStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handleBudgetPreset = (type: 'tight' | 'normal' | 'relaxed') => {
    const base = recommendation?.avgExpense3Months || 2000000;
    const multiplier = type === 'tight' ? 0.9 : type === 'relaxed' ? 1.1 : 1;
    const newBudget = Math.round(base * multiplier);
    setTotalBudget(newBudget);
    redistributeBudgets(newBudget);
  };

  const redistributeBudgets = (newTotal: number) => {
    if (!recommendation || recommendation.avgExpense3Months === 0) return;

    setCategoryBudgets((prev) =>
      prev.map((cat) => ({
        ...cat,
        budget: Math.round((cat.percentage / 100) * newTotal),
      }))
    );
  };

  const handleTotalBudgetChange = (value: number) => {
    setTotalBudget(value);
    if (isAutoDistribute) {
      redistributeBudgets(value);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await applyBudgetRecommendation(
        totalBudget,
        categoryBudgets.map((cat) => ({
          categoryId: cat.categoryId,
          budget: cat.budget,
        }))
      );
      setStep(4);
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('예산 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const formatShortCurrency = (amount: number) => {
    if (amount >= 10000) {
      return Math.round(amount / 10000) + '만';
    }
    return amount.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper-white flex flex-col items-center justify-center">
        <Loader2 size={32} className="text-ink-mid animate-spin mb-4" />
        <p className="text-body text-ink-mid">지난 3개월을 돌아볼게요</p>
      </div>
    );
  }

  const hasData = recommendation && recommendation.dataMonths > 0;

  return (
    <div className="min-h-screen bg-paper-white flex flex-col">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid">
        <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <span className="text-sub text-ink-mid">{step} / 4</span>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Step 1: 과거 돌아보기 */}
        {step === 1 && (
          <div className="px-6 py-8">
            <h1 className="text-title text-ink-black text-center mb-2">
              {hasData ? '지난 3개월 동안' : '아직 데이터가 없어요'}
            </h1>

            {hasData ? (
              <>
                <p className="text-hero text-ink-black text-center mb-2">
                  {formatCurrency(recommendation!.totalExpense3Months)}
                </p>
                <p className="text-title text-ink-black text-center mb-8">을 사용했어요</p>

                <div className="border-t border-paper-mid pt-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-body text-ink-mid">월 평균</span>
                    <span className="text-body text-ink-black">
                      {formatCurrency(recommendation!.avgExpense3Months)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body text-ink-mid">가장 많이 쓴 달</span>
                    <span className="text-body text-ink-black">
                      {formatCurrency(recommendation!.maxExpenseMonth)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body text-ink-mid">가장 적게 쓴 달</span>
                    <span className="text-body text-ink-black">
                      {formatCurrency(recommendation!.minExpenseMonth)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-body text-ink-mid text-center mt-4 mb-8">
                  괜찮아요!
                  <br />
                  일반적인 예산으로 시작해볼게요
                </p>
                <p className="text-hero text-ink-black text-center mb-4">2,000,000원</p>
                <p className="text-sub text-ink-light text-center">
                  사용하다 보면 나에게 맞는
                  <br />
                  예산을 추천해 드릴게요
                </p>
              </>
            )}
          </div>
        )}

        {/* Step 2: 소비 패턴 */}
        {step === 2 && (
          <div className="px-6 py-8">
            <h1 className="text-title text-ink-black text-center mb-6">이렇게 쓰고 있었어요</h1>

            {categoryBudgets.length === 0 ? (
              <p className="text-body text-ink-light text-center py-12">
                분석할 지출 데이터가 없습니다
              </p>
            ) : (
              <div className="space-y-6">
                {categoryBudgets.slice(0, 6).map((cat) => (
                  <div key={cat.categoryId}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: cat.categoryColor + '20' }}
                        >
                          <Icon name={cat.categoryIcon} size={14} className="text-ink-dark" />
                        </div>
                        <span className="text-body text-ink-dark">{cat.categoryName}</span>
                      </div>
                      <span className="text-sub text-ink-mid">{Math.round(cat.percentage)}%</span>
                    </div>
                    <div className="h-1.5 bg-paper-mid rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.categoryColor,
                        }}
                      />
                    </div>
                    <p className="text-caption text-ink-light">
                      월 평균 {formatCurrency(cat.avgAmount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: 예산 목표 설정 */}
        {step === 3 && (
          <div className="px-6 py-8">
            <h1 className="text-title text-ink-black text-center mb-2">
              이번 달 목표를 정해볼까요?
            </h1>

            {hasData && (
              <p className="text-sub text-ink-mid text-center mb-8">
                월 평균 지출 {formatCurrency(recommendation!.avgExpense3Months)}
              </p>
            )}

            <div className="text-center mb-8">
              <p className="text-hero text-ink-black">{formatCurrency(totalBudget)}</p>
            </div>

            {/* Slider */}
            <div className="mb-4">
              <input
                type="range"
                min={500000}
                max={5000000}
                step={50000}
                value={totalBudget}
                onChange={(e) => handleTotalBudgetChange(parseInt(e.target.value))}
                className="w-full h-2 bg-paper-mid rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:bg-ink-black
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between mt-1">
                <span className="text-caption text-ink-light">50만</span>
                <span className="text-caption text-ink-light">500만</span>
              </div>
            </div>

            {/* Quick presets */}
            {hasData && (
              <div className="flex gap-2 mt-8">
                <button
                  onClick={() => handleBudgetPreset('tight')}
                  className="flex-1 py-3 bg-paper-light rounded-md"
                >
                  <p className="text-sub text-ink-mid">절약</p>
                  <p className="text-body text-ink-black">
                    {formatShortCurrency(Math.round(recommendation!.avgExpense3Months * 0.9))}
                  </p>
                </button>
                <button
                  onClick={() => handleBudgetPreset('normal')}
                  className="flex-1 py-3 bg-paper-light rounded-md border-2 border-ink-black"
                >
                  <p className="text-sub text-ink-mid">유지</p>
                  <p className="text-body text-ink-black">
                    {formatShortCurrency(recommendation!.avgExpense3Months)}
                  </p>
                </button>
                <button
                  onClick={() => handleBudgetPreset('relaxed')}
                  className="flex-1 py-3 bg-paper-light rounded-md"
                >
                  <p className="text-sub text-ink-mid">여유</p>
                  <p className="text-body text-ink-black">
                    {formatShortCurrency(Math.round(recommendation!.avgExpense3Months * 1.1))}
                  </p>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: 카테고리별 배분 / 완료 */}
        {step === 4 && !isSaving && (
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 bg-ink-black rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={32} className="text-paper-white" />
            </div>

            <h1 className="text-title text-ink-black mb-2">예산 설정이 완료됐어요</h1>

            <div className="mt-8 p-4 bg-paper-light rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-body text-ink-mid">월 예산</span>
                <span className="text-body text-ink-black">{formatCurrency(totalBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body text-ink-mid">카테고리</span>
                <span className="text-body text-ink-black">{categoryBudgets.length}개 설정</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="p-6 border-t border-paper-mid">
        {step < 3 && (
          <button
            onClick={handleNext}
            className="w-full py-4 bg-ink-black text-paper-white rounded-md text-body"
          >
            다음
          </button>
        )}

        {step === 3 && (
          <div className="space-y-3">
            {/* Auto distribute toggle */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sub text-ink-mid">과거 비율대로 자동 배분</span>
              <button
                onClick={() => setIsAutoDistribute(!isAutoDistribute)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isAutoDistribute ? 'bg-ink-black' : 'bg-paper-mid'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-paper-white rounded-full transition-transform ${
                    isAutoDistribute ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleComplete}
              disabled={isSaving}
              className="w-full py-4 bg-ink-black text-paper-white rounded-md text-body disabled:opacity-50"
            >
              {isSaving ? '저장 중...' : '예산 설정 완료'}
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 bg-ink-black text-paper-white rounded-md text-body"
            >
              홈으로 가기
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-full py-3 text-ink-mid text-body"
            >
              나중에 수정하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
