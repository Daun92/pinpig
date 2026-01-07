import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { AddPage } from '@/pages/AddPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { StatsPage } from '@/pages/StatsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { CategoryManagePage } from '@/pages/CategoryManagePage';
import { PaymentMethodManagePage } from '@/pages/PaymentMethodManagePage';
import { BudgetWizardPage } from '@/pages/BudgetWizardPage';
import { AnnualExpensesPage } from '@/pages/AnnualExpensesPage';
import { MonthlyReviewPage } from '@/pages/MonthlyReviewPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { TabBar } from '@/components/layout/TabBar';
import { getSettings } from '@/services/database';
import { checkBudgetAndNotify, getNotificationSettings } from '@/services/notifications';

export default function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const settings = await getSettings();
        setIsOnboardingComplete(settings?.isOnboardingComplete ?? false);
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        setIsOnboardingComplete(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, [location.pathname]);

  // 앱 시작 시 예산 알림 체크 (한 번만)
  useEffect(() => {
    const notificationSettings = getNotificationSettings();
    if (notificationSettings.budgetAlert) {
      checkBudgetAndNotify();
    }
  }, []);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink-light border-t-ink-black rounded-full animate-spin" />
      </div>
    );
  }

  // 온보딩 미완료 시 온보딩 페이지로
  if (!isOnboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // 온보딩 완료 후 온보딩 페이지 접근 시 홈으로
  if (isOnboardingComplete && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  // 온보딩 페이지는 TabBar 없이 렌더링
  if (location.pathname === '/onboarding') {
    return (
      <div className="min-h-screen bg-paper-white text-ink-black">
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-white text-ink-black">
      <main className="pb-20">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add" element={<AddPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/categories" element={<CategoryManagePage />} />
          <Route path="/settings/payment-methods" element={<PaymentMethodManagePage />} />
          <Route path="/settings/budget-wizard" element={<BudgetWizardPage />} />
          <Route path="/settings/annual-expenses" element={<AnnualExpensesPage />} />
          <Route path="/review" element={<MonthlyReviewPage />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}
