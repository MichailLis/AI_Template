import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { safeStorage } from '@/shared/lib/storage';

interface User {
  id: number;
  email: string;
  name?: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        safeStorage.setItem('accessToken', accessToken);
        safeStorage.removeItem('refreshToken');
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        safeStorage.removeItem('accessToken');
        safeStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
