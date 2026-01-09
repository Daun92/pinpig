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
import { AnnualExpensesPage } from '@/pages/AnnualExpensesPage';
import { MonthlyReviewPage } from '@/pages/MonthlyReviewPage';
import { ImportDataPage } from '@/pages/ImportDataPage';
import { ExportDataPage } from '@/pages/ExportDataPage';
import { RecurringTransactionPage } from '@/pages/RecurringTransactionPage';
import { RecurringTransactionEditPage } from '@/pages/RecurringTransactionEditPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { TabBar } from '@/components/layout/TabBar';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { CoachMarkProvider } from '@/components/coachmark';
import { useTheme } from '@/hooks/useTheme';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { useDeepLink } from '@/hooks/useDeepLink';
import { useSettingsStore, selectIsOnboardingComplete } from '@/stores/settingsStore';

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
            <Route path="/settings/annual-expenses" element={<AnnualExpensesPage />} />
            <Route path="/settings/import" element={<ImportDataPage />} />
            <Route path="/settings/export" element={<ExportDataPage />} />
            <Route path="/settings/recurring" element={<RecurringTransactionPage />} />
            <Route path="/settings/recurring/new" element={<RecurringTransactionEditPage />} />
            <Route path="/settings/recurring/:id/edit" element={<RecurringTransactionEditPage />} />
            <Route path="/review" element={<MonthlyReviewPage />} />
          </Routes>
        </main>
        <TabBar />
      </div>
    </CoachMarkProvider>
  );
}
