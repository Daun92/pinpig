import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyTrend } from '@/types';
import {
  CHART_COLORS,
  CHART_DEFAULTS,
  formatYAxis,
  formatTooltipValue,
  formatMonth,
} from './chartConfig';

interface MonthlyTrendChartProps {
  data: MonthlyTrend[];
  height?: number;
  showIncome?: boolean;
}

interface ChartDataPoint {
  name: string;
  expense: number;
  income: number;
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="bg-paper-white border border-paper-mid rounded-sm p-2 shadow-sm"
      style={{ minWidth: '100px' }}
    >
      <p className="text-sub text-ink-mid mb-1">{label}</p>
      {payload.map((item, index) => (
        <p
          key={index}
          className="text-body"
          style={{ color: item.color }}
        >
          {item.dataKey === 'expense' ? '지출' : '수입'}: {formatTooltipValue(item.value)}
        </p>
      ))}
    </div>
  );
}

export function MonthlyTrendChart({
  data,
  height = 200,
  showIncome = false,
}: MonthlyTrendChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-ink-light text-sub"
        style={{ height }}
      >
        추이 데이터가 없습니다
      </div>
    );
  }

  // Transform data for chart
  const chartData: ChartDataPoint[] = data.map((item) => ({
    name: formatMonth(item.month),
    expense: item.expense,
    income: item.income,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
      >
        <CartesianGrid
          strokeDasharray={CHART_DEFAULTS.gridStrokeDasharray}
          stroke={CHART_COLORS.grid}
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
          tickFormatter={formatYAxis}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />

        {/* Expense line */}
        <Line
          type="monotone"
          dataKey="expense"
          stroke={CHART_COLORS.expense}
          strokeWidth={CHART_DEFAULTS.strokeWidth}
          dot={{ r: CHART_DEFAULTS.dotRadius, fill: CHART_COLORS.expense }}
          activeDot={{ r: CHART_DEFAULTS.activeDotRadius }}
          animationDuration={CHART_DEFAULTS.animationDuration}
        />

        {/* Income line (optional) */}
        {showIncome && (
          <Line
            type="monotone"
            dataKey="income"
            stroke={CHART_COLORS.income}
            strokeWidth={CHART_DEFAULTS.strokeWidth}
            dot={{ r: CHART_DEFAULTS.dotRadius, fill: CHART_COLORS.income }}
            activeDot={{ r: CHART_DEFAULTS.activeDotRadius }}
            animationDuration={CHART_DEFAULTS.animationDuration}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
