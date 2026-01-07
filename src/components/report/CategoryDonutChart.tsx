import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { CategorySummary } from '@/types';

interface CategoryDonutChartProps {
  data: CategorySummary[];
  totalAmount: number;
  height?: number;
}

// 상위 4개 + 기타 그룹핑
function groupCategories(categories: CategorySummary[]): CategorySummary[] {
  if (categories.length <= 5) {
    return categories;
  }

  const top4 = categories.slice(0, 4);
  const others = categories.slice(4);

  const otherAmount = others.reduce((sum, c) => sum + c.amount, 0);
  const otherPercentage = others.reduce((sum, c) => sum + c.percentage, 0);
  const otherCount = others.reduce((sum, c) => sum + c.count, 0);

  const otherCategory: CategorySummary = {
    categoryId: 'other',
    categoryName: '기타',
    categoryIcon: 'MoreHorizontal',
    categoryColor: '#9C9A96', // ink-light
    amount: otherAmount,
    percentage: otherPercentage,
    count: otherCount,
  };

  return [...top4, otherCategory];
}

export function CategoryDonutChart({
  data,
  totalAmount,
  height = 200,
}: CategoryDonutChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-ink-light text-sub"
        style={{ height }}
      >
        지출 내역이 없습니다
      </div>
    );
  }

  const groupedData = groupCategories(data);

  // 차트 데이터 변환
  const chartData = groupedData.map((item) => ({
    name: item.categoryName,
    value: item.amount,
    color: item.categoryColor,
  }));

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            animationDuration={300}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* 중앙 총액 표시 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-amount text-ink-black">
            {totalAmount.toLocaleString()}
          </p>
          <p className="text-caption text-ink-mid">원</p>
        </div>
      </div>
    </div>
  );
}
