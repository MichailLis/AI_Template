import { useAuthControllerLogout } from '@/shared/api/generated/auth/auth';

import { useAuthStore } from './store';

/** Серверный выход + локальный сброс сессии; `onDone` вызывается после обоих исходов (onSettled). */
export function useLogout() {
  const mutation = useAuthControllerLogout();
  const logoutLocal = useAuthStore((state) => state.logout);

  const logout = (onDone: () => void) =>
    mutation.mutate(undefined, {
      onSettled: () => {
        logoutLocal();
        onDone();
      },
    });

  return { logout, isPending: mutation.isPending };
}
