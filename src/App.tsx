import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { AddPage } from '@/pages/AddPage';
import { EditTransactionPage } from '@/pages/EditTransactionPage';
import { TransactionDetailPage } from '@/pages/TransactionDetailPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { StatsPage } from '@/pages/StatsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { CategoryManagePage } from '@/pages/CategoryManagePage';
import { CategoryEditPage } from '@/pages/CategoryEditPage';
import { PaymentMethodManagePage } from '@/pages/PaymentMethodManagePage';
import { PaymentMethodEditPage } from '@/pages/PaymentMethodEditPage';
import { IncomeSourceManagePage } from '@/pages/IncomeSourceManagePage';
import { IncomeSourceEditPage } from '@/pages/IncomeSourceEditPage';
import { MethodManagePage } from '@/pages/MethodManagePage';
import { BudgetWizardPage } from '@/pages/BudgetWizardPage';
import { CategoryBudgetPage } from '@/pages/CategoryBudgetPage';
import { AnnualExpensesPage } from '@/pages/AnnualExpensesPage';
import { MonthlyReviewPage } from '@/pages/MonthlyReviewPage';
import { ImportDataPage } from '@/pages/ImportDataPage';
import { ExportDataPage } from '@/pages/ExportDataPage';
import { RecurringTransactionPage } from '@/pages/RecurringTransactionPage';
import { RecurringTransactionEditPage } from '@/pages/RecurringTransactionEditPage';
import { InsightSettingsPage } from '@/pages/InsightSettingsPage';
import { CategoryAlertSettingsPage } from '@/pages/CategoryAlertSettingsPage';
import { BudgetAlertSettingsPage } from '@/pages/BudgetAlertSettingsPage';
import { RecurringAlertSettingsPage } from '@/pages/RecurringAlertSettingsPage';
import { PaymentMethodAlertSettingsPage } from '@/pages/PaymentMethodAlertSettingsPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
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

// 반복 거래 처리 가드: 날짜 키로 하루 1회 보장
// (PWA가 메모리에 며칠 유지돼도 날짜가 바뀌면 재실행, StrictMode 중복 실행 방지 겸용)
let lastRecurringProcessDate: string | null = null;

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

  // 반복 거래 도래분 자동 기록 (홈을 거치지 않고 어느 탭으로 진입해도 실행되도록 루트에서 처리)
  // 앱 시작 시 + 백그라운드에 머물다 날짜가 바뀐 뒤 돌아온 경우 재실행
  useEffect(() => {
    runRecurringProcessing();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
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
    return <OnboardingPage />;
  }

  return (
    <CoachMarkProvider>
      <div className="flex flex-col h-full bg-paper-white text-ink-black">
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none">
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
        </main>
        <TabBar />
        <ToastContainer />
      </div>
    </CoachMarkProvider>
  );
}
