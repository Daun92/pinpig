/**
 * budgetStatus.ts - 예산 상태 계산 유틸리티
 *
 * 예산 대비 사용률에 따른 상태 레벨 및 메시지 생성
 * 앱 톤: 판단 없는 중립적 표현
 */

export type BudgetLevel = 'normal' | 'caution' | 'warning' | 'danger';

export interface BudgetThresholds {
  caution: number; // 기본 50
  warning: number; // 기본 80
  danger: number; // 기본 100
}

const DEFAULT_THRESHOLDS: BudgetThresholds = {
  caution: 50,
  warning: 80,
  danger: 100,
};

/**
 * 사용률에 따른 예산 상태 레벨 반환
 */
export function getBudgetLevel(
  percentUsed: number,
  thresholds: BudgetThresholds = DEFAULT_THRESHOLDS
): BudgetLevel {
  if (percentUsed >= thresholds.danger) return 'danger';
  if (percentUsed >= thresholds.warning) return 'warning';
  if (percentUsed >= thresholds.caution) return 'caution';
  return 'normal';
}

/**
 * 예산 레벨에 따른 Tailwind 색상 클래스 반환
 * 배경색이 아닌 텍스트/아이콘용
 */
export function getBudgetLevelColor(level: BudgetLevel): string {
  switch (level) {
    case 'danger':
      return 'text-red-500';
    case 'warning':
      return 'text-amber-500';
    case 'caution':
      return 'text-yellow-600';
    case 'normal':
    default:
      return 'text-ink-mid';
  }
}

/**
 * 프로그레스 바 색상 (hex)
 * 기본: 카테고리/수단 고유색 사용
 * 100% 초과 시: 빨간색
 */
export function getProgressBarColor(
  percentUsed: number,
  defaultColor: string
): string {
  if (percentUsed >= 100) {
    return '#EF4444'; // red-500
  }
  return defaultColor;
}

/**
 * 예산 상태에 따른 메시지 생성 (중립적 톤)
 */
export function getBudgetMessage(
  percentUsed: number,
  context: 'category' | 'paymentMethod' | 'total'
): string {
  const level = getBudgetLevel(percentUsed);

  if (context === 'category') {
    switch (level) {
      case 'danger':
        return '예산을 넘었어요';
      case 'warning':
        return '예산이 얼마 남지 않았어요';
      case 'caution':
        return '예산의 절반을 썼어요';
      case 'normal':
      default:
        return '여유 있게 사용하고 있어요';
    }
  }

  if (context === 'paymentMethod') {
    switch (level) {
      case 'danger':
        return '한도를 넘었어요';
      case 'warning':
        return '한도가 얼마 남지 않았어요';
      case 'caution':
        return '한도의 절반을 썼어요';
      case 'normal':
      default:
        return '여유 있게 사용하고 있어요';
    }
  }

  // total (전체 예산)
  switch (level) {
    case 'danger':
      return '이번 달 예산을 모두 사용했어요';
    case 'warning':
      return '예산이 얼마 남지 않았어요';
    case 'caution':
      return '예산의 절반을 사용했어요';
    case 'normal':
    default:
      return '여유 있게 사용하고 있어요';
  }
}

/**
 * 예산 대비 남은 금액 포맷
 */
export function formatBudgetRemaining(budget: number, spent: number): string {
  const remaining = budget - spent;
  if (remaining >= 0) {
    return `${remaining.toLocaleString()}원 남음`;
  }
  return `${Math.abs(remaining).toLocaleString()}원 초과`;
}

/**
 * 예산 대비 사용률 텍스트 (간결)
 */
export function formatBudgetPercent(percentUsed: number): string {
  return `예산의 ${Math.round(percentUsed)}%`;
}

/**
 * 한도 대비 사용률 텍스트 (간결)
 */
export function formatLimitPercent(percentUsed: number): string {
  return `한도의 ${Math.round(percentUsed)}%`;
}

/**
 * 예산 설정 여부 확인
 */
export function hasBudget(budget: number | undefined | null): boolean {
  return budget !== undefined && budget !== null && budget > 0;
}
