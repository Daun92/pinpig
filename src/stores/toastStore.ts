import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  subMessage?: string;
  duration?: number; // ms, default 3000
}

interface ToastState {
  toasts: Toast[];
}

interface ToastActions {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

type ToastStore = ToastState & ToastActions;

let toastId = 0;
const generateToastId = () => `toast-${++toastId}`;

export const useToastStore = create<ToastStore>()(
  devtools(
    (set) => ({
      toasts: [],

      showToast: (toast) => {
        const id = generateToastId();
        const newToast: Toast = {
          ...toast,
          id,
          duration: toast.duration ?? 3000,
        };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-hide after duration
        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            set((state) => ({
              toasts: state.toasts.filter((t) => t.id !== id),
            }));
          }, newToast.duration);
        }
      },

      hideToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      clearAllToasts: () => {
        set({ toasts: [] });
      },
    }),
    { name: 'ToastStore' }
  )
);

// Selectors
export const selectToasts = (state: ToastStore) => state.toasts;
