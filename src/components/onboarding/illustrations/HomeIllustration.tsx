import { useEffect, useState } from 'react';

interface HomeIllustrationProps {
  className?: string;
}

export function HomeIllustration({ className = '' }: HomeIllustrationProps) {
  const [displayAmount, setDisplayAmount] = useState(0);
  const targetAmount = 847000;

  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const increment = targetAmount / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), targetAmount);
      setDisplayAmount(current);
      if (step >= steps) {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Mock phone frame */}
      <div className="w-48 h-80 bg-paper-light rounded-3xl border-4 border-ink-black/10 shadow-lg overflow-hidden">
        {/* Status bar */}
        <div className="h-6 bg-paper-mid flex items-center justify-center">
          <div className="w-16 h-1 bg-ink-light rounded-full" />
        </div>

        {/* Content */}
        <div className="p-4 pt-6">
          {/* Month label */}
          <div className="text-caption text-ink-light text-center mb-1">1월</div>

          {/* Hero amount */}
          <div className="text-center mb-4">
            <div
              className="text-2xl font-light text-ink-black animate-count-up"
              style={{ animationDelay: '0.3s' }}
            >
              {formatCurrency(displayAmount)}
            </div>
            <div className="text-caption text-ink-light mt-1">남은 예산</div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-2 bg-paper-mid rounded-full overflow-hidden">
              <div
                className="h-full bg-ink-black transition-all duration-1000"
                style={{ width: '42%' }}
              />
            </div>
            <div className="flex justify-between mt-1 text-caption text-ink-light">
              <span>42% 사용</span>
              <span>15일 남음</span>
            </div>
          </div>

          {/* Daily recommended */}
          <div className="bg-paper-white rounded-lg p-3 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-sub text-ink-mid">하루 권장</span>
              <span className="text-body font-medium text-ink-black">56,467원</span>
            </div>
          </div>

          {/* Placeholder transactions */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FF6B6B]/20" />
              <div className="flex-1">
                <div className="h-2 bg-paper-mid rounded w-16" />
                <div className="h-2 bg-paper-mid rounded w-10 mt-1" />
              </div>
              <div className="h-2 bg-paper-mid rounded w-12" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#4ECDC4]/20" />
              <div className="flex-1">
                <div className="h-2 bg-paper-mid rounded w-14" />
                <div className="h-2 bg-paper-mid rounded w-8 mt-1" />
              </div>
              <div className="h-2 bg-paper-mid rounded w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-semantic-positive rounded-full animate-pulse-subtle" />
      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-ink-light rounded-full animate-pulse-subtle" style={{ animationDelay: '0.5s' }} />
    </div>
  );
}
