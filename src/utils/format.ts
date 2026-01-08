import { isToday, isYesterday, format } from 'date-fns';
import { ko } from 'date-fns/locale';

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

/**
 * 날짜를 상대적인 라벨로 변환
 * @example getDateLabel(today) => "오늘"
 * @example getDateLabel(yesterday) => "어제"
 * @example getDateLabel(someDate) => "7일 (화)"
 */
export function getDateLabel(date: Date): string {
  if (isToday(date)) return '오늘';
  if (isYesterday(date)) return '어제';
  return format(date, 'd일 (E)', { locale: ko });
}

/**
 * 월을 라벨로 변환 (올해면 월만, 다른 해면 연월)
 * @example getMonthLabel(2025, 0) => "1월" (현재 2025년)
 * @example getMonthLabel(2024, 11) => "2024년 12월" (현재 2025년)
 */
export function getMonthLabel(year: number, month: number): string {
  const currentYear = new Date().getFullYear();
  if (year === currentYear) {
    return `${month + 1}월`;
  }
  return `${year}년 ${month + 1}월`;
}
