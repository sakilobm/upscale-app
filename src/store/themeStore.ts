import { create } from 'zustand';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  toggle: () => set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
  setMode: (mode) => set({ mode }),
}));
