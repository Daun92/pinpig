export type TrendPeriod = '6months' | '12months' | 'annual';

interface TrendPeriodSelectorProps {
  value: TrendPeriod;
  onChange: (period: TrendPeriod) => void;
}

const PERIODS: { value: TrendPeriod; label: string }[] = [
  { value: '6months', label: '6개월' },
  { value: '12months', label: '12개월' },
  { value: 'annual', label: '연간' },
];

export function TrendPeriodSelector({
  value,
  onChange,
}: TrendPeriodSelectorProps) {
  return (
    <div className="flex gap-2">
      {PERIODS.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-3 py-1.5 text-sub rounded-sm transition-colors ${
            value === period.value
              ? 'bg-ink-black text-paper-white'
              : 'bg-paper-light text-ink-mid hover:bg-paper-mid'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
