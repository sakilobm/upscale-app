import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id:       string;
  message:  string;
  type:     ToastType;
  duration: number;
  actionLabel?: string;
  onAction?:    () => void;
}

interface ToastState {
  toasts: ToastItem[];
  show:    (message: string, type?: ToastType, duration?: number, actionLabel?: string, onAction?: () => void) => void;
  hide:    (id: string) => void;
  success: (message: string, duration?: number) => void;
  error:   (message: string, duration?: number) => void;
  info:    (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (message, type = 'info', duration = 2800, actionLabel, onAction) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // Cap at 3 visible toasts
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, type, duration, actionLabel, onAction }] }));
  },

  hide: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  success: (m, d) => get().show(m, 'success', d),
  error:   (m, d) => get().show(m, 'error',   d),
  info:    (m, d) => get().show(m, 'info',     d),
  warning: (m, d) => get().show(m, 'warning',  d),
}));

// ── Imperative API ────────────────────────────────────────────────────────────
export const toast = {
  show:    (m: string, t?: ToastType, d?: number, al?: string, oa?: () => void) => useToastStore.getState().show(m, t, d, al, oa),
  success: (m: string, d?: number)                => useToastStore.getState().success(m, d),
  error:   (m: string, d?: number)                => useToastStore.getState().error(m, d),
  info:    (m: string, d?: number)                => useToastStore.getState().info(m, d),
  warning: (m: string, d?: number)                => useToastStore.getState().warning(m, d),
};
