import type { TourKey } from '@/stores/settingsStore';

export interface CoachMark {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
}

export interface TourConfig {
  tourId: string;
  flagKey: TourKey;
  marks: CoachMark[];
}

export const tourConfigs: Record<string, TourConfig> = {
  home: {
    tourId: 'home',
    flagKey: 'hasSeenHomeTour',
    marks: [
      {
        id: 'home-hero',
        targetSelector: '[data-tour="home-hero"]',
        title: '남은 예산',
        description: '이번 달 쓸 수 있는 돈이에요. 매일 확인해보세요.',
        position: 'bottom',
        spotlightPadding: 16,
      },
      {
        id: 'home-daily',
        targetSelector: '[data-tour="home-daily"]',
        title: '하루 권장 금액',
        description: '남은 예산을 남은 일수로 나눈 금액이에요.',
        position: 'top',
        spotlightPadding: 8,
      },
    ],
  },
  add: {
    tourId: 'add',
    flagKey: 'hasSeenAddTour',
    marks: [
      {
        id: 'add-amount',
        targetSelector: '[data-tour="add-amount"]',
        title: '금액 입력',
        description: '지출 또는 수입 금액을 입력하세요.',
        position: 'bottom',
        spotlightPadding: 8,
      },
      {
        id: 'add-category',
        targetSelector: '[data-tour="add-category"]',
        title: '카테고리 선택',
        description: '어디에 썼는지 카테고리를 선택해주세요.',
        position: 'top',
        spotlightPadding: 8,
      },
      {
        id: 'add-confirm',
        targetSelector: '[data-tour="add-confirm"]',
        title: '저장',
        description: '체크 버튼을 누르면 저장돼요.',
        position: 'top',
        spotlightPadding: 12,
      },
    ],
  },
  stats: {
    tourId: 'stats',
    flagKey: 'hasSeenStatsTour',
    marks: [
      {
        id: 'stats-chart',
        targetSelector: '[data-tour="stats-chart"]',
        title: '지출 분석',
        description: '카테고리별 지출 비율을 한눈에 확인하세요.',
        position: 'bottom',
        spotlightPadding: 16,
      },
      {
        id: 'stats-tabs',
        targetSelector: '[data-tour="stats-tabs"]',
        title: '다양한 분석',
        description: '탭을 눌러 수단별, 기간별 분석도 볼 수 있어요.',
        position: 'bottom',
        spotlightPadding: 8,
      },
    ],
  },
  settings: {
    tourId: 'settings',
    flagKey: 'hasSeenSettingsTour',
    marks: [
      {
        id: 'settings-budget',
        targetSelector: '[data-tour="settings-budget"]',
        title: '예산 설정',
        description: '월 예산이나 예산 마법사를 이용해보세요.',
        position: 'bottom',
        spotlightPadding: 8,
      },
    ],
  },
};
