/**
 * 금액을 한국 원화 형식으로 포맷팅
 * @example formatCurrency(847000) => "847,000원"
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * 수입 금액 포맷팅 (+ 기호 포함)
 * @example formatIncome(3000000) => "+ 3,000,000"
 */
export function formatIncome(amount: number): string {
  return `+ ${amount.toLocaleString('ko-KR')}`;
}

/**
 * 지출 금액 포맷팅 (기호 없음)
 * @example formatExpense(4500) => "4,500"
 */
export function formatExpense(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @example formatDate(new Date()) => "1월 7일 화요일"
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

/**
 * 날짜를 짧은 형식으로 포맷팅
 * @example formatDateShort(new Date()) => "1/7"
 */
export function formatDateShort(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * 시간 포맷팅
 * @example formatTime(new Date()) => "14:30"
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
