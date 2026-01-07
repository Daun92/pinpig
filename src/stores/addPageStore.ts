import { create } from 'zustand';

interface AddPageState {
  canSubmit: boolean;
  submitHandler: (() => Promise<void>) | null;
  setSubmitHandler: (handler: (() => Promise<void>) | null) => void;
  setCanSubmit: (canSubmit: boolean) => void;
  triggerSubmit: () => Promise<void>;
}

export const useAddPageStore = create<AddPageState>((set, get) => ({
  canSubmit: false,
  submitHandler: null,
  setSubmitHandler: (handler) => set({ submitHandler: handler }),
  setCanSubmit: (canSubmit) => set({ canSubmit }),
  triggerSubmit: async () => {
    const { submitHandler } = get();
    if (submitHandler) {
      await submitHandler();
    }
  },
}));
