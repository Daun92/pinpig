import { useEffect, useRef, useState, useCallback } from 'react';

export interface ScrollSpySection {
  id: string;
  type: 'month' | 'date';
  label: string;
  monthKey?: string; // for date sections, reference to parent month
  summary?: {
    income: number;
    expense: number;
    net: number;
    transactionCount: number;
  };
  dailyTotal?: number;
}

interface ScrollSpyState {
  activeMonth: ScrollSpySection | null;
  activeDate: ScrollSpySection | null;
  previousMonth: ScrollSpySection | null;
  previousDate: ScrollSpySection | null;
  isTransitioning: boolean;
  transitionDirection: 'up' | 'down' | null;
}

export function useScrollSpy() {
  const [state, setState] = useState<ScrollSpyState>({
    activeMonth: null,
    activeDate: null,
    previousMonth: null,
    previousDate: null,
    isTransitioning: false,
    transitionDirection: null,
  });

  const sectionsRef = useRef<Map<string, { element: HTMLElement; data: ScrollSpySection }>>(new Map());
  const lastScrollY = useRef(0);
  const rafId = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Register a section for observation
  const registerSection = useCallback((id: string, element: HTMLElement, data: ScrollSpySection) => {
    sectionsRef.current.set(id, { element, data });
  }, []);

  // Unregister a section
  const unregisterSection = useCallback((id: string) => {
    sectionsRef.current.delete(id);
  }, []);

  // Create ref callback for components
  const createSectionRef = useCallback((id: string, data: ScrollSpySection) => {
    return (element: HTMLElement | null) => {
      if (element) {
        registerSection(id, element, data);
      } else {
        unregisterSection(id);
      }
    };
  }, [registerSection, unregisterSection]);

  // Calculate active sections based on scroll position
  const updateActiveSections = useCallback(() => {
    const currentScrollY = window.scrollY;
    const direction: 'up' | 'down' = currentScrollY > lastScrollY.current ? 'down' : 'up';
    lastScrollY.current = currentScrollY;

    // Threshold: consider element "active" when its top is within this range from viewport top
    // Header (56px) + Filter bar (52px) + StickyContextHeader (~80px) = ~188px
    const activeThreshold = 200;

    let newActiveMonth: ScrollSpySection | null = null;
    let newActiveDate: ScrollSpySection | null = null;

    // Find the topmost visible sections
    const monthSections: { rect: DOMRect; data: ScrollSpySection }[] = [];
    const dateSections: { rect: DOMRect; data: ScrollSpySection }[] = [];

    sectionsRef.current.forEach(({ element, data }) => {
      const rect = element.getBoundingClientRect();

      // Element is considered "active" if:
      // 1. Its top is above the threshold (has scrolled past the sticky header)
      // 2. Its bottom is still visible (element hasn't completely scrolled out)
      if (rect.top < activeThreshold && rect.bottom > 0) {
        if (data.type === 'month') {
          monthSections.push({ rect, data });
        } else {
          dateSections.push({ rect, data });
        }
      }
    });

    // Sort by position (closest to top first)
    monthSections.sort((a, b) => b.rect.top - a.rect.top);
    dateSections.sort((a, b) => b.rect.top - a.rect.top);

    // The "active" one is the one closest to (but below) the threshold
    newActiveMonth = monthSections[0]?.data || null;
    newActiveDate = dateSections[0]?.data || null;

    setState((prev) => {
      const monthChanged = prev.activeMonth?.id !== newActiveMonth?.id;
      const dateChanged = prev.activeDate?.id !== newActiveDate?.id;

      if (!monthChanged && !dateChanged) return prev;

      // Clear any existing transition timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // Set transition timeout to clear transition state
      transitionTimeoutRef.current = setTimeout(() => {
        setState((s) => ({
          ...s,
          isTransitioning: false,
          transitionDirection: null,
        }));
      }, 250);

      return {
        activeMonth: newActiveMonth,
        activeDate: newActiveDate,
        previousMonth: monthChanged ? prev.activeMonth : prev.previousMonth,
        previousDate: dateChanged ? prev.activeDate : prev.previousDate,
        isTransitioning: monthChanged || dateChanged,
        transitionDirection: direction,
      };
    });
  }, []);

  // Throttled scroll handler using requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (rafId.current !== null) {
      return; // Skip if already scheduled
    }

    rafId.current = requestAnimationFrame(() => {
      updateActiveSections();
      rafId.current = null;
    });
  }, [updateActiveSections]);

  useEffect(() => {
    // Initial calculation
    updateActiveSections();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [handleScroll, updateActiveSections]);

  return {
    ...state,
    createSectionRef,
    registerSection,
    unregisterSection,
  };
}
