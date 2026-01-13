import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import type { TourConfig } from './tourConfigs';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface CoachMarkOverlayProps {
  tour: TourConfig;
  onComplete: () => void;
  onSkip: () => void;
}

export function CoachMarkOverlay({ tour, onComplete, onSkip }: CoachMarkOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentMark = tour.marks[currentIndex];
  const isLastMark = currentIndex === tour.marks.length - 1;

  // Scroll target into view if needed
  const scrollTargetIntoView = useCallback((target: Element) => {
    const rect = target.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const headerOffset = 120; // Account for sticky headers
    const bottomPadding = 200; // Space for tooltip below

    // Check if element is outside visible area
    const isAboveViewport = rect.top < headerOffset;
    const isBelowViewport = rect.bottom > viewportHeight - bottomPadding;

    if (isAboveViewport || isBelowViewport) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, []);

  const updateTargetRect = useCallback(() => {
    if (!currentMark) return;

    const target = document.querySelector(currentMark.targetSelector);
    if (target) {
      const rect = target.getBoundingClientRect();
      const padding = currentMark.spotlightPadding ?? 8;
      setTargetRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    } else {
      setTargetRect(null);
    }
  }, [currentMark]);

  // Scroll to target and update rect when step changes
  useEffect(() => {
    if (!currentMark) return;

    const target = document.querySelector(currentMark.targetSelector);
    if (target) {
      // First scroll into view
      scrollTargetIntoView(target);

      // Then update rect after scroll animation
      const scrollTimer = setTimeout(() => {
        updateTargetRect();
      }, 350); // Wait for scroll animation

      return () => clearTimeout(scrollTimer);
    } else {
      updateTargetRect();
    }
  }, [currentMark, scrollTargetIntoView, updateTargetRect]);

  useEffect(() => {
    // Update on resize/scroll
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [updateTargetRect]);

  useEffect(() => {
    // Animation timing
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (isLastMark) {
      onComplete();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const tooltipWidth = 280;
    const tooltipHeight = 140;
    const gap = 12;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let top: number;
    let left: number;

    switch (currentMark.position) {
      case 'bottom':
        top = targetRect.top + targetRect.height + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = targetRect.top - tooltipHeight - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left + targetRect.width + gap;
        break;
      default:
        top = targetRect.top + targetRect.height + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    }

    // Clamp to screen bounds
    left = Math.max(16, Math.min(left, windowWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, windowHeight - tooltipHeight - 16));

    return { top: `${top}px`, left: `${left}px` };
  };

  // Generate clip-path for spotlight effect
  const getClipPath = (): string => {
    if (!targetRect) return 'none';

    const { top, left, width, height } = targetRect;
    const borderRadius = 12;

    // Create a polygon that covers the entire screen except for a rounded rect
    // Using inset with round for cleaner result
    return `polygon(
      0% 0%, 0% 100%,
      ${left}px 100%, ${left}px ${top + borderRadius}px,
      ${left + borderRadius}px ${top}px, ${left + width - borderRadius}px ${top}px,
      ${left + width}px ${top + borderRadius}px, ${left + width}px ${top + height - borderRadius}px,
      ${left + width - borderRadius}px ${top + height}px, ${left + borderRadius}px ${top + height}px,
      ${left}px ${top + height - borderRadius}px, ${left}px 100%,
      100% 100%, 100% 0%
    )`;
  };

  if (!currentMark) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999]"
      onClick={(e) => {
        // Clicking outside spotlight skips
        if (e.target === overlayRef.current) {
          onSkip();
        }
      }}
    >
      {/* Dark overlay with spotlight cutout */}
      <div
        className={`absolute inset-0 bg-ink-black/75 transition-opacity duration-300 ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          clipPath: targetRect ? getClipPath() : 'none',
        }}
      />

      {/* Spotlight ring effect */}
      {targetRect && (
        <div
          className={`absolute border-2 border-paper-white rounded-xl transition-all duration-300 ${
            isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={`absolute w-[280px] bg-paper-white rounded-xl shadow-xl p-4 transition-all duration-300 ${
          isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
        style={getTooltipStyle()}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 p-1 text-ink-light hover:text-ink-dark transition-colors"
          aria-label="닫기"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <h3 className="text-body font-medium text-ink-black mb-1 pr-6">
          {currentMark.title}
        </h3>
        <p className="text-sub text-ink-mid mb-4">
          {currentMark.description}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex gap-1">
            {tour.marks.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-ink-black'
                    : index < currentIndex
                    ? 'bg-ink-mid'
                    : 'bg-paper-mid'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {currentIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="px-3 py-1.5 text-sub text-ink-mid hover:text-ink-dark transition-colors"
              >
                이전
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-ink-black text-paper-white rounded-lg text-sub font-medium
                active:bg-ink-dark transition-colors"
            >
              {isLastMark ? '완료' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
