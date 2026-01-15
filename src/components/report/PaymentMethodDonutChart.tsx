import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { PaymentMethodSummary } from '@/types';

interface PaymentMethodDonutChartProps {
  data: PaymentMethodSummary[];
  totalAmount: number;
  height?: number;
}

// 천원 단위 포맷
function formatThousandWon(amount: number): string {
  const thousand = Math.round(amount / 1000);
  return thousand.toLocaleString();
}

// 다크모드 감지 함수 (앱 설정 기준)
function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}

// 커스텀 라벨 렌더러 (안내선 + 라벨)
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  name,
  percent,
  fill,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  name: string;
  percent: number;
  fill: string;
}) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 10;
  const labelRadius = outerRadius + 30;

  // 안내선 시작점 (파이 가장자리)
  const sx = cx + radius * Math.cos(-midAngle * RADIAN);
  const sy = cy + radius * Math.sin(-midAngle * RADIAN);

  // 라벨 위치
  const lx = cx + labelRadius * Math.cos(-midAngle * RADIAN);
  const ly = cy + labelRadius * Math.sin(-midAngle * RADIAN);

  // 텍스트 정렬 방향
  const textAnchor = lx > cx ? 'start' : 'end';

  // 퍼센트가 5% 미만이면 라벨 생략 (겹침 방지)
  if (percent < 0.05) return null;

  // 다크모드에 따른 텍스트 색상
  const textColor = isDarkMode() ? '#FFFCF5' : '#3D3A36';

  return (
    <g>
      {/* 안내선 */}
      <path
        d={`M${sx},${sy}L${lx},${ly}`}
        stroke={fill}
        strokeWidth={1}
        fill="none"
        opacity={0.6}
      />
      {/* 라벨 (수단명 + 퍼센트) */}
      <text
        x={lx + (textAnchor === 'start' ? 4 : -4)}
        y={ly}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={11}
        fill={textColor}
      >
        {name} {Math.round(percent * 100)}%
      </text>
    </g>
  );
};

// 상위 4개 + 기타 그룹핑
function groupPaymentMethods(methods: PaymentMethodSummary[]): PaymentMethodSummary[] {
  if (methods.length <= 5) {
    return methods;
  }

  const top4 = methods.slice(0, 4);
  const others = methods.slice(4);

  const otherAmount = others.reduce((sum, m) => sum + m.amount, 0);
  const otherPercentage = others.reduce((sum, m) => sum + m.percentage, 0);
  const otherCount = others.reduce((sum, m) => sum + m.count, 0);

  // Get computed ink-light color for dark mode support
  const computedInkLight = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-ink-light').trim() || '#9C9A96';

  const otherMethod: PaymentMethodSummary = {
    paymentMethodId: 'other',
    paymentMethodName: '기타',
    paymentMethodIcon: 'MoreHorizontal',
    paymentMethodColor: computedInkLight,
    amount: otherAmount,
    percentage: otherPercentage,
    count: otherCount,
  };

  return [...top4, otherMethod];
}

export function PaymentMethodDonutChart({
  data,
  totalAmount,
  height = 280,
}: PaymentMethodDonutChartProps) {
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

  const groupedData = groupPaymentMethods(data);

  // 차트 데이터 변환
  const chartData = groupedData.map((item) => ({
    name: item.paymentMethodName,
    value: item.amount,
    color: item.paymentMethodColor,
    percentage: item.percentage,
  }));

  // 파이 차트 크기 계산 (라벨 공간 확보)
  const chartHeight = height;
  const margin = 55; // 상하좌우 라벨 영역
  const availableSize = Math.min(chartHeight - margin * 2, 200);
  const outerR = availableSize / 2 - 10;
  const innerR = outerR - 15;

  return (
    <div className="relative" style={{ height: chartHeight, overflow: 'visible' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart style={{ overflow: 'visible' }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerR}
            outerRadius={outerR}
            paddingAngle={2}
            dataKey="value"
            animationDuration={300}
            label={renderCustomLabel}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* 중앙 총액 표시 (천원 단위) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-amount text-ink-black dark:text-paper-white">
            {formatThousandWon(totalAmount)}
          </p>
          <p className="text-caption text-ink-mid dark:text-paper-mid">(천원)</p>
        </div>
      </div>
    </div>
  );
}
