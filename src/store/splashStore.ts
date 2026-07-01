import { create } from 'zustand';

interface SplashState {
  showSplash: boolean;
  appReady: boolean;
  dismissSplash: () => void;
  setAppReady: (ready: boolean) => void;
}

export const useSplashStore = create<SplashState>((set) => ({
  showSplash: true,
  appReady: false,
  dismissSplash: () => set({ showSplash: false }),
  setAppReady: (ready) => set({ appReady: ready }),
}));
