import { create } from 'zustand';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmDialogState {
  isOpen: boolean;
  options: ConfirmDialogOptions | null;
  open: (options: ConfirmDialogOptions) => void;
  close: () => void;
}

export const useConfirmDialogStore = create<ConfirmDialogState>((set) => ({
  isOpen: false,
  options: null,
  open: (options) => set({ isOpen: true, options }),
  close: () => set({ isOpen: false, options: null }),
}));

export function useConfirm() {
  const open = useConfirmDialogStore((s) => s.open);
  return { confirm: open };
}
