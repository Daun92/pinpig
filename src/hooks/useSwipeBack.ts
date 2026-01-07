import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SwipeBackOptions {
  threshold?: number; // 스와이프 인식 최소 거리 (px)
  edgeWidth?: number; // 왼쪽 가장자리 감지 영역 (px)
  disabled?: boolean; // 비활성화 여부
}

/**
 * 왼쪽 가장자리에서 오른쪽으로 스와이프하면 이전 페이지로 이동
 */
export function useSwipeBack(options: SwipeBackOptions = {}) {
  const { threshold = 80, edgeWidth = 30, disabled = false } = options;
  const navigate = useNavigate();
  const location = useLocation();

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwipeFromEdge = useRef<boolean>(false);

  // 메인 탭 페이지에서는 스와이프 백 비활성화
  const mainTabs = ['/', '/history', '/add', '/stats', '/settings'];
  const isMainTab = mainTabs.includes(location.pathname);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isMainTab) return;

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;

    // 왼쪽 가장자리에서 시작했는지 확인
    isSwipeFromEdge.current = touch.clientX <= edgeWidth;
  }, [disabled, isMainTab, edgeWidth]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (disabled || isMainTab || !isSwipeFromEdge.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    // 오른쪽으로 충분히 스와이프했고, 수직 이동이 적은 경우
    if (deltaX > threshold && deltaY < threshold) {
      navigate(-1);
    }

    isSwipeFromEdge.current = false;
  }, [disabled, isMainTab, threshold, navigate]);

  useEffect(() => {
    if (disabled || isMainTab) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isMainTab, handleTouchStart, handleTouchEnd]);
}
