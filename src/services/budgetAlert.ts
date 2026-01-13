/**
 * 예산 알림 서비스
 *
 * 예산 임계값 도달 및 카테고리 초과 시 알림을 트리거합니다.
 */

import { db } from './database';
import { getMonthlyBudgetStructure, getRecurringTransactions, getPaymentMethodBreakdown } from './queries';
import { useToastStore } from '@/stores/toastStore';
import { format, differenceInDays, startOfDay } from 'date-fns';
import type { Settings, BudgetStatus, CategoryAlertSetting, RecurringAlertSetting, RecurringTransaction, PaymentMethodAlertSetting } from '@/types';
import { DEFAULT_CATEGORY_ALERT_THRESHOLDS, DEFAULT_PAYMENT_METHOD_ALERT_THRESHOLDS } from '@/types';

// 예산 사용률에 따른 인사이트 메시지
export interface BudgetInsight {
  type: 'normal' | 'caution' | 'warning' | 'danger';
  message: string;
  subMessage?: string;
  percentUsed: number;
}

// 초과 카테고리 정보
export interface OverBudgetCategory {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;
  currentSpent: number;
  overAmount: number;
  percentUsed: number;
}

/**
 * 예산 상태에 따른 인사이트 메시지 생성
 */
export function getBudgetInsight(budgetStatus: BudgetStatus): BudgetInsight {
  const { percentUsed, remaining, remainingDays, dailyRecommended, monthlyBudget } = budgetStatus;

  // 예산이 설정되지 않은 경우
  if (monthlyBudget <= 0) {
    return {
      type: 'normal',
      message: '예산을 설정하면 관리가 쉬워져요',
      percentUsed: 0,
    };
  }

  // 초과 상태
  if (percentUsed >= 100) {
    const overAmount = Math.abs(remaining);
    return {
      type: 'danger',
      message: '이번 달 예산을 모두 사용했어요',
      subMessage: `${overAmount.toLocaleString()}원 초과`,
      percentUsed,
    };
  }

  // 80% 이상 (주의)
  if (percentUsed >= 80) {
    return {
      type: 'warning',
      message: '예산이 얼마 남지 않았어요',
      subMessage: `남은 예산: ${remaining.toLocaleString()}원 (${remainingDays}일)`,
      percentUsed,
    };
  }

  // 50% 이상 (관찰)
  if (percentUsed >= 50) {
    return {
      type: 'caution',
      message: '예산의 절반을 사용했어요',
      subMessage: `하루 ${dailyRecommended.toLocaleString()}원씩 쓸 수 있어요`,
      percentUsed,
    };
  }

  // 50% 미만 (정상)
  return {
    type: 'normal',
    message: '여유 있게 사용하고 있어요',
    subMessage: `하루 ${dailyRecommended.toLocaleString()}원씩 쓸 수 있어요`,
    percentUsed,
  };
}

/**
 * 예산을 초과한 카테고리 목록 조회
 */
export async function getOverBudgetCategories(
  year: number,
  month: number
): Promise<OverBudgetCategory[]> {
  try {
    const structure = await getMonthlyBudgetStructure(year, month);

    return structure.categoryBudgets
      .filter((cat) => cat.budgetAmount > 0 && cat.currentSpent > cat.budgetAmount)
      .map((cat) => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        categoryIcon: cat.categoryIcon,
        categoryColor: cat.categoryColor,
        budgetAmount: cat.budgetAmount,
        currentSpent: cat.currentSpent,
        overAmount: cat.currentSpent - cat.budgetAmount,
        percentUsed: cat.percentUsed,
      }));
  } catch (error) {
    console.error('Failed to get over budget categories:', error);
    return [];
  }
}

/**
 * 예산 알림 체크 및 토스트 표시
 *
 * @param budgetStatus 현재 예산 상태
 * @param settings 사용자 설정
 * @returns 알림 표시 여부
 */
