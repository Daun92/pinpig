import { db } from '@/services/database';
import { startOfMonth, endOfMonth } from 'date-fns';

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * 현재 알림 권한 상태 확인
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * 로컬 알림 표시
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<Notification | null> {
  const permission = await requestNotificationPermission();

  if (permission !== 'granted') {
    console.log('Notification permission not granted');
    return null;
  }

  const notification = new Notification(title, {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    ...options,
  });

  return notification;
}

/**
 * 예산 상태 체크 및 알림
 */
export async function checkBudgetAndNotify(): Promise<void> {
  try {
    const settings = await db.settings.get('default');
    if (!settings?.monthlyBudget || settings.monthlyBudget <= 0) {
      return;
    }

    // 이번 달 지출 계산
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const transactions = await db.transactions
      .where('date')
      .between(monthStart, monthEnd)
      .toArray();

    const totalExpense = transactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const usedPercent = (totalExpense / settings.monthlyBudget) * 100;

    // 80% 이상 사용 시 알림 (하루에 한 번만)
    const lastNotificationKey = 'lastBudgetNotification';
    const lastNotification = localStorage.getItem(lastNotificationKey);
    const today = now.toISOString().split('T')[0];

    if (usedPercent >= 80 && lastNotification !== today) {
      const remaining = settings.monthlyBudget - totalExpense;

      await showNotification('예산 알림', {
        body: `이번 달 예산의 ${Math.round(usedPercent)}%를 사용했어요. 남은 예산: ${remaining.toLocaleString()}원`,
        tag: 'budget-alert',
      });

      localStorage.setItem(lastNotificationKey, today);
    }
  } catch (error) {
    console.error('Failed to check budget:', error);
  }
}

/**
 * 알림 설정 저장/조회
 */
export interface NotificationSettings {
  budgetAlert: boolean;
  dailyReminder: boolean;
  reminderTime: string; // HH:mm
}

export function getNotificationSettings(): NotificationSettings {
  const saved = localStorage.getItem('notificationSettings');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    budgetAlert: true,
    dailyReminder: false,
    reminderTime: '21:00',
  };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  localStorage.setItem('notificationSettings', JSON.stringify(settings));
}
