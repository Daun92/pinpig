import { useEffect, useState } from 'react';

interface ChartIllustrationProps {
  className?: string;
}

export function ChartIllustration({ className = '' }: ChartIllustrationProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Donut chart segments
  const segments = [
    { color: '#FF6B6B', percent: 35, label: '식비' },
    { color: '#4ECDC4', percent: 20, label: '교통' },
    { color: '#45B7D1', percent: 25, label: '쇼핑' },
    { color: '#B8B8B8', percent: 20, label: '기타' },
  ];

  // Calculate cumulative offsets for donut
  let cumulativePercent = 0;
  const donutSegments = segments.map((seg) => {
    const offset = cumulativePercent;
    cumulativePercent += seg.percent;
    return { ...seg, offset };
  });

  // Trend line points
  const trendPoints = [30, 45, 35, 55, 50, 65];
  const maxY = 70;
  const pointsPath = trendPoints
    .map((y, i) => {
      const x = (i / (trendPoints.length - 1)) * 100;
      const yPos = 100 - (y / maxY) * 100;
      return `${i === 0 ? 'M' : 'L'} ${x} ${yPos}`;
    })
    .join(' ');

  return (
    <div className={`relative flex flex-col items-center gap-6 ${className}`}>
      {/* Donut Chart */}
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {donutSegments.map((seg, index) => (
            <circle
              key={index}
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={seg.color}
              strokeWidth="3"
              strokeDasharray={animate ? `${seg.percent} ${100 - seg.percent}` : '0 100'}
              strokeDashoffset={-seg.offset}
              className="transition-all duration-1000 ease-out"
              style={{ transitionDelay: `${index * 150}ms` }}
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-caption text-ink-light">이번 달</span>
          <span className="text-sub font-medium text-ink-black">지출</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.map((seg, index) => (
          <div
            key={index}
            className={`flex items-center gap-1 transition-opacity duration-500 ${
              animate ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDelay: `${500 + index * 100}ms` }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-caption text-ink-mid">{seg.label}</span>
            <span className="text-caption text-ink-black">{seg.percent}%</span>
          </div>
        ))}
      </div>

      {/* Mini Trend Chart */}
      <div className="w-full max-w-[200px]">
        <div className="text-caption text-ink-light text-center mb-2">월별 추이</div>
        <svg viewBox="0 0 100 50" className="w-full h-12">
          {/* Grid lines */}
          {[0, 25, 50].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="var(--color-paper-mid)"
              strokeWidth="0.5"
            />
          ))}
          {/* Trend line */}
          <path
            d={pointsPath}
            fill="none"
            stroke="var(--color-ink-black)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="200"
            strokeDashoffset={animate ? '0' : '200'}
            className="transition-all duration-1500 ease-out"
          />
          {/* Points */}
          {trendPoints.map((y, i) => {
            const x = (i / (trendPoints.length - 1)) * 100;
            const yPos = 100 - (y / maxY) * 100;
            return (
              <circle
                key={i}
                cx={x}
                cy={yPos}
                r="2"
                fill="var(--color-ink-black)"
                className={`transition-all duration-300 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
                style={{ transitionDelay: `${800 + i * 100}ms`, transformOrigin: `${x}px ${yPos}px` }}
              />
            );
          })}
        </svg>
        <div className="flex justify-between text-caption text-ink-light">
          <span>8월</span>
          <span>1월</span>
        </div>
      </div>
    </div>
  );
}