export async function checkBudgetAlerts(
  budgetStatus: BudgetStatus,
  settings: Settings | null
): Promise<boolean> {
  if (!settings) return false;

  const {
    budgetAlertEnabled,
    budgetAlertThresholds,
    categoryAlertEnabled,
    lastAlertedThreshold,
    lastAlertedMonth,
  } = settings;

  // 알림이 비활성화된 경우
  if (!budgetAlertEnabled && !categoryAlertEnabled) {
    return false;
  }

  const { showToast } = useToastStore.getState();
  const currentMonth = format(new Date(), 'yyyy-MM');
  const { percentUsed, monthlyBudget } = budgetStatus;

  // 예산이 설정되지 않은 경우
  if (monthlyBudget <= 0) {
    return false;
  }

  let alertShown = false;

  // 1. 예산 임계값 알림 체크
  if (budgetAlertEnabled) {
    // 새 달이면 알림 기록 리셋 (월 1회 제한)
    const isNewMonth = lastAlertedMonth !== currentMonth;
    const effectiveLastThreshold = isNewMonth ? 0 : (lastAlertedThreshold || 0);

    // 임계값을 낮은 순으로 정렬하고 현재 도달한 임계값 찾기
    const sortedThresholds = [...budgetAlertThresholds].sort((a, b) => a - b);

    for (const threshold of sortedThresholds) {
      // 이미 알린 임계값보다 높고, 현재 도달한 임계값인 경우
      if (threshold > effectiveLastThreshold && percentUsed >= threshold) {
        // 알림 표시
        const insight = getBudgetInsight(budgetStatus);
        showToast({
          type: threshold >= 100 ? 'danger' : threshold >= 80 ? 'warning' : 'info',
          message: insight.message,
          subMessage: insight.subMessage,
        });

        // 설정 업데이트 (마지막 알림 기록)
        await db.settings.update('default', {
          lastAlertedThreshold: threshold,
          lastAlertedMonth: currentMonth,
          updatedAt: new Date(),
        });

        alertShown = true;
        break; // 가장 높은 도달 임계값만 알림
      }
    }
  }

  // 2. 카테고리 초과 알림 체크 (예산 알림과 별도)
  if (categoryAlertEnabled && !alertShown) {
    const now = new Date();
    const overCategories = await getOverBudgetCategories(
      now.getFullYear(),
      now.getMonth() + 1
    );

    if (overCategories.length > 0) {
      const firstOver = overCategories[0];
      showToast({
        type: 'warning',
        message: `${firstOver.categoryName} 예산을 초과했어요`,
        subMessage: `${firstOver.overAmount.toLocaleString()}원 초과`,
      });
      alertShown = true;
    }
  }

  return alertShown;
}

/**
 * 카테고리별 알림 설정 가져오기
 * 개별 설정이 없으면 기본값 반환
 */
function getCategoryAlertSetting(
  categoryId: string,
  settings: Settings
): CategoryAlertSetting {
  const categorySettings = settings.categoryAlertSettings || {};
  return categorySettings[categoryId] || {
    enabled: true,
    thresholds: [...DEFAULT_CATEGORY_ALERT_THRESHOLDS],
  };
}

/**
 * 거래 추가 후 예산 상태 체크 및 알림
 * (거래 추가 시 호출)
 */
