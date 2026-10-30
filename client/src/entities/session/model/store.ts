import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { safeSessionStorage, safeStorage } from '@/shared/lib/storage';

interface User {
  id: number;
  email: string;
  name?: string | null;
  /** Absent in sessions persisted before signin started returning the role. */
  role?: 'USER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** «Это мой компьютер». Absent in sessions persisted before #176: treated as remembered. */
  rememberDevice?: boolean;
  setAuth: (user: User, accessToken: string, rememberDevice: boolean) => void;
  logout: () => void;
}

const TAB_SESSION_KEY = 'auth-tab-session';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, rememberDevice) => {
        safeStorage.setItem('accessToken', accessToken);
        safeStorage.removeItem('refreshToken');
        safeSessionStorage.setItem(TAB_SESSION_KEY, '1');
        set({ user, isAuthenticated: true, rememberDevice });
      },
      logout: () => {
        safeStorage.removeItem('accessToken');
        safeStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false, rememberDevice: undefined });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);

/**
 * Без «Это мой компьютер» refresh-cookie умирает с закрытием браузера, а access-токен в
 * localStorage прожил бы ещё до 15 минут (#176). В новой вкладке токен сбрасывается: первый запрос
 * обновит его, если браузер не закрывали, иначе refresh получит отказ и клиент уведёт на вход.
 */
export const dropAccessTokenOnNewBrowserSession = () => {
  if (safeSessionStorage.getItem(TAB_SESSION_KEY)) return;
  safeSessionStorage.setItem(TAB_SESSION_KEY, '1');
  const { isAuthenticated, rememberDevice } = useAuthStore.getState();
  if (isAuthenticated && rememberDevice === false) {
    safeStorage.removeItem('accessToken');
  }
};
