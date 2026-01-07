import { create } from 'zustand';

interface FabState {
  // FAB 상태
  canSubmit: boolean;
  isVisible: boolean;  // FAB 표시 여부

  // 핸들러
  submitHandler: (() => Promise<void>) | null;
  cancelHandler: (() => void) | null;

  // 액션
  setSubmitHandler: (handler: (() => Promise<void>) | null) => void;
  setCancelHandler: (handler: (() => void) | null) => void;
  setCanSubmit: (canSubmit: boolean) => void;
  setIsVisible: (isVisible: boolean) => void;
  triggerSubmit: () => Promise<void>;
  triggerCancel: () => void;
  reset: () => void;
}

export const useFabStore = create<FabState>((set, get) => ({
  canSubmit: false,
  isVisible: true,
  submitHandler: null,
  cancelHandler: null,

  setSubmitHandler: (handler) => set({ submitHandler: handler }),
  setCancelHandler: (handler) => set({ cancelHandler: handler }),
  setCanSubmit: (canSubmit) => set({ canSubmit }),
  setIsVisible: (isVisible) => set({ isVisible }),

  triggerSubmit: async () => {
    const { submitHandler } = get();
    if (submitHandler) {
      await submitHandler();
    }
  },

  triggerCancel: () => {
    const { cancelHandler } = get();
    if (cancelHandler) {
      cancelHandler();
    }
  },

  reset: () => set({
    canSubmit: false,
    isVisible: true,
    submitHandler: null,
    cancelHandler: null,
  }),
}));

// 기존 addPageStore와의 호환성을 위한 alias
export const useAddPageStore = useFabStore;
