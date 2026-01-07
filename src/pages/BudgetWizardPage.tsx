import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { getBudgetRecommendation, applyBudgetRecommendation } from '@/services/queries';
import { Icon } from '@/components/common/Icon';
import type { BudgetRecommendation, CategoryBudgetRecommendation } from '@/types';

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface CategoryBudgetState extends CategoryBudgetRecommendation {
  budget: number;
  isExpanded: boolean;
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
          isExpanded: false,
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
    if (step < 5) {
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

  const handleCategoryBudgetChange = (categoryId: string, newBudget: number) => {
    setCategoryBudgets((prev) =>
      prev.map((cat) =>
        cat.categoryId === categoryId ? { ...cat, budget: newBudget } : cat
      )
    );
    setIsAutoDistribute(false);
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setCategoryBudgets((prev) =>
      prev.map((cat) =>
        cat.categoryId === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
      )
    );
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
      setStep(5);
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

  const totalCategoryBudgets = categoryBudgets.reduce((sum, cat) => sum + cat.budget, 0);
  const budgetDifference = totalBudget - totalCategoryBudgets;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper-white dark:bg-ink-black flex flex-col items-center justify-center">
        <Loader2 size={32} className="text-ink-mid animate-spin mb-4" />
        <p className="text-body text-ink-mid">지난 3개월을 돌아볼게요</p>
      </div>
    );
  }

  const hasData = recommendation && recommendation.dataMonths > 0;

  return (
    <div className="fixed inset-0 bg-paper-white dark:bg-ink-black flex flex-col pb-nav z-[55]">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-paper-mid dark:border-ink-dark flex-shrink-0">
        <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <span className="text-sub text-ink-mid">{step} / 5</span>
        <div className="w-10" />
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-paper-mid dark:bg-ink-dark flex-shrink-0">
        <div
          className="h-full bg-ink-black dark:bg-paper-white transition-all"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

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

                <div className="border-t border-paper-mid dark:border-ink-dark pt-6 space-y-4">
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
                    <div className="h-1.5 bg-paper-mid dark:bg-ink-dark rounded-full overflow-hidden mb-1">
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
                className="w-full h-2 bg-paper-mid dark:bg-ink-dark rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:bg-ink-black
                  [&::-webkit-slider-thumb]:dark:bg-paper-white
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
                  className="flex-1 py-3 bg-paper-light dark:bg-ink-dark/50 rounded-md"
                >
                  <p className="text-sub text-ink-mid">절약</p>
                  <p className="text-body text-ink-black">
                    {formatShortCurrency(Math.round(recommendation!.avgExpense3Months * 0.9))}
                  </p>
                </button>
                <button
                  onClick={() => handleBudgetPreset('normal')}
                  className="flex-1 py-3 bg-paper-light dark:bg-ink-dark/50 rounded-md border-2 border-ink-black dark:border-paper-white"
                >
                  <p className="text-sub text-ink-mid">유지</p>
                  <p className="text-body text-ink-black">
                    {formatShortCurrency(recommendation!.avgExpense3Months)}
                  </p>
                </button>
                <button
                  onClick={() => handleBudgetPreset('relaxed')}
                  className="flex-1 py-3 bg-paper-light dark:bg-ink-dark/50 rounded-md"
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

        {/* Step 4: 카테고리별 예산 배분 */}
        {step === 4 && (
          <div className="px-6 py-8">
            <h1 className="text-title text-ink-black text-center mb-2">
              카테고리별 예산을 정해요
            </h1>
            <p className="text-sub text-ink-mid text-center mb-6">
              각 카테고리에 얼마를 쓸지 조절해보세요
            </p>

            {/* Budget Summary */}
            <div className="bg-paper-light dark:bg-ink-dark/50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-body text-ink-mid">총 예산</span>
                <span className="text-body text-ink-black font-medium">
                  {formatCurrency(totalBudget)}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-body text-ink-mid">배분된 금액</span>
                <span className="text-body text-ink-black">{formatCurrency(totalCategoryBudgets)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body text-ink-mid">
                  {budgetDifference >= 0 ? '여유 금액' : '초과 금액'}
                </span>
                <span
                  className={`text-body font-medium ${
                    budgetDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}
                >
                  {budgetDifference >= 0 ? '+' : ''}
                  {formatCurrency(budgetDifference)}
                </span>
              </div>
            </div>

            {/* Auto distribute toggle */}
            <div className="flex items-center justify-between py-3 mb-4 border-b border-paper-mid dark:border-ink-dark">
              <div className="flex items-center gap-2">
                <span className="text-sub text-ink-black">자동 배분</span>
                <Info size={14} className="text-ink-light" />
              </div>
              <button
                onClick={() => {
                  setIsAutoDistribute(!isAutoDistribute);
                  if (!isAutoDistribute) {
                    redistributeBudgets(totalBudget);
                  }
                }}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isAutoDistribute ? 'bg-ink-black dark:bg-paper-white' : 'bg-paper-mid dark:bg-ink-dark'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-paper-white dark:bg-ink-black rounded-full transition-transform ${
                    isAutoDistribute ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Category List */}
            <div className="space-y-3">
              {categoryBudgets.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="bg-paper-light dark:bg-ink-dark/30 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleCategoryExpanded(cat.categoryId)}
                    className="w-full flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: cat.categoryColor + '20' }}
                      >
                        <Icon name={cat.categoryIcon} size={16} style={{ color: cat.categoryColor }} />
                      </div>
                      <span className="text-body text-ink-black">{cat.categoryName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-body text-ink-black font-medium">
                        {formatCurrency(cat.budget)}
                      </span>
                      {cat.isExpanded ? (
                        <ChevronUp size={20} className="text-ink-mid" />
                      ) : (
                        <ChevronDown size={20} className="text-ink-mid" />
                      )}
                    </div>
                  </button>

                  {cat.isExpanded && (
                    <div className="px-3 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-caption text-ink-light">
                          월 평균 {formatCurrency(cat.avgAmount)}
                        </span>
                        <span className="text-caption text-ink-light">•</span>
                        <span className="text-caption text-ink-light">{Math.round(cat.percentage)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={totalBudget}
                        step={10000}
                        value={cat.budget}
                        onChange={(e) =>
                          handleCategoryBudgetChange(cat.categoryId, parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-paper-mid dark:bg-ink-dark rounded-full appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:w-5
                          [&::-webkit-slider-thumb]:h-5
                          [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:cursor-pointer"
                        style={{
                          // @ts-ignore
                          '--thumb-color': cat.categoryColor,
                        }}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-caption text-ink-light">0</span>
                        <input
                          type="number"
                          value={cat.budget}
                          onChange={(e) =>
                            handleCategoryBudgetChange(cat.categoryId, parseInt(e.target.value) || 0)
                          }
                          className="w-24 text-right text-sub text-ink-black bg-transparent outline-none"
                        />
                        <span className="text-caption text-ink-light">원</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: 완료 */}
        {step === 5 && !isSaving && (
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 bg-ink-black dark:bg-paper-white rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={32} className="text-paper-white dark:text-ink-black" />
            </div>

            <h1 className="text-title text-ink-black mb-2">예산 설정이 완료됐어요</h1>
            <p className="text-sub text-ink-mid mb-8">이제 예산 관리를 시작해볼까요?</p>

            <div className="bg-paper-light dark:bg-ink-dark/50 rounded-lg p-4 text-left">
              <div className="flex justify-between mb-3">
                <span className="text-body text-ink-mid">월 예산</span>
                <span className="text-body text-ink-black font-medium">
                  {formatCurrency(totalBudget)}
                </span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-body text-ink-mid">카테고리별 예산</span>
                <span className="text-body text-ink-black">{categoryBudgets.length}개 설정</span>
              </div>
              <div className="border-t border-paper-mid dark:border-ink-dark pt-3 mt-3">
                {categoryBudgets.slice(0, 3).map((cat) => (
                  <div key={cat.categoryId} className="flex justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Icon name={cat.categoryIcon} size={14} style={{ color: cat.categoryColor }} />
                      <span className="text-sub text-ink-mid">{cat.categoryName}</span>
                    </div>
                    <span className="text-sub text-ink-black">{formatCurrency(cat.budget)}</span>
                  </div>
                ))}
                {categoryBudgets.length > 3 && (
                  <p className="text-caption text-ink-light mt-2">
                    +{categoryBudgets.length - 3}개 더
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="flex-shrink-0 p-6 border-t border-paper-mid dark:border-ink-dark">
        {step < 4 && (
          <button
            onClick={handleNext}
            className="w-full py-4 bg-ink-black dark:bg-paper-white text-paper-white dark:text-ink-black rounded-md text-body"
          >
            다음
          </button>
        )}

        {step === 4 && (
          <button
            onClick={handleComplete}
            disabled={isSaving}
            className="w-full py-4 bg-ink-black dark:bg-paper-white text-paper-white dark:text-ink-black rounded-md text-body disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '예산 설정 완료'}
          </button>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 bg-ink-black dark:bg-paper-white text-paper-white dark:text-ink-black rounded-md text-body"
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
