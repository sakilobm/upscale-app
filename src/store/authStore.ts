import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { User } from './types';

interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  setUser:         (user: User | null) => void;
  signOut:         () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      isAuthenticated: false,
      isLoading:       true,

      setUser: (user) => set({ user, isAuthenticated: user !== null, isLoading: false }),

      signOut: () => set({ user: null, isAuthenticated: false, isLoading: false }),
    }),
    {
      name:    'wc-auth',
      storage: zustandStorage,
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoading = false;
      },
    }
  )
);
