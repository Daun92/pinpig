import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { MonthlyTrend, AnnualTrend, CategoryTrend } from '@/types';
import {
  CHART_COLORS,
  CHART_DEFAULTS,
  formatYAxis,
  formatTooltipValue,
  formatMonth,
} from './chartConfig';
import type { TrendPeriod } from './TrendPeriodSelector';

interface CategoryLine {
  id: string;
  name: string;
  color: string;
  data: CategoryTrend[];
}

interface MultiCategoryTrendChartProps {
  period: TrendPeriod;
  monthlyData: MonthlyTrend[];
  annualData: AnnualTrend[];
  categoryLines: CategoryLine[];
  height?: number;
}

interface ChartDataPoint {
  name: string;
  total: number;
  [key: string]: number | string;
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
    name: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-paper-white border border-paper-mid rounded-sm p-3 shadow-sm min-w-32">
      <p className="text-sub text-ink-mid mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-caption text-ink-mid">{entry.name}</span>
          </div>
          <span className="text-sub text-ink-black">
            {formatTooltipValue(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MultiCategoryTrendChart({
  period,
  monthlyData,
  annualData,
  categoryLines,
  height = 220,
}: MultiCategoryTrendChartProps) {
  // Transform data based on period
  const chartData: ChartDataPoint[] = [];

  if (period === 'annual') {
    // Annual data
    for (const item of annualData) {
      const point: ChartDataPoint = {
        name: `${item.year}년`,
        total: item.expense,
      };
      chartData.push(point);
    }
  } else {
    // Monthly data
    for (const item of monthlyData) {
      const point: ChartDataPoint = {
        name: formatMonth(item.month),
        total: item.expense,
      };

      // Add category data if available
      for (const catLine of categoryLines) {
        const catData = catLine.data.find(
          (d) => d.year === item.year && d.month === item.month
        );
        point[catLine.id] = catData?.amount || 0;
      }

      chartData.push(point);
    }
  }

  if (!chartData.length) {
    return (
      <div
        className="flex items-center justify-center text-ink-light text-sub"
        style={{ height }}
      >
        추이 데이터가 없습니다
      </div>
    );
  }

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
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />

        {/* Total expense line (always shown) */}
        <Line
          type="monotone"
          dataKey="total"
          name="전체"
          stroke={CHART_COLORS.expense}
          strokeWidth={CHART_DEFAULTS.strokeWidth}
          dot={{ r: CHART_DEFAULTS.dotRadius, fill: CHART_COLORS.expense }}
          activeDot={{ r: CHART_DEFAULTS.activeDotRadius }}
          animationDuration={CHART_DEFAULTS.animationDuration}
        />

        {/* Category lines */}
        {period !== 'annual' &&
          categoryLines.map((catLine) => (
            <Line
              key={catLine.id}
              type="monotone"
              dataKey={catLine.id}
              name={catLine.name}
              stroke={catLine.color}
              strokeWidth={CHART_DEFAULTS.strokeWidth}
              strokeDasharray="4 2"
              dot={{ r: 3, fill: catLine.color }}
              activeDot={{ r: 5 }}
              animationDuration={CHART_DEFAULTS.animationDuration}
            />
          ))}

        {/* Legend if categories selected */}
        {categoryLines.length > 0 && period !== 'annual' && (
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="line"
            iconSize={12}
            wrapperStyle={{ fontSize: 11 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
