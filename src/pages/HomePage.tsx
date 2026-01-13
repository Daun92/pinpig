import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { useTransactionStore, selectBudgetStatus, selectCategoryBreakdown } from '@/stores/transactionStore';
import { useSettingsStore, selectMonthlyBudget } from '@/stores/settingsStore';
import { useCategoryStore, selectCategoryMap } from '@/stores/categoryStore';
import { useCoachMark } from '@/components/coachmark';
import { Icon } from '@/components/common';
import { HeroSection, InsightCard, ScrollHint } from '@/components/home';
import { isToday, isYesterday, isFuture, startOfDay, endOfMonth, startOfMonth } from 'date-fns';
import { getMonthlyBudgetStructure } from '@/services/queries';
import { checkBudgetAlerts, checkRecurringAlerts, checkPaymentMethodAlerts } from '@/services/budgetAlert';
import { DEFAULT_INSIGHT_WIDGETS } from '@/types';
import type { Transaction, MonthlyBudgetStructure } from '@/types';

// 감성적 메시지 생성
function getEmptyTodayMessage(): { main: string; sub: string } {
  const hour = new Date().getHours();
  const day = new Date().getDay(); // 0 = Sunday

  // 시간대별 메시지
  const morningMessages = [
    { main: '아직 조용한 아침이에요', sub: '오늘 하루도 차분하게' },
    { main: '새로운 하루가 시작됐어요', sub: '천천히 시작해도 괜찮아요' },
    { main: '아침 공기처럼 깨끗한 하루', sub: '' },
  ];

  const afternoonMessages = [
    { main: '지갑이 쉬고 있는 오후', sub: '' },
    { main: '여유로운 하루를 보내고 있네요', sub: '' },
    { main: '조용히 흘러가는 오후', sub: '' },
  ];

  const eveningMessages = [
    { main: '오늘은 차분한 하루였네요', sub: '' },
    { main: '지갑 없이도 충분한 하루', sub: '' },
    { main: '고요하게 저물어가는 하루', sub: '' },
  ];

  const nightMessages = [
    { main: '오늘 하루 수고했어요', sub: '내일도 좋은 하루 되길' },
    { main: '잔잔하게 마무리되는 하루', sub: '' },
    { main: '오늘은 여기까지', sub: '푹 쉬세요' },
  ];

  // 특별한 날 메시지
  const mondayMessages = [
    { main: '월요일, 아직 여유롭네요', sub: '이번 주도 천천히' },
  ];

  const fridayMessages = [
    { main: '금요일, 아직 차분한 하루', sub: '주말이 기다리고 있어요' },
  ];

  const weekendMessages = [
    { main: '느긋한 주말 오전', sub: '' },
    { main: '쉬어가는 주말', sub: '' },
  ];

  // 요일 + 시간대 조합
  let messages: { main: string; sub: string }[];

  // 주말
  if (day === 0 || day === 6) {
    if (hour < 12) {
      messages = weekendMessages;
    } else if (hour < 18) {
      messages = afternoonMessages;
    } else {
      messages = eveningMessages;
    }
  }
  // 월요일 아침
  else if (day === 1 && hour < 12) {
    messages = mondayMessages;
  }
  // 금요일 오후/저녁
  else if (day === 5 && hour >= 14) {
    messages = fridayMessages;
  }
  // 일반 시간대
  else if (hour < 12) {
    messages = morningMessages;
  } else if (hour < 18) {
    messages = afternoonMessages;
  } else if (hour < 22) {
    messages = eveningMessages;
  } else {
    messages = nightMessages;
  }

  // 랜덤 선택
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

export function HomePage() {
  const navigate = useNavigate();
  const { transactions, fetchTransactions, isLoading } = useTransactionStore();
  const { fetchSettings, settings } = useSettingsStore();
  const { fetchCategories } = useCategoryStore();
  const { startTour } = useCoachMark();

  const monthlyBudget = useSettingsStore(selectMonthlyBudget);
  const budgetStatus = useTransactionStore(selectBudgetStatus(monthlyBudget));
  const categoryMap = useCategoryStore(selectCategoryMap);
  const categoryBreakdown = useTransactionStore(selectCategoryBreakdown);
  const fetchCategoryBreakdown = useTransactionStore((state) => state.fetchCategoryBreakdown);

  const [budgetStructure, setBudgetStructure] = useState<MonthlyBudgetStructure | null>(null);
  const [emptyMessage] = useState(() => getEmptyTodayMessage());
  const alertCheckedRef = useRef(false);

  // Get insight widgets from settings (fallback to defaults)
  const insightWidgets = settings?.insightWidgets ?? DEFAULT_INSIGHT_WIDGETS;

  useEffect(() => {
    fetchSettings();
    fetchCategories();
    fetchTransactions(new Date());
    loadBudgetData();
    // 이번 달 카테고리 breakdown 로드
    const now = new Date();
    fetchCategoryBreakdown(now.getFullYear(), now.getMonth() + 1);
  }, [fetchSettings, fetchCategories, fetchTransactions, fetchCategoryBreakdown]);

  // Start home tour on first visit
  useEffect(() => {
    if (!isLoading) {
      startTour('home');
    }
  }, [isLoading, startTour]);

  // Check budget alerts when budget data changes (once per page load)
  useEffect(() => {
    if (!isLoading && settings && !alertCheckedRef.current) {
      alertCheckedRef.current = true;
      // 예산 알림 체크 (예산이 설정된 경우만)
      if (monthlyBudget > 0) {
        checkBudgetAlerts(budgetStatus, settings);
      }
      // 반복 거래 알림 체크
      checkRecurringAlerts(settings);
      // 결제수단별 알림 체크
      checkPaymentMethodAlerts(settings);
    }
  }, [isLoading, settings, monthlyBudget, budgetStatus]);

  const loadBudgetData = async () => {
    try {
      const now = new Date();
      const structure = await getMonthlyBudgetStructure(now.getFullYear(), now.getMonth() + 1);
      setBudgetStructure(structure);
    } catch (error) {
      console.error('Failed to load budget data:', error);
    }
  };

  const today = new Date();
  const currentDateLabel = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

  // Categorize transactions: today, yesterday, future (this month)
  const { todayTransactions, yesterdayTransactions, futureTransactions } = useMemo(() => {
    const monthEnd = endOfMonth(new Date());
    const monthStart = startOfMonth(new Date());

    const todayTx: Transaction[] = [];
    const yesterdayTx: Transaction[] = [];
    const futureTx: Transaction[] = [];

    for (const tx of transactions) {
      const txDate = startOfDay(tx.date);

      if (isToday(tx.date)) {
        todayTx.push(tx);
      } else if (isYesterday(tx.date)) {
        yesterdayTx.push(tx);
      } else if (isFuture(txDate) && tx.date <= monthEnd && tx.date >= monthStart) {
        futureTx.push(tx);
      }
    }

    // Sort by time (most recent first for today, oldest first for future)
    todayTx.sort((a, b) => b.date.getTime() - a.date.getTime());
    yesterdayTx.sort((a, b) => b.date.getTime() - a.date.getTime());
    futureTx.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      todayTransactions: todayTx,
      yesterdayTransactions: yesterdayTx,
      futureTransactions: futureTx,
    };
  }, [transactions]);

  // Calculate summaries
  const todaySummary = useMemo(() => {
    const income = todayTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const expense = todayTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expense, total: income - expense, count: todayTransactions.length };
  }, [todayTransactions]);

  const yesterdaySummary = useMemo(() => {
    const income = yesterdayTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const expense = yesterdayTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expense, total: income - expense, count: yesterdayTransactions.length };
  }, [yesterdayTransactions]);

  const futureSummary = useMemo(() => {
    const income = futureTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const expense = futureTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expense, total: income - expense, count: futureTransactions.length };
  }, [futureTransactions]);

  // Use projected balance if available
  const remaining = budgetStructure
    ? Math.max(budgetStatus.remaining + budgetStructure.expectedIncome - budgetStructure.fixedExpenses, 0)
    : budgetStatus.remaining;
  const remainingDays = budgetStatus.remainingDays;
  const dailyRecommended = remainingDays > 0 ? Math.round(remaining / remainingDays) : 0;

  const hasYesterday = yesterdaySummary.count > 0;
  const hasFuture = futureSummary.count > 0;
  const hasBottomCards = hasYesterday || hasFuture;

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-body text-ink-mid">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-white pb-nav flex flex-col">
      {/* Screen 1: Hero + Insight (한 화면, 중앙 밀집형) */}
      <section className="h-[calc(100dvh-60px)] flex flex-col justify-between relative pt-8 pb-4">
        {/* 상단 여백 */}
        <div className="flex-shrink-0" />

        {/* 중앙 컨텐츠 그룹 */}
        <div className="flex flex-col gap-6">
          {/* Hero Zone - 예산 현황 */}
          <HeroSection
            budgetStatus={budgetStatus}
            remaining={remaining}
            dailyRecommended={dailyRecommended}
            currentDateLabel={currentDateLabel}
          />

          {/* Insight Card - 상황별 인사이트 캐러셀 */}
          <InsightCard
            monthlyBudget={monthlyBudget}
            topCategories={categoryBreakdown}
            selectedWidgets={insightWidgets}
            onNavigate={navigate}
          />
        </div>

        {/* Scroll Hint - 하단 고정 */}
        <div className="flex-shrink-0">
          <ScrollHint label="오늘" />
        </div>
      </section>

      {/* Screen 2: Today's Transactions - 스크롤 영역 */}
      <section className="flex flex-col bg-paper-white">
        {/* Sticky Section Header */}
        <div className="sticky top-0 z-10 bg-paper-white/95 backdrop-blur-sm px-6 py-3 border-b border-paper-mid">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-title text-ink-black">오늘</h2>
              {todaySummary.count > 0 && (
                <span className="text-caption text-ink-light">{todaySummary.count}건</span>
              )}
            </div>
            {todaySummary.count > 0 && (
              <div className="flex items-center gap-3">
                {todaySummary.income > 0 && (
                  <span className="text-sub text-semantic-positive">
                    수입 +{todaySummary.income.toLocaleString()}
                  </span>
                )}
                {todaySummary.expense > 0 && (
                  <span className="text-sub text-ink-dark">
                    지출 {todaySummary.expense.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Today's Transaction List */}
        {todayTransactions.length === 0 ? (
          transactions.length === 0 ? (
            // 첫 사용자: 거래 내역이 전혀 없을 때
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <p className="text-body text-ink-dark">새로운 시작이에요</p>
              <p className="text-sub text-ink-light mt-2 text-center">
                첫 번째 기록을 남겨보세요
              </p>
              <button
                onClick={() => navigate('/add')}
                className="mt-4 px-6 py-2.5 bg-ink-black text-paper-white rounded-full text-body font-medium active:bg-ink-dark transition-colors"
              >
                + 첫 기록 남기기
              </button>
            </div>
          ) : (
            // 기존 사용자: 오늘 거래만 없을 때
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <p className="text-body text-ink-dark">{emptyMessage.main}</p>
              {emptyMessage.sub && (
                <p className="text-sub text-ink-light mt-1">{emptyMessage.sub}</p>
              )}
              <button
                onClick={() => navigate('/add')}
                className="mt-4 px-5 py-2 text-ink-mid text-sub rounded-full border border-paper-dark active:bg-paper-light transition-colors"
              >
                + 기록하기
              </button>
            </div>
          )
        ) : (
          <>
            <ul className="border-t border-paper-mid">
              {todayTransactions.map((tx) => {
                const category = categoryMap.get(tx.categoryId);
                return (
                  <li
                    key={tx.id}
                    onClick={() => navigate(`/transaction/${tx.id}`)}
                    className="px-6 py-4 border-b border-paper-mid flex items-center gap-4 cursor-pointer active:bg-paper-light transition-colors"
                  >
                    {/* Icon */}
                    <div className="text-ink-mid">
                      <Icon name={category?.icon || 'MoreHorizontal'} size={20} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* 1행: 메모 + 태그 | 시간 */}
                      <div className="flex justify-between items-start gap-2 leading-tight">
                        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1">
                          {tx.memo && (
                            <span className="text-sub text-ink-black truncate max-w-[120px]">
                              {tx.memo}
                            </span>
                          )}
                          {tx.tags && tx.tags.length > 0 && tx.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded bg-paper-mid text-caption text-ink-mid whitespace-nowrap"
                            >
                              #{tag}
                            </span>
                          ))}
                          {!tx.memo && (!tx.tags || tx.tags.length === 0) && (
                            <span className="text-sub text-ink-light">-</span>
                          )}
                        </div>
                        <span className="text-caption text-ink-light whitespace-nowrap">
                          {tx.time}
                        </span>
                      </div>

                      {/* 2행: 카테고리 | 금액 */}
                      <div className="flex justify-between items-baseline">
                        <span className="text-caption text-ink-light truncate">
                          {category?.name || '기타'}
                        </span>
                        <span className={`text-body font-medium whitespace-nowrap ${
                          tx.type === 'income' ? 'text-semantic-positive' : 'text-ink-black'
                        }`}>
                          {tx.type === 'income' ? '+' : ''}{tx.amount.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {/* 리스트 종결 표시 */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-paper-dark/30 rounded-full" />
            </div>
          </>
        )}
      </section>

      {/* Bottom Cards: Yesterday | Future (2-column summary) */}
      {hasBottomCards && (
        <section className="bg-paper-light/50 border-t border-paper-dark/20 px-6 py-4">
          <div className="flex gap-3">
            {/* Yesterday Card */}
            {hasYesterday && (
              <button
                onClick={() => navigate('/history?scrollTo=yesterday')}
                className={`flex-1 bg-paper-light rounded-xl p-4 text-left active:bg-paper-mid transition-colors ${
                  !hasFuture ? 'max-w-[50%]' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-ink-mid" />
                  <span className="text-sub text-ink-dark">어제</span>
                </div>
                <p className="text-caption text-ink-light">
                  {yesterdaySummary.count}건
                </p>
                <p className={`text-body mt-1 ${
                  yesterdaySummary.total >= 0 ? 'text-semantic-positive' : 'text-ink-black'
                }`}>
                  {yesterdaySummary.total >= 0 ? '+' : ''}{yesterdaySummary.total.toLocaleString()}원
                </p>
              </button>
            )}

            {/* Future Card */}
            {hasFuture && (
              <button
                onClick={() => navigate('/history?scrollTo=future')}
                className={`flex-1 bg-paper-light rounded-xl p-4 text-left active:bg-paper-mid transition-colors ${
                  !hasYesterday ? 'max-w-[50%]' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-ink-mid" />
                  <span className="text-sub text-ink-dark">예정</span>
                </div>
                <p className="text-caption text-ink-light">
                  {futureSummary.count}건
                </p>
                <p className={`text-body mt-1 ${
                  futureSummary.total >= 0 ? 'text-semantic-positive' : 'text-ink-black'
                }`}>
                  {futureSummary.total >= 0 ? '+' : ''}{futureSummary.total.toLocaleString()}원
                </p>
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
