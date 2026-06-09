import { useCallback } from 'react';
import { useAuthStore } from '@store/authStore';
import type { User } from '@store/types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => void;
  setUser: (user: User | null) => void;
}

export function useAuth(): UseAuthReturn {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const storeSignOut = useAuthStore((s) => s.signOut);
  const storeSetUser = useAuthStore((s) => s.setUser);

  const signOut = useCallback(() => {
    storeSignOut();
  }, [storeSignOut]);

  const setUser = useCallback(
    (u: User | null) => {
      storeSetUser(u);
    },
    [storeSetUser]
  );

  return { user, isAuthenticated, isLoading, signOut, setUser };
}
