import { ReactNode } from 'react';

interface SegmentOption<T> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps<T> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex bg-paper-light rounded-md p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-sm text-body transition-all duration-200 ${
            value === option.value
              ? 'bg-paper-white text-ink-black shadow-sm'
              : 'text-ink-mid hover:text-ink-dark'
          }`}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
