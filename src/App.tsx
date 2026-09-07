import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { AddPage } from '@/pages/AddPage';
import { TabBar } from '@/components/layout/TabBar';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { CoachMarkProvider } from '@/components/coachmark';
import { ToastContainer } from '@/components/common';
import { useTheme } from '@/hooks/useTheme';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { useDeepLink } from '@/hooks/useDeepLink';
import { useSettingsStore, selectIsOnboardingComplete } from '@/stores/settingsStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { useToastStore } from '@/stores/toastStore';
import { processRecurringTransactions } from '@/services/budgetAlert';
import { applyTelemetrySettings, track, daysSinceInstall } from '@/services/telemetry';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { createDayChangeGuard } from '@/utils/date';

// 홈·입력 외 페이지는 지연 로드로 분할 — 초기 번들 축소 + 업데이트 시 변경 청크만 재다운로드
// (PWA 프리캐시 대상이라 지연 청크도 설치 후에는 캐시에서 즉시 로드됨)
const EditTransactionPage = lazy(() => import('@/pages/EditTransactionPage').then((m) => ({ default: m.EditTransactionPage })));
const TransactionDetailPage = lazy(() => import('@/pages/TransactionDetailPage').then((m) => ({ default: m.TransactionDetailPage })));
const HistoryPage = lazy(() => import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const StatsPage = lazy(() => import('@/pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const CategoryManagePage = lazy(() => import('@/pages/CategoryManagePage').then((m) => ({ default: m.CategoryManagePage })));
const CategoryEditPage = lazy(() => import('@/pages/CategoryEditPage').then((m) => ({ default: m.CategoryEditPage })));
const PaymentMethodManagePage = lazy(() => import('@/pages/PaymentMethodManagePage').then((m) => ({ default: m.PaymentMethodManagePage })));
const PaymentMethodEditPage = lazy(() => import('@/pages/PaymentMethodEditPage').then((m) => ({ default: m.PaymentMethodEditPage })));
const IncomeSourceManagePage = lazy(() => import('@/pages/IncomeSourceManagePage').then((m) => ({ default: m.IncomeSourceManagePage })));
const IncomeSourceEditPage = lazy(() => import('@/pages/IncomeSourceEditPage').then((m) => ({ default: m.IncomeSourceEditPage })));
const MethodManagePage = lazy(() => import('@/pages/MethodManagePage').then((m) => ({ default: m.MethodManagePage })));
const BudgetWizardPage = lazy(() => import('@/pages/BudgetWizardPage').then((m) => ({ default: m.BudgetWizardPage })));
const CategoryBudgetPage = lazy(() => import('@/pages/CategoryBudgetPage').then((m) => ({ default: m.CategoryBudgetPage })));
const AnnualExpensesPage = lazy(() => import('@/pages/AnnualExpensesPage').then((m) => ({ default: m.AnnualExpensesPage })));
const MonthlyReviewPage = lazy(() => import('@/pages/MonthlyReviewPage').then((m) => ({ default: m.MonthlyReviewPage })));
const ImportDataPage = lazy(() => import('@/pages/ImportDataPage').then((m) => ({ default: m.ImportDataPage })));
const ExportDataPage = lazy(() => import('@/pages/ExportDataPage').then((m) => ({ default: m.ExportDataPage })));
const RecurringTransactionPage = lazy(() => import('@/pages/RecurringTransactionPage').then((m) => ({ default: m.RecurringTransactionPage })));
const RecurringTransactionEditPage = lazy(() => import('@/pages/RecurringTransactionEditPage').then((m) => ({ default: m.RecurringTransactionEditPage })));
const InsightSettingsPage = lazy(() => import('@/pages/InsightSettingsPage').then((m) => ({ default: m.InsightSettingsPage })));
const CategoryAlertSettingsPage = lazy(() => import('@/pages/CategoryAlertSettingsPage').then((m) => ({ default: m.CategoryAlertSettingsPage })));
const BudgetAlertSettingsPage = lazy(() => import('@/pages/BudgetAlertSettingsPage').then((m) => ({ default: m.BudgetAlertSettingsPage })));
const RecurringAlertSettingsPage = lazy(() => import('@/pages/RecurringAlertSettingsPage').then((m) => ({ default: m.RecurringAlertSettingsPage })));
const PaymentMethodAlertSettingsPage = lazy(() => import('@/pages/PaymentMethodAlertSettingsPage').then((m) => ({ default: m.PaymentMethodAlertSettingsPage })));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));

// 지연 청크 로드 중 표시 (SW 캐시 적중 시 사실상 보이지 않음)
function RouteFallback() {
  return <div className="flex-1" aria-busy="true" />;
}

// 반복 거래 처리 가드: 날짜 키로 하루 1회 보장
// (PWA가 메모리에 며칠 유지돼도 날짜가 바뀌면 재실행, StrictMode 중복 실행 방지 겸용)
let lastRecurringProcessDate: string | null = null;
let lastAppOpenTracked: string | null = null;

// 날짜 변경 감시: PWA가 백그라운드에 머무는 동안 자정·월초를 넘기면
// 화면의 "오늘"·"이번 달" 기준이 낡는다. 반복거래 생성 여부와 무관하게 다시 읽는다.
const hasDayChanged = createDayChangeGuard();

function refreshForDateChange() {
  if (!hasDayChanged()) return;
  const now = new Date();
  useTransactionStore.getState().fetchTransactions(now);
  useTransactionStore.getState().fetchCategoryBreakdown(now.getFullYear(), now.getMonth() + 1);
}

function runRecurringProcessing() {
  const today = new Date().toDateString();
  if (lastRecurringProcessDate === today) return;
  lastRecurringProcessDate = today;

  processRecurringTransactions().then((count) => {
    if (count > 0) {
      const now = new Date();
      useTransactionStore.getState().fetchTransactions(now);
      useTransactionStore.getState().fetchCategoryBreakdown(now.getFullYear(), now.getMonth() + 1);
      useToastStore.getState().showToast({
        type: 'info',
        message: `${count}건의 반복 거래가 기록되었어요`,
      });
    }
  });
}

export default function App() {
  // Initialize theme management
  useTheme();

  // Enable swipe-back navigation (left edge → right swipe)
  useSwipeBack();

  // Handle deep link URL parameters (iOS Shortcuts support)
  useDeepLink();

  // Onboarding state
  const { fetchSettings, isLoading, settings } = useSettingsStore();
  const isOnboardingComplete = useSettingsStore(selectIsOnboardingComplete);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // 계측 동의 반영 + 하루 1회 app_open (D1/D7 리텐션의 기준 이벤트). 동의 없으면 track은 아무것도 안 한다
  useEffect(() => {
    applyTelemetrySettings(settings);
    if (!settings?.isOnboardingComplete) return;
    const today = new Date().toDateString();
    if (lastAppOpenTracked === today) return;
    lastAppOpenTracked = today;
    track('app_open', { days_since_install: daysSinceInstall(settings.telemetryInstalledAt) });
  }, [settings]);

  // 반복 거래 도래분 자동 기록 (홈을 거치지 않고 어느 탭으로 진입해도 실행되도록 루트에서 처리)
  // 앱 시작 시 + 백그라운드에 머물다 날짜가 바뀐 뒤 돌아온 경우 재실행
  useEffect(() => {
    runRecurringProcessing();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshForDateChange();
        runRecurringProcessing();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Show splash screen while checking onboarding status
  if (isLoading && !settings) {
    return <SplashScreen />;
  }

  // Show onboarding if not complete
  if (!isOnboardingComplete) {
    return (
      <Suspense fallback={<SplashScreen />}>
        <OnboardingPage />
      </Suspense>
    );
  }

  return (
    <AppErrorBoundary>
    <CoachMarkProvider>
      <div className="flex flex-col h-full bg-paper-white text-ink-black">
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none">
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add" element={<AddPage />} />
            <Route path="/transaction/:id" element={<TransactionDetailPage />} />
            <Route path="/transaction/:id/edit" element={<EditTransactionPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/categories" element={<CategoryManagePage />} />
            <Route path="/settings/categories/new" element={<CategoryEditPage />} />
            <Route path="/settings/categories/:id/edit" element={<CategoryEditPage />} />
            <Route path="/settings/methods" element={<MethodManagePage />} />
            <Route path="/settings/payment-methods" element={<PaymentMethodManagePage />} />
            <Route path="/settings/payment-methods/new" element={<PaymentMethodEditPage />} />
            <Route path="/settings/payment-methods/:id/edit" element={<PaymentMethodEditPage />} />
            <Route path="/settings/income-sources" element={<IncomeSourceManagePage />} />
            <Route path="/settings/income-sources/new" element={<IncomeSourceEditPage />} />
            <Route path="/settings/income-sources/:id/edit" element={<IncomeSourceEditPage />} />
            <Route path="/settings/budget-wizard" element={<BudgetWizardPage />} />
            <Route path="/settings/category-budget" element={<CategoryBudgetPage />} />
            <Route path="/settings/annual-expenses" element={<AnnualExpensesPage />} />
            <Route path="/settings/import" element={<ImportDataPage />} />
            <Route path="/settings/export" element={<ExportDataPage />} />
            <Route path="/settings/recurring" element={<RecurringTransactionPage />} />
            <Route path="/settings/recurring/new" element={<RecurringTransactionEditPage />} />
            <Route path="/settings/recurring/:id/edit" element={<RecurringTransactionEditPage />} />
            <Route path="/settings/insights" element={<InsightSettingsPage />} />
            <Route path="/settings/category-alerts" element={<CategoryAlertSettingsPage />} />
            <Route path="/settings/budget-alerts" element={<BudgetAlertSettingsPage />} />
            <Route path="/settings/recurring-alerts" element={<RecurringAlertSettingsPage />} />
            <Route path="/settings/payment-method-alerts" element={<PaymentMethodAlertSettingsPage />} />
            <Route path="/review" element={<MonthlyReviewPage />} />
          </Routes>
          </Suspense>
        </main>
        <TabBar />
        <ToastContainer />
      </div>
    </CoachMarkProvider>
    </AppErrorBoundary>
  );
}
