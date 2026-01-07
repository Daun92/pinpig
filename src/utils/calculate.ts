import type { BudgetStatus } from '@/types';

/**
 * Calculate budget period based on payday
 * If payday is 25th, budget period is 25th to 24th of next month
 */
export function getBudgetPeriod(
  referenceDate: Date,
  payday: number
): { start: Date; end: Date } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let start: Date;
  let end: Date;

  if (day >= payday) {
    // Current period started this month
    start = new Date(year, month, payday);
    end = new Date(year, month + 1, payday - 1, 23, 59, 59);
  } else {
    // Current period started last month
    start = new Date(year, month - 1, payday);
    end = new Date(year, month, payday - 1, 23, 59, 59);
  }

  return { start, end };
}

/**
 * Calculate remaining budget status
 */
export function calculateBudgetStatus(
  monthlyBudget: number,
  totalExpense: number,
  remainingDays: number
): Pick<BudgetStatus, 'remaining' | 'dailyRecommended' | 'percentUsed' | 'isOverBudget'> {
  const remaining = monthlyBudget - totalExpense;
  const dailyRecommended = remaining > 0 ? Math.round(remaining / remainingDays) : 0;
  const percentUsed =
    monthlyBudget > 0 ? Math.round((totalExpense / monthlyBudget) * 1000) / 10 : 0;

  return {
    remaining,
    dailyRecommended,
    percentUsed,
    isOverBudget: remaining < 0,
  };
}

/**
 * Calculate month-over-month change percentage
 */
export function calculateMoMChange(currentAmount: number, previousAmount: number): number {
  if (previousAmount === 0) return currentAmount > 0 ? 100 : 0;
  return Math.round(((currentAmount - previousAmount) / previousAmount) * 1000) / 10;
}

/**
 * Get default category ID based on time of day (UX feature)
 * Returns category type hint, not actual ID
 */
export function getDefaultCategoryByTime(hour: number): string {
  if (hour >= 7 && hour < 10) return 'transport'; // Morning commute
  if (hour >= 11 && hour < 14) return 'food'; // Lunch
  if (hour >= 18 && hour < 21) return 'food'; // Dinner
  if (hour >= 21 || hour < 2) return 'entertainment'; // Night life
  return 'etc';
}

/**
 * Get current time in HH:mm format
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Validate amount (must be positive)
 */
export function isValidAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0;
}

/**
 * Validate day of month (1-31)
 */
export function isValidDayOfMonth(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}
