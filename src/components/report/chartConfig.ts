// Chart configuration for PinPig design system

export const CHART_COLORS = {
  expense: '#1C1B1A',      // ink-black
  income: '#4A7C59',       // semantic-positive
  grid: '#ECEAE6',         // paper-mid
  axis: '#6B6966',         // ink-mid
  background: '#FAF9F7',   // paper-white
  tooltipBg: '#FAF9F7',    // paper-white
  tooltipBorder: '#ECEAE6', // paper-mid
};

export const CHART_DEFAULTS = {
  strokeWidth: 2,
  dotRadius: 4,
  activeDotRadius: 6,
  gridStrokeDasharray: '3 3',
  animationDuration: 300,
};

// Format amount for Y-axis (만원 단위)
export const formatYAxis = (value: number): string => {
  if (value >= 10000) {
    return `${Math.round(value / 10000)}만`;
  }
  if (value >= 1000) {
    return `${Math.round(value / 1000)}천`;
  }
  return `${value}`;
};

// Format amount for tooltip (원 단위, 쉼표 포함)
export const formatTooltipValue = (value: number): string => {
  return `${value.toLocaleString()}원`;
};

// Format month label (N월)
export const formatMonth = (month: number): string => {
  return `${month}월`;
};