export async function checkBudgetAfterTransaction(
  budgetStatus: BudgetStatus,
  settings: Settings | null,
  transactionAmount: number,
  categoryId: string
): Promise<void> {
  if (!settings) return;

  const { budgetAlertEnabled, categoryAlertEnabled } = settings;
  if (!budgetAlertEnabled && !categoryAlertEnabled) return;

  const { showToast } = useToastStore.getState();

  // 카테고리별 예산 알림 체크
  if (categoryAlertEnabled) {
    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');
    const structure = await getMonthlyBudgetStructure(
      now.getFullYear(),
      now.getMonth() + 1
    );

    const category = structure.categoryBudgets.find(
      (cat) => cat.categoryId === categoryId
    );

    // 카테고리 예산이 설정된 경우
    if (category && category.budgetAmount > 0) {
      // 개별 카테고리 알림 설정 확인
      const alertSetting = getCategoryAlertSetting(categoryId, settings);

      // 해당 카테고리 알림이 비활성화된 경우 스킵
      if (!alertSetting.enabled) {
        // 예산 임계값 체크로 이동
        await checkBudgetAlerts(budgetStatus, settings);
        return;
      }

      const prevSpent = category.currentSpent - transactionAmount;
      const prevPercent = (prevSpent / category.budgetAmount) * 100;
      const currentPercent = category.percentUsed;

      // 새 달이면 알림 기록 리셋
      const isNewMonth = alertSetting.lastAlertedMonth !== currentMonth;
      const lastThreshold = isNewMonth ? 0 : (alertSetting.lastAlertedThreshold || 0);

      // 설정된 임계값 중 새로 도달한 임계값 찾기
      const thresholds = alertSetting.thresholds.sort((a, b) => a - b);

      for (const threshold of thresholds) {
        // 이전에 이 임계값 이하였고, 지금 이 임계값 이상인 경우
        if (threshold > lastThreshold && prevPercent < threshold && currentPercent >= threshold) {
          // 알림 표시
          const toastType = threshold >= 100 ? 'danger' : threshold >= 80 ? 'warning' : 'info';
          const message = threshold >= 100
            ? `${category.categoryName} 예산을 초과했어요`
            : `${category.categoryName} 예산의 ${threshold}%를 사용했어요`;
          const subMessage = threshold >= 100
            ? `${(category.currentSpent - category.budgetAmount).toLocaleString()}원 초과`
            : `남은 예산: ${(category.budgetAmount - category.currentSpent).toLocaleString()}원`;

          showToast({ type: toastType, message, subMessage });

          // 설정 업데이트 (해당 카테고리의 마지막 알림 기록)
          const updatedCategorySetting: CategoryAlertSetting = {
            ...alertSetting,
            lastAlertedThreshold: threshold,
            lastAlertedMonth: currentMonth,
          };

          await db.settings.update('default', {
            categoryAlertSettings: {
              ...settings.categoryAlertSettings,
              [categoryId]: updatedCategorySetting,
            },
            updatedAt: new Date(),
          });

          return; // 가장 높은 도달 임계값만 알림
        }
      }
    }
  }

  // 예산 임계값 체크
  await checkBudgetAlerts(budgetStatus, settings);
}

/**
 * 반복 거래 알림 설정 가져오기
 * 개별 설정이 없으면 기본값 반환
 */
function getRecurringAlertSetting(
  recurringId: string,
  settings: Settings
): RecurringAlertSetting {
  const recurringSettings = settings.recurringAlertSettings || {};
  return recurringSettings[recurringId] || { enabled: true };
}

/**
 * 반복 거래 사전 알림 체크
 * 앱 시작 시 호출하여 예정된 반복 거래를 알림
 */
