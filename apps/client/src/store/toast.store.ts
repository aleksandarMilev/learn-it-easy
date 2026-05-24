import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type ToastItem = {
  id: string;
  message: string;
  type: ToastVariant;
  createdAt: Date;
};

type ToastStore = {
  toasts: ToastItem[];
  addToast: (message: string, type: ToastVariant) => void;
  removeToast: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [{ id, message, type, createdAt: new Date() }, ...state.toasts],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  return {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
    warning: (message: string) => addToast(message, 'warning'),
  };
}
