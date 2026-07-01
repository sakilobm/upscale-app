import { create } from 'zustand';

interface SplashState {
  showSplash: boolean;
  dismissSplash: () => void;
}

export const useSplashStore = create<SplashState>((set) => ({
  showSplash: true,
  dismissSplash: () => set({ showSplash: false }),
}));