export async function checkRecurringAlerts(
  settings: Settings | null
): Promise<boolean> {
  if (!settings) return false;

  const { recurringAlertEnabled, recurringAlertDaysBefore } = settings;

  // 마스터 토글이 비활성화된 경우
  if (!recurringAlertEnabled) {
    return false;
  }

  const { showToast } = useToastStore.getState();
  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');

  try {
    // 활성화된 반복 거래 목록 조회
    const recurringList = await getRecurringTransactions();
    const activeList = recurringList.filter((rt: RecurringTransaction) => rt.isActive);

    if (activeList.length === 0) {
      return false;
    }

    // 알림 대상 반복 거래 수집
    const upcomingAlerts: { rt: RecurringTransaction; daysUntil: number }[] = [];

    for (const rt of activeList) {
      // 개별 설정 확인
      const alertSetting = getRecurringAlertSetting(rt.id, settings);

      // 해당 반복 거래 알림이 비활성화된 경우 스킵
      if (!alertSetting.enabled) {
        continue;
      }

      // 실제 알림 일수 (개별 설정 > 전역 설정)
      const effectiveDaysBefore = alertSetting.daysBefore !== undefined
        ? alertSetting.daysBefore
        : recurringAlertDaysBefore;

      const nextExecution = startOfDay(new Date(rt.nextExecutionDate));
      const daysUntil = differenceInDays(nextExecution, today);

      // 이미 지난 날짜이거나 알림 범위를 벗어난 경우 스킵
      if (daysUntil < 0 || daysUntil > effectiveDaysBefore) {
        continue;
      }

      // 오늘 이미 알린 경우 스킵
      if (alertSetting.lastAlertedDate === todayStr) {
        continue;
      }

      upcomingAlerts.push({ rt, daysUntil });
    }

    // 알림 대상이 없으면 종료
    if (upcomingAlerts.length === 0) {
      return false;
    }

    // 가장 빨리 실행될 반복 거래부터 정렬
    upcomingAlerts.sort((a, b) => a.daysUntil - b.daysUntil);

    // 첫 번째 알림만 표시 (너무 많은 알림 방지)
    const first = upcomingAlerts[0];
    const { rt, daysUntil } = first;

    // 메시지 생성
    let message: string;
    let subMessage: string;

    if (daysUntil === 0) {
      message = '오늘 예정된 반복 거래가 있어요';
      subMessage = rt.memo || `${rt.amount.toLocaleString()}원 ${rt.type === 'income' ? '수입' : '지출'}`;
    } else if (daysUntil === 1) {
      message = '내일 예정된 반복 거래가 있어요';
      subMessage = rt.memo || `${rt.amount.toLocaleString()}원 ${rt.type === 'income' ? '수입' : '지출'}`;
    } else {
      message = `${daysUntil}일 후 반복 거래가 있어요`;
      subMessage = rt.memo || `${rt.amount.toLocaleString()}원 ${rt.type === 'income' ? '수입' : '지출'}`;
    }

    // 알림 표시
    showToast({
      type: daysUntil === 0 ? 'info' : 'info',
      message,
      subMessage,
    });

    // 알린 반복 거래의 lastAlertedDate 업데이트
    const updatedRecurringSetting: RecurringAlertSetting = {
      ...getRecurringAlertSetting(rt.id, settings),
      lastAlertedDate: todayStr,
    };

    await db.settings.update('default', {
      recurringAlertSettings: {
        ...settings.recurringAlertSettings,
        [rt.id]: updatedRecurringSetting,
      },
      updatedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Failed to check recurring alerts:', error);
    return false;
  }
}

/**
 * 결제수단별 알림 설정 가져오기
 * 개별 설정이 없으면 기본값 반환
 */
function getPaymentMethodAlertSetting(
  paymentMethodId: string,
  settings: Settings
): PaymentMethodAlertSetting {
  const methodSettings = settings.paymentMethodAlertSettings || {};
  return methodSettings[paymentMethodId] || {
    enabled: true,
    thresholds: [...DEFAULT_PAYMENT_METHOD_ALERT_THRESHOLDS],
  };
}

/**
 * 결제수단별 예산 알림 체크
 * 앱 시작 시 또는 거래 추가 후 호출
 */
export async function checkPaymentMethodAlerts(
  settings: Settings | null
): Promise<boolean> {
  if (!settings) return false;

  const { paymentMethodAlertEnabled } = settings;

  // 마스터 토글이 비활성화된 경우
  if (!paymentMethodAlertEnabled) {
    return false;
  }

  const { showToast } = useToastStore.getState();
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');

  try {
    // 이번 달 결제수단별 지출 조회
    const methodBreakdown = await getPaymentMethodBreakdown(
      now.getFullYear(),
      now.getMonth() + 1,
      'expense'
    );

    // 예산이 설정된 결제수단만 필터링
    const methodsWithBudget = methodBreakdown.filter(
      (m) => m.budget && m.budget > 0
    );

    if (methodsWithBudget.length === 0) {
      return false;
    }

    // 알림 대상 확인
    for (const method of methodsWithBudget) {
      // 개별 설정 확인
      const alertSetting = getPaymentMethodAlertSetting(method.paymentMethodId, settings);

      // 해당 결제수단 알림이 비활성화된 경우 스킵
      if (!alertSetting.enabled) {
        continue;
      }

      const percentUsed = method.budgetPercent || 0;

      // 새 달이면 알림 기록 리셋
      const isNewMonth = alertSetting.lastAlertedMonth !== currentMonth;
      const lastThreshold = isNewMonth ? 0 : (alertSetting.lastAlertedThreshold || 0);

      // 설정된 임계값 중 새로 도달한 임계값 찾기
      const thresholds = alertSetting.thresholds.sort((a, b) => a - b);

      for (const threshold of thresholds) {
        // 이 임계값을 넘었고 아직 알리지 않은 경우
        if (threshold > lastThreshold && percentUsed >= threshold) {
          // 알림 표시
          const toastType = threshold >= 100 ? 'danger' : threshold >= 80 ? 'warning' : 'info';
          const message = threshold >= 100
            ? `${method.paymentMethodName} 예산을 초과했어요`
            : `${method.paymentMethodName} 예산의 ${threshold}%를 사용했어요`;
          const overAmount = method.amount - (method.budget || 0);
          const subMessage = threshold >= 100
            ? `${overAmount.toLocaleString()}원 초과`
            : `남은 예산: ${((method.budget || 0) - method.amount).toLocaleString()}원`;

          showToast({ type: toastType, message, subMessage });

          // 설정 업데이트 (해당 결제수단의 마지막 알림 기록)
          const updatedMethodSetting: PaymentMethodAlertSetting = {
            ...alertSetting,
            lastAlertedThreshold: threshold,
            lastAlertedMonth: currentMonth,
          };

          await db.settings.update('default', {
            paymentMethodAlertSettings: {
              ...settings.paymentMethodAlertSettings,
              [method.paymentMethodId]: updatedMethodSetting,
            },
            updatedAt: new Date(),
          });

          return true; // 하나만 알림
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Failed to check payment method alerts:', error);
    return false;
  }
}

/**
 * 거래 추가 후 결제수단 예산 체크 및 알림
 */
export async function checkPaymentMethodAfterTransaction(
  settings: Settings | null,
  transactionAmount: number,
  paymentMethodId: string | undefined
): Promise<void> {
  if (!settings || !paymentMethodId) return;

  const { paymentMethodAlertEnabled } = settings;
  if (!paymentMethodAlertEnabled) return;

  // 개별 설정 확인
  const alertSetting = getPaymentMethodAlertSetting(paymentMethodId, settings);
  if (!alertSetting.enabled) return;

  const { showToast } = useToastStore.getState();
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');

  // 해당 결제수단의 이번 달 지출 조회
  const methodBreakdown = await getPaymentMethodBreakdown(
    now.getFullYear(),
    now.getMonth() + 1,
    'expense'
  );

  const method = methodBreakdown.find((m) => m.paymentMethodId === paymentMethodId);
  if (!method || !method.budget || method.budget <= 0) return;

  const prevAmount = method.amount - transactionAmount;
  const prevPercent = (prevAmount / method.budget) * 100;
  const currentPercent = method.budgetPercent || 0;

  // 새 달이면 알림 기록 리셋
  const isNewMonth = alertSetting.lastAlertedMonth !== currentMonth;
  const lastThreshold = isNewMonth ? 0 : (alertSetting.lastAlertedThreshold || 0);

  // 설정된 임계값 중 새로 도달한 임계값 찾기
  const thresholds = alertSetting.thresholds.sort((a, b) => a - b);

  for (const threshold of thresholds) {
    // 이전에 이 임계값 이하였고, 지금 이 임계값 이상인 경우
    if (threshold > lastThreshold && prevPercent < threshold && currentPercent >= threshold) {
      // 알림 표시
      const toastType = threshold >= 100 ? 'danger' : threshold >= 80 ? 'warning' : 'info';
      const message = threshold >= 100
        ? `${method.paymentMethodName} 예산을 초과했어요`
        : `${method.paymentMethodName} 예산의 ${threshold}%를 사용했어요`;
      const subMessage = threshold >= 100
        ? `${(method.amount - method.budget).toLocaleString()}원 초과`
        : `남은 예산: ${(method.budget - method.amount).toLocaleString()}원`;

      showToast({ type: toastType, message, subMessage });

      // 설정 업데이트 (해당 결제수단의 마지막 알림 기록)
      const updatedMethodSetting: PaymentMethodAlertSetting = {
        ...alertSetting,
        lastAlertedThreshold: threshold,
        lastAlertedMonth: currentMonth,
      };

      await db.settings.update('default', {
        paymentMethodAlertSettings: {
          ...settings.paymentMethodAlertSettings,
          [paymentMethodId]: updatedMethodSetting,
        },
        updatedAt: new Date(),
      });

      return; // 가장 높은 도달 임계값만 알림
    }
  }
}
