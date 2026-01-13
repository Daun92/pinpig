import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Lightbulb, X } from 'lucide-react';
import { addMonths, subMonths, format, getDaysInMonth, getDate } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  useTransactionStore,
  selectCategoryBreakdown,
  selectMonthlyTrend,
  selectAnnualTrend,
} from '@/stores/transactionStore';
import { getSettings } from '@/services/database';
import {
  getCategoryTrend,
  getPaymentMethodBreakdown,
  getYearlySummary,
  getYearlyCategoryBreakdown,
  getYearlyPaymentMethodBreakdown,
} from '@/services/queries';
import { Icon } from '@/components/common/Icon';
import { useCoachMark } from '@/components/coachmark';
import {
  CategoryTrendModal,
  CategoryDonutChart,
  PaymentMethodDonutChart,
  PaymentMethodTrendModal,
  TrendPeriodSelector,
  CategoryFilterChips,
  MultiCategoryTrendChart,
  type TrendPeriod,
} from '@/components/report';
import type { Settings, CategorySummary, CategoryTrend, PaymentMethodSummary, MonthSummary } from '@/types';

// Tab swipe navigation TABS - defined outside component to avoid dependency issues
const TABS = ['category', 'paymentMethod', 'trend'] as const;

export function StatsPage() {
  const navigate = useNavigate();
  const { startTour } = useCoachMark();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeTab, setActiveTab] = useState<'category' | 'paymentMethod' | 'trend'>('category');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [selectedCategory, setSelectedCategory] = useState<CategorySummary | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('6months');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoryTrendData, setCategoryTrendData] = useState<Map<string, CategoryTrend[]>>(new Map());
  const [paymentMethodBreakdown, setPaymentMethodBreakdown] = useState<PaymentMethodSummary[]>([]);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentMonth.getFullYear());

  // 새로운 상태: 기간 모드 (월간/연간)
  const [periodMode, setPeriodMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearlySummary, setYearlySummary] = useState<MonthSummary | null>(null);
  const [yearlyCategoryBreakdown, setYearlyCategoryBreakdown] = useState<CategorySummary[]>([]);
  const [yearlyPaymentMethodBreakdown, setYearlyPaymentMethodBreakdown] = useState<PaymentMethodSummary[]>([]);

  // 추이 탭: 전체 라인 표시 토글 (기본값: 전체 선택)
  const [showTotalLine, setShowTotalLine] = useState(true);

  // 수단별 모달
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodSummary | null>(null);

  const {
    monthSummary,
    fetchMonthSummary,
    fetchCategoryBreakdown,
    fetchMonthlyTrend,
    fetchAnnualTrend,
    isLoading,
  } = useTransactionStore();
  const categoryBreakdown = useTransactionStore(selectCategoryBreakdown);
  const monthlyTrend = useTransactionStore(selectMonthlyTrend);
  const annualTrend = useTransactionStore(selectAnnualTrend);

  useEffect(() => {
    getSettings().then((s) => setSettings(s || null));
    // Start stats tour on first visit
    startTour('stats');
  }, [startTour]);

  useEffect(() => {
    if (periodMode === 'monthly') {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      fetchMonthSummary(year, month);
      fetchCategoryBreakdown(year, month, transactionType);
      getPaymentMethodBreakdown(year, month, transactionType).then(setPaymentMethodBreakdown);
    } else {
      // 연간 모드
      Promise.all([
        getYearlySummary(selectedYear),
        getYearlyCategoryBreakdown(selectedYear, transactionType),
        getYearlyPaymentMethodBreakdown(selectedYear, transactionType),
      ]).then(([summary, catBreakdown, pmBreakdown]) => {
        setYearlySummary(summary);
        setYearlyCategoryBreakdown(catBreakdown);
        setYearlyPaymentMethodBreakdown(pmBreakdown);
      });
    }
  }, [currentMonth, selectedYear, periodMode, transactionType, fetchMonthSummary, fetchCategoryBreakdown]);

  // Fetch trend data based on period
  useEffect(() => {
    if (trendPeriod === 'annual') {
      fetchAnnualTrend(3);
    } else {
      const months = trendPeriod === '6months' ? 6 : 12;
      fetchMonthlyTrend(months);
    }
  }, [trendPeriod, fetchMonthlyTrend, fetchAnnualTrend]);

  // Fetch category trend data when categories are selected
  useEffect(() => {
    const fetchCategoryTrends = async () => {
      // 연간 모드에서는 36개월(3년)치 데이터 가져옴
      const months = trendPeriod === 'annual' ? 36 : trendPeriod === '12months' ? 12 : 6;
      const newData = new Map<string, CategoryTrend[]>();

      for (const categoryId of selectedCategoryIds) {
        const trend = await getCategoryTrend(categoryId, months);
        newData.set(categoryId, trend);
      }

      setCategoryTrendData(newData);
    };

    if (selectedCategoryIds.length > 0) {
      fetchCategoryTrends();
    } else {
      setCategoryTrendData(new Map());
    }
  }, [selectedCategoryIds, trendPeriod]);

  const openMonthPicker = () => {
    setPickerYear(currentMonth.getFullYear());
    setShowMonthPicker(true);
  };

  const handleSelectMonth = (month: number) => {
    const selected = new Date(pickerYear, month, 1);
    setCurrentMonth(selected);
    setShowMonthPicker(false);
  };

  const isMonthDisabled = (month: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();
    if (pickerYear > currentYear) return true;
    if (pickerYear === currentYear && month > currentMonthNum) return true;
    return false;
  };

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      // Max 3 categories, remove oldest if exceeded
      if (prev.length >= 3) {
        return [...prev.slice(1), categoryId];
      }
      return [...prev, categoryId];
    });
  }, []);

  // Prepare category lines for chart
  const categoryLines = selectedCategoryIds.map((id) => {
    const category = categoryBreakdown.find((c) => c.categoryId === id);
    const data = categoryTrendData.get(id) || [];
    return {
      id,
      name: category?.categoryName || '',
      color: category?.categoryColor || '#999',
      data,
    };
  });

  // 표시 데이터 (월간/연간 모드에 따라 다름)
  const activeSummary = periodMode === 'monthly' ? monthSummary : yearlySummary;
  const activeCategoryBreakdown = periodMode === 'monthly' ? categoryBreakdown : yearlyCategoryBreakdown;
  const activePaymentMethodBreakdown = periodMode === 'monthly' ? paymentMethodBreakdown : yearlyPaymentMethodBreakdown;

  const totalExpense = activeSummary?.expense || 0;
  const totalIncome = activeSummary?.income || 0;
  const displayAmount = transactionType === 'expense' ? totalExpense : totalIncome;
  const budgetPercent = settings?.monthlyBudget
    ? Math.round((totalExpense / settings.monthlyBudget) * 100)
    : 0;

  // 남은 예산 및 하루 권장 금액 계산
  const remainingBudget = settings?.monthlyBudget ? Math.max(settings.monthlyBudget - totalExpense, 0) : 0;
  const today = new Date();
  const isCurrentMonth = currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth();
  const daysInMonth = getDaysInMonth(currentMonth);
  const remainingDays = isCurrentMonth ? Math.max(daysInMonth - getDate(today) + 1, 1) : daysInMonth;
  const dailyBudget = remainingDays > 0 ? Math.round(remainingBudget / remainingDays) : 0;

  // 기간 표시 텍스트
  const periodLabel = periodMode === 'yearly'
    ? `${selectedYear}년`
    : `${currentMonth.getMonth() + 1}월`;

  // 인사이트 생성
  const generateInsights = () => {
    const insights: string[] = [];

    if (transactionType === 'expense') {
      if (activeCategoryBreakdown.length > 0) {
        insights.push(`${activeCategoryBreakdown[0].categoryName}에 가장 많이 썼어요`);
      }

      if (monthlyTrend.length >= 2) {
        const current = monthlyTrend[monthlyTrend.length - 1];
        const previous = monthlyTrend[monthlyTrend.length - 2];

        if (current && previous) {
          const diff = current.expense - previous.expense;
          if (diff > 0) {
            insights.push(`지난달보다 ${Math.abs(diff).toLocaleString()}원 더 썼어요`);
          } else if (diff < 0) {
            insights.push(`지난달보다 ${Math.abs(diff).toLocaleString()}원 덜 썼어요`);
          }
        }
      }

      if (budgetPercent > 100) {
        insights.push(`예산을 ${budgetPercent - 100}% 초과했어요`);
      } else if (budgetPercent > 80) {
        insights.push(`예산의 ${budgetPercent}%를 사용했어요`);
      }
    } else {
      // 수입 인사이트
      if (activeCategoryBreakdown.length > 0) {
        insights.push(`${activeCategoryBreakdown[0].categoryName}에서 가장 많이 받았어요`);
      }

      if (monthlyTrend.length >= 2) {
        const current = monthlyTrend[monthlyTrend.length - 1];
        const previous = monthlyTrend[monthlyTrend.length - 2];

        if (current && previous) {
          const diff = current.income - previous.income;
          if (diff > 0) {
            insights.push(`지난달보다 ${Math.abs(diff).toLocaleString()}원 더 벌었어요`);
          } else if (diff < 0) {
            insights.push(`지난달보다 ${Math.abs(diff).toLocaleString()}원 덜 벌었어요`);
          }
        }
      }

      // 수입 대비 지출 비율
      if (totalIncome > 0) {
        const savingRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
        if (savingRate > 0) {
          insights.push(`수입의 ${savingRate}%를 저축할 수 있어요`);
        } else {
          insights.push(`수입보다 ${Math.abs(savingRate)}% 더 지출했어요`);
        }
      }
    }

    return insights.length > 0 ? insights : ['아직 분석할 데이터가 부족해요'];
  };

  const insights = generateInsights();

  // Tab swipe navigation
  const tabContentRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState<boolean | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const swipeThreshold = 60;

  // Fixed header height: Header (56px + 1px border) + Income/Expense Tab (44px + 1px border) = 102px
  const fixedHeaderHeight = 102;
  const topAnchorRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Scroll to top helper
  const scrollToTop = useCallback(() => {
    topAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Handle transaction type tab click (with scroll to top on re-click)
  const handleTransactionTypeClick = useCallback((type: 'expense' | 'income') => {
    if (transactionType === type) {
      // Same tab clicked - scroll to top
      scrollToTop();
    } else {
      // Different tab - switch and scroll to top
      setTransactionType(type);
      scrollToTop();
    }
  }, [transactionType, scrollToTop]);

  // Scroll to tab bar (for category/paymentMethod/trend TABS)
  const scrollToTabBar = useCallback(() => {
    tabBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Handle active tab click (category/paymentMethod/trend) with scroll to tab bar
  const handleActiveTabClick = useCallback((tab: 'category' | 'paymentMethod' | 'trend') => {
    if (activeTab === tab) {
      // Same tab clicked - scroll to tab bar
      scrollToTabBar();
    } else {
      // Different tab - switch and scroll to tab bar
      setActiveTab(tab);
      scrollToTabBar();
    }
  }, [activeTab, scrollToTabBar]);

  const handleTabTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setIsHorizontalSwipe(null);
    setSwipeDistance(0);
    setSwipeDirection(null);
  }, []);

  const handleTabTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // Determine swipe direction on first significant move
    if (isHorizontalSwipe === null) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX > 10 || absY > 10) {
        setIsHorizontalSwipe(absX > absY * 1.5);
      }
      return;
    }

    if (!isHorizontalSwipe) return;

    const currentIdx = TABS.indexOf(activeTab);

    if (deltaX < 0 && currentIdx < TABS.length - 1) {
      // Swiping left = next tab
      setSwipeDirection('left');
      setSwipeDistance(Math.min(Math.abs(deltaX), swipeThreshold * 1.5));
    } else if (deltaX > 0 && currentIdx > 0) {
      // Swiping right = previous tab
      setSwipeDirection('right');
      setSwipeDistance(Math.min(deltaX, swipeThreshold * 1.5));
    }
  }, [touchStartX, touchStartY, isHorizontalSwipe, activeTab]);

  const handleTabTouchEnd = useCallback(() => {
    if (swipeDistance >= swipeThreshold && swipeDirection) {
      const currentIdx = TABS.indexOf(activeTab);

      if (swipeDirection === 'left' && currentIdx < TABS.length - 1) {
        setActiveTab(TABS[currentIdx + 1]);
      } else if (swipeDirection === 'right' && currentIdx > 0) {
        setActiveTab(TABS[currentIdx - 1]);
      }
    }
    setSwipeDirection(null);
    setSwipeDistance(0);
    setIsHorizontalSwipe(null);
  }, [swipeDistance, swipeDirection, activeTab]);

  if (isLoading && !monthSummary) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-ink-mid">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-white pb-nav">
      {/* Fixed Header + Income/Expense Tab */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-paper-white">
        {/* Header */}
        <header className="h-14 flex items-center px-4 border-b border-paper-mid">
          <h1 className="text-title text-ink-black pl-2">분석</h1>
        </header>

        {/* Income/Expense Tab Bar */}
        <div className="flex border-b border-paper-mid">
          <button
            onClick={() => handleTransactionTypeClick('expense')}
            className={`flex-1 py-3 text-center text-body transition-colors ${
              transactionType === 'expense'
                ? 'text-ink-black border-b-2 border-ink-black'
                : 'text-ink-mid'
            }`}
          >
            지출
          </button>
          <button
            onClick={() => handleTransactionTypeClick('income')}
            className={`flex-1 py-3 text-center text-body transition-colors ${
              transactionType === 'income'
                ? 'text-semantic-positive border-b-2 border-ink-black'
                : 'text-ink-mid'
            }`}
          >
            수입
          </button>
        </div>
      </div>

      {/* Spacer for fixed header (also serves as scroll anchor) */}
      <div ref={topAnchorRef} style={{ height: `${fixedHeaderHeight}px` }} />

      {/* Summary Section */}
      <section className="px-6 py-6">
        {/* Period Navigation */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <button
            onClick={() => {
              if (periodMode === 'monthly') {
                setCurrentMonth((prev) => subMonths(prev, 1));
              } else {
                setSelectedYear((prev) => prev - 1);
              }
            }}
            className="w-9 h-9 flex items-center justify-center bg-paper-light rounded-full text-ink-dark"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={openMonthPicker}
            className="flex items-center gap-1 px-4 py-2 bg-paper-light rounded-full text-body text-ink-dark"
          >
            {periodMode === 'yearly'
              ? `${selectedYear}년`
              : format(currentMonth, 'yyyy년 M월', { locale: ko })}
            <ChevronDown size={14} />
          </button>
          <button
            onClick={() => {
              if (periodMode === 'monthly') {
                const next = addMonths(currentMonth, 1);
                if (next <= new Date()) {
                  setCurrentMonth(next);
                }
              } else {
                if (selectedYear < new Date().getFullYear()) {
                  setSelectedYear((prev) => prev + 1);
                }
              }
            }}
            disabled={
              periodMode === 'monthly'
                ? addMonths(currentMonth, 1) > new Date()
                : selectedYear >= new Date().getFullYear()
            }
            className="w-9 h-9 flex items-center justify-center bg-paper-light rounded-full text-ink-dark disabled:text-ink-light"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Period Mode Text Toggle (월간/연간) */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => setPeriodMode('monthly')}
            className={`text-sub transition-colors ${
              periodMode === 'monthly'
                ? 'text-ink-black underline underline-offset-4'
                : 'text-ink-light'
            }`}
          >
            월간
          </button>
          <span className="text-ink-light">|</span>
          <button
            onClick={() => setPeriodMode('yearly')}
            className={`text-sub transition-colors ${
              periodMode === 'yearly'
                ? 'text-ink-black underline underline-offset-4'
                : 'text-ink-light'
            }`}
          >
            연간
          </button>
        </div>

        <p className="text-sub text-ink-mid text-center">
          {periodLabel} {transactionType === 'expense' ? '지출' : '수입'}
        </p>
        <p className={`text-hero mt-2 text-center ${transactionType === 'income' ? 'text-semantic-positive' : 'text-ink-black'}`}>
          {transactionType === 'income' && '+ '}
          {displayAmount.toLocaleString()}원
        </p>

        {/* Budget/Balance Status Bar - 항상 표시 */}
        {transactionType === 'expense' && periodMode === 'monthly' ? (
          // 월간 지출: 예산 대비
          settings?.monthlyBudget && settings.monthlyBudget > 0 ? (
            <>
              <div className="mt-4 h-0.5 bg-paper-mid rounded-full overflow-hidden">
                <div
                  className="h-full bg-ink-black rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                />
              </div>
              <p className="text-sub text-ink-mid mt-2 text-center">
                예산의 {budgetPercent}%를 썼어요
              </p>
              {isCurrentMonth && remainingBudget > 0 && (
                <p className="text-caption text-ink-light text-center mt-1">
                  하루 {dailyBudget.toLocaleString()}원씩 쓸 수 있어요
                </p>
              )}
              {budgetPercent > 100 && (
                <p className="text-caption text-ink-light text-center mt-1">
                  {(totalExpense - settings.monthlyBudget).toLocaleString()}원 초과했어요
                </p>
              )}
            </>
          ) : (
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-sub text-ink-light">예산을 세우면 흐름이 보여요</span>
              <button
                onClick={() => navigate('/budget-wizard')}
                className="px-3 py-1 bg-paper-mid rounded-full text-caption text-ink-mid"
              >
                설정하기
              </button>
            </div>
          )
        ) : transactionType === 'expense' && periodMode === 'yearly' ? (
          // 연간 지출: 수입 대비 → 연간 예산 fallback
          <div className="mt-4">
            {totalIncome > 0 ? (
              // 수입 데이터 있음: 수입 대비 지출 비율
              <>
                <div className="h-0.5 bg-paper-mid rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ink-black rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(Math.round((totalExpense / totalIncome) * 100), 100)}%` }}
                  />
                </div>
                <p className="text-sub text-ink-mid mt-2 text-center">
                  번 돈의 {Math.round((totalExpense / totalIncome) * 100)}%를 썼어요
                </p>
                <p className="text-caption text-ink-light text-center mt-1">
                  {totalIncome - totalExpense >= 0
                    ? `${(totalIncome - totalExpense).toLocaleString()}원 남았어요`
                    : `${Math.abs(totalIncome - totalExpense).toLocaleString()}원 더 썼어요`
                  }
                </p>
              </>
            ) : settings?.monthlyBudget && settings.monthlyBudget > 0 ? (
              // 수입 없고 예산 있음: 연간 예산(월예산×12) 대비
              (() => {
                const yearlyBudget = settings.monthlyBudget * 12;
                const yearlyBudgetPercent = Math.round((totalExpense / yearlyBudget) * 100);
                return (
                  <>
                    <div className="h-0.5 bg-paper-mid rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ink-black rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(yearlyBudgetPercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-sub text-ink-mid mt-2 text-center">
                      연간 예산의 {yearlyBudgetPercent}%를 썼어요
                    </p>
                    <p className="text-caption text-ink-light text-center mt-1">
                      월 {settings.monthlyBudget.toLocaleString()}원 × 12개월 기준
                    </p>
                  </>
                );
              })()
            ) : (
              // 수입도 예산도 없음
              <p className="text-sub text-ink-light text-center">
                수입을 기록하거나 예산을 설정하면 흐름이 보여요
              </p>
            )}
          </div>
        ) : (
          // 수입 모드 (월간/연간 공통): 지출 대비 잔액
          <div className="mt-4">
            {totalExpense > 0 ? (
              <>
                <div className="h-0.5 bg-paper-mid rounded-full overflow-hidden">
                  <div
                    className="h-full bg-semantic-positive rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(Math.round(((totalIncome - totalExpense) / totalIncome) * 100), 100)}%` }}
                  />
                </div>
                <p className="text-sub text-ink-mid mt-2 text-center">
                  {totalIncome > totalExpense
                    ? `${Math.round(((totalIncome - totalExpense) / totalIncome) * 100)}%를 모을 수 있어요`
                    : `수입보다 ${Math.abs(totalIncome - totalExpense).toLocaleString()}원 더 썼어요`
                  }
                </p>
                <p className="text-caption text-ink-light text-center mt-1">
                  {periodLabel} 지출 {totalExpense.toLocaleString()}원
                </p>
              </>
            ) : (
              <p className="text-sub text-ink-mid text-center">
                아직 지출이 없어요
              </p>
            )}
          </div>
        )}
      </section>

      {/* Tab Bar Scroll Anchor */}
      <div
        ref={tabBarRef}
        style={{ scrollMarginTop: `${fixedHeaderHeight}px` }}
      />

      {/* Tab Bar - Sticky */}
      <div
        className="flex border-b border-paper-mid bg-paper-white sticky z-10"
        style={{ top: `${fixedHeaderHeight}px` }}
        data-tour="stats-TABS"
      >
        <button
          onClick={() => handleActiveTabClick('category')}
          className={`flex-1 py-3 text-center text-body ${
            activeTab === 'category'
              ? 'text-ink-black border-b-2 border-ink-black'
              : 'text-ink-mid'
          }`}
        >
          카테고리별
        </button>
        <button
          onClick={() => handleActiveTabClick('paymentMethod')}
          className={`flex-1 py-3 text-center text-body ${
            activeTab === 'paymentMethod'
              ? 'text-ink-black border-b-2 border-ink-black'
              : 'text-ink-mid'
          }`}
        >
          수단별
        </button>
        <button
          onClick={() => handleActiveTabClick('trend')}
          className={`flex-1 py-3 text-center text-body ${
            activeTab === 'trend'
              ? 'text-ink-black border-b-2 border-ink-black'
              : 'text-ink-mid'
          }`}
        >
          기간별 추이
        </button>
      </div>

      {/* Tab Content with Swipe */}
      <div
        ref={tabContentRef}
        onTouchStart={handleTabTouchStart}
        onTouchMove={handleTabTouchMove}
        onTouchEnd={handleTabTouchEnd}
        className="relative"
      >
        {/* Swipe indicator */}
        {swipeDirection && swipeDistance > 0 && (
          <div
            className={`fixed top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 px-3 py-2 bg-ink-black/80 text-paper-white rounded-lg transition-opacity ${
              swipeDirection === 'left' ? 'right-4' : 'left-4'
            }`}
            style={{
              opacity: Math.min(swipeDistance / swipeThreshold, 1),
            }}
          >
            <span className="text-sub">
              {swipeDirection === 'left'
                ? (activeTab === 'category' ? '수단별' : '기간별 추이')
                : (activeTab === 'trend' ? '수단별' : '카테고리별')
              }
            </span>
          </div>
        )}

        {/* Category Breakdown */}
        {activeTab === 'category' && (
        <section className="px-6 py-4">
          {activeCategoryBreakdown.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-body text-ink-light">거래 데이터가 없습니다</p>
            </div>
          ) : (
            <>
              {/* Donut Chart */}
              <div data-tour="stats-chart">
                <CategoryDonutChart
                  data={activeCategoryBreakdown}
                  totalAmount={displayAmount}
                  height={280}
                />
              </div>

              {/* Category List */}
              <div className="space-y-4 mt-6">
                {activeCategoryBreakdown.map((category) => (
                  <button
                    key={category.categoryId}
                    className="w-full py-2 text-left"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: category.categoryColor + '20' }}
                        >
                          <Icon
                            name={category.categoryIcon}
                            size={16}
                            className="text-ink-dark"
                          />
                        </div>
                        <span className="text-body text-ink-dark">
                          {category.categoryName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-amount ${transactionType === 'income' ? 'text-semantic-positive' : 'text-ink-black'}`}>
                          {transactionType === 'income' && '+ '}
                          {category.amount.toLocaleString()}원
                        </span>
                        <span className="text-sub text-ink-mid ml-2">
                          {Math.round(category.percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1 bg-paper-mid rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: category.categoryColor,
                        }}
                      />
                    </div>
                    <p className="text-caption text-ink-light mt-1">
                      {category.count}건
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Payment Method Breakdown */}
      {activeTab === 'paymentMethod' && (
        <section className="px-6 py-4">
          {activePaymentMethodBreakdown.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-body text-ink-light">거래 데이터가 없습니다</p>
            </div>
          ) : (
            <>
              {/* Donut Chart */}
              <PaymentMethodDonutChart
                data={activePaymentMethodBreakdown}
                totalAmount={displayAmount}
                height={280}
              />

              {/* Payment Method List */}
              <div className="space-y-4 mt-6">
                {activePaymentMethodBreakdown.map((method) => (
                  <button
                    key={method.paymentMethodId}
                    className="w-full py-2 text-left"
                    onClick={() => setSelectedPaymentMethod(method)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: method.paymentMethodColor + '20' }}
                        >
                          <Icon
                            name={method.paymentMethodIcon}
                            size={16}
                            className="text-ink-dark"
                          />
                        </div>
                        <span className="text-body text-ink-dark">
                          {method.paymentMethodName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-amount ${transactionType === 'income' ? 'text-semantic-positive' : 'text-ink-black'}`}>
                          {transactionType === 'income' && '+ '}
                          {method.amount.toLocaleString()}원
                        </span>
                        <span className="text-sub text-ink-mid ml-2">
                          {Math.round(method.percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1 bg-paper-mid rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${method.percentage}%`,
                          backgroundColor: method.paymentMethodColor,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="text-caption text-ink-light">
                        {method.count}건
                      </p>
                      {method.budget && method.budgetPercent !== undefined && periodMode === 'monthly' && (
                        <p className={`text-caption ${method.budgetPercent > 100 ? 'text-semantic-negative' : 'text-ink-mid'}`}>
                          예산의 {method.budgetPercent}%
                          {method.budgetPercent > 100 && ' (초과)'}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Monthly Trend */}
      {activeTab === 'trend' && (
        <section className="px-6 py-4">
          {/* Period Selector */}
          <div className="mb-4">
            <TrendPeriodSelector
              value={trendPeriod}
              onChange={setTrendPeriod}
            />
          </div>

          {/* Category Filter */}
          {activeCategoryBreakdown.length > 0 && (
            <div className="mb-4">
              <p className="text-caption text-ink-mid mb-2">카테고리 필터 (최대 3개)</p>
              <CategoryFilterChips
                categories={activeCategoryBreakdown}
                selectedIds={selectedCategoryIds}
                onToggle={handleCategoryToggle}
                maxSelections={3}
                showAll={true}
                showTotalOption={true}
                isTotalSelected={showTotalLine}
                onTotalToggle={() => setShowTotalLine(!showTotalLine)}
              />
            </div>
          )}

          {/* Trend Chart */}
          {(trendPeriod === 'annual' ? annualTrend.length : monthlyTrend.length) === 0 ? (
            <div className="py-12 text-center">
              <p className="text-body text-ink-light">추이 데이터가 없습니다</p>
            </div>
          ) : (
            <>
              <MultiCategoryTrendChart
                period={trendPeriod}
                monthlyData={monthlyTrend}
                annualData={annualTrend}
                categoryLines={categoryLines}
                height={240}
                showTotalLine={showTotalLine}
              />

              {/* Summary */}
              <div className="mt-6 p-4 bg-paper-light rounded-md">
                <p className="text-sub text-ink-mid mb-3">
                  {trendPeriod === 'annual'
                    ? '연간 합계'
                    : trendPeriod === '12months'
                    ? '최근 12개월 합계'
                    : '최근 6개월 합계'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-caption text-ink-light">수입</p>
                    <p className="text-body text-semantic-positive mt-1">
                      + {(trendPeriod === 'annual'
                        ? annualTrend.reduce((sum, m) => sum + m.income, 0)
                        : monthlyTrend.reduce((sum, m) => sum + m.income, 0)
                      ).toLocaleString()}원
                    </p>
                  </div>
                  <div>
                    <p className="text-caption text-ink-light">지출</p>
                    <p className="text-body text-ink-black mt-1">
                      {(trendPeriod === 'annual'
                        ? annualTrend.reduce((sum, m) => sum + m.expense, 0)
                        : monthlyTrend.reduce((sum, m) => sum + m.expense, 0)
                      ).toLocaleString()}원
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      )}
      </div>

      {/* Insights Section */}
      <section className="px-6 py-4 pb-20">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={16} className="text-ink-mid" />
          <span className="text-sub text-ink-mid">
            {periodMode === 'yearly' ? '올해 관심사' : '이번 달 관심사'}
          </span>
        </div>
        <div className="p-4 bg-paper-light rounded-md">
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="text-body text-ink-dark flex items-start gap-2">
                <span className="text-ink-light">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Period Picker Modal */}
      {showMonthPicker && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-paper-white w-full max-w-lg rounded-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-paper-mid">
              <h2 className="text-title text-ink-black">
                {periodMode === 'yearly' ? '연도 선택' : '월 선택'}
              </h2>
              <button
                onClick={() => setShowMonthPicker(false)}
                className="w-10 h-10 flex items-center justify-center"
              >
                <X size={20} className="text-ink-mid" />
              </button>
            </div>

            {/* Year Navigation */}
            <div className="flex items-center justify-center gap-4 py-4 border-b border-paper-mid">
              <button
                onClick={() => setPickerYear((prev) => prev - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-paper-light"
              >
                <ChevronLeft size={20} className="text-ink-dark" />
              </button>

              <span className="text-title text-ink-black min-w-24 text-center">
                {pickerYear}년
              </span>

              <button
                onClick={() => setPickerYear((prev) => prev + 1)}
                disabled={pickerYear >= new Date().getFullYear()}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-paper-light disabled:opacity-30"
              >
                <ChevronRight size={20} className="text-ink-dark" />
              </button>
            </div>

            {/* 연간 모드: 연도 선택 버튼 */}
            {periodMode === 'yearly' && (
              <div className="px-4 py-4">
                <button
                  onClick={() => {
                    if (pickerYear <= new Date().getFullYear()) {
                      setSelectedYear(pickerYear);
                      setShowMonthPicker(false);
                    }
                  }}
                  disabled={pickerYear > new Date().getFullYear()}
                  className={`w-full py-4 rounded-lg text-body transition-colors ${
                    pickerYear === selectedYear
                      ? 'bg-ink-black text-paper-white'
                      : pickerYear > new Date().getFullYear()
                      ? 'bg-paper-light text-ink-light'
                      : 'bg-paper-light text-ink-dark hover:bg-paper-mid'
                  }`}
                >
                  {pickerYear}년 선택
                </button>
              </div>
            )}

            {/* 월간 모드: Month Grid (4x3) */}
            {periodMode === 'monthly' && (
              <div className="grid grid-cols-4 gap-2 px-4 py-4">
                {Array.from({ length: 12 }, (_, i) => {
                  const isSelected =
                    pickerYear === currentMonth.getFullYear() &&
                    i === currentMonth.getMonth();
                  const disabled = isMonthDisabled(i);

                  return (
                    <button
                      key={i}
                      onClick={() => !disabled && handleSelectMonth(i)}
                      disabled={disabled}
                      className={`py-3 rounded-lg text-body transition-colors ${
                        isSelected
                          ? 'bg-ink-black text-paper-white'
                          : disabled
                          ? 'bg-paper-light text-ink-light'
                          : 'bg-paper-light text-ink-dark hover:bg-paper-mid'
                      }`}
                    >
                      {i + 1}월
                    </button>
                  );
                })}
              </div>
            )}

            {/* Close Button */}
            <div className="px-4 pb-4">
              <button
                onClick={() => setShowMonthPicker(false)}
                className="w-full py-4 bg-ink-black text-paper-white text-body rounded-lg"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Trend Modal */}
      {selectedCategory && (
        <CategoryTrendModal
          category={selectedCategory}
          isOpen={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          year={periodMode === 'yearly' ? selectedYear : currentMonth.getFullYear()}
          month={periodMode === 'yearly' ? 12 : currentMonth.getMonth() + 1}
          type={transactionType}
        />
      )}

      {/* Payment Method Trend Modal */}
      {selectedPaymentMethod && (
        <PaymentMethodTrendModal
          paymentMethod={selectedPaymentMethod}
          isOpen={!!selectedPaymentMethod}
          onClose={() => setSelectedPaymentMethod(null)}
          year={periodMode === 'yearly' ? selectedYear : currentMonth.getFullYear()}
          month={periodMode === 'yearly' ? 12 : currentMonth.getMonth() + 1}
          type={transactionType}
        />
      )}
    </div>
  );
}
