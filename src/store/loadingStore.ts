import { create } from 'zustand';

interface LoadingState {
  isVisible: boolean;
  title: string;
  subtitle: string;
  showLoading: (title?: string, subtitle?: string) => void;
  hideLoading: () => void;
  updateStatus: (title: string, subtitle?: string) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isVisible: false,
  title: 'Loading Data...',
  subtitle: 'Please wait...',
  showLoading: (title = 'Loading Data...', subtitle = 'Please wait...') =>
    set({ isVisible: true, title, subtitle }),
  hideLoading: () => set({ isVisible: false }),
  updateStatus: (title, subtitle = 'Please wait...') => set({ title, subtitle }),
}));
