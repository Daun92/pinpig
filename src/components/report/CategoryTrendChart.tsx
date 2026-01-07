import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CategoryTrend } from '@/types';
import {
  CHART_COLORS,
  CHART_DEFAULTS,
  formatYAxis,
  formatTooltipValue,
  formatMonth,
} from './chartConfig';

interface CategoryTrendChartProps {
  data: CategoryTrend[];
  height?: number;
}

interface ChartDataPoint {
  name: string;
  amount: number;
  count: number;
}

// Custom tooltip for category trend
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; payload: ChartDataPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const dataPoint = payload[0].payload;

  return (
    <div
      className="bg-paper-white border border-paper-mid rounded-sm p-2 shadow-sm"
      style={{ minWidth: '100px' }}
    >
      <p className="text-sub text-ink-mid mb-1">{label}</p>
      <p className="text-body text-ink-black">
        {formatTooltipValue(dataPoint.amount)}
      </p>
      <p className="text-caption text-ink-light">
        {dataPoint.count}건
      </p>
    </div>
  );
}

export function CategoryTrendChart({
  data,
  height = 160,
}: CategoryTrendChartProps) {
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

  // Get category color from first data point
  const categoryColor = data[0]?.categoryColor || CHART_COLORS.expense;

  // Transform data for chart
  const chartData: ChartDataPoint[] = data.map((item) => ({
    name: formatMonth(item.month),
    amount: item.amount,
    count: item.transactionCount,
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

        <Line
          type="monotone"
          dataKey="amount"
          stroke={categoryColor}
          strokeWidth={CHART_DEFAULTS.strokeWidth}
          dot={{ r: CHART_DEFAULTS.dotRadius, fill: categoryColor }}
          activeDot={{ r: CHART_DEFAULTS.activeDotRadius }}
          animationDuration={CHART_DEFAULTS.animationDuration}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
