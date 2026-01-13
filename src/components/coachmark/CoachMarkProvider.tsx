/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { CoachMarkOverlay } from './CoachMarkOverlay';
import { tourConfigs, type TourConfig } from './tourConfigs';

interface CoachMarkContextValue {
  startTour: (tourId: string) => void;
  isAnyTourActive: boolean;
}

const CoachMarkContext = createContext<CoachMarkContextValue | null>(null);

interface CoachMarkProviderProps {
  children: ReactNode;
}

export function CoachMarkProvider({ children }: CoachMarkProviderProps) {
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null);
  const markTourComplete = useSettingsStore((state) => state.markTourComplete);
  const settings = useSettingsStore((state) => state.settings);

  const startTour = useCallback((tourId: string) => {
    const config = tourConfigs[tourId];
    if (!config) {
      console.warn(`Tour "${tourId}" not found`);
      return;
    }

    // Check if already seen
    const hasSeen = settings?.[config.flagKey] ?? false;
    if (hasSeen) {
      return;
    }

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      setActiveTour(config);
    }, 500);
  }, [settings]);

  const handleComplete = useCallback(async () => {
    if (activeTour) {
      await markTourComplete(activeTour.flagKey);
      setActiveTour(null);
    }
  }, [activeTour, markTourComplete]);

  const handleSkip = useCallback(async () => {
    if (activeTour) {
      await markTourComplete(activeTour.flagKey);
      setActiveTour(null);
    }
  }, [activeTour, markTourComplete]);

  return (
    <CoachMarkContext.Provider value={{ startTour, isAnyTourActive: !!activeTour }}>
      {children}
      {activeTour && (
        <CoachMarkOverlay
          tour={activeTour}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}
    </CoachMarkContext.Provider>
  );
}

export function useCoachMark() {
  const context = useContext(CoachMarkContext);
  if (!context) {
    throw new Error('useCoachMark must be used within a CoachMarkProvider');
  }
  return context;
}
