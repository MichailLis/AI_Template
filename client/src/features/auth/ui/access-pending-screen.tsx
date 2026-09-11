import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/entities/session';
import { useAuthControllerLogout } from '@/shared/api/generated/auth/auth';
import { Button } from '@/shared/ui/button';

/**
 * Экран для вошедшего пользователя без роли администратора. Роль USER пока не открывает ни одного
 * раздела, и без этого экрана такой пользователь попадал в админку и видел одни ошибки доступа.
 */
export function AccessPendingScreen() {
  const navigate = useNavigate();
  const email = useAuthStore((state) => state.user?.email);
  const logoutLocal = useAuthStore((state) => state.logout);
  const logoutMutation = useAuthControllerLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        logoutLocal();
        navigate('/login');
      },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Доступ пока не выдан</h1>
        <p className="text-sm text-slate-600">
          Вы вошли как {email}. Разделы панели доступны только администраторам — если доступ нужен,
          обратитесь к администратору.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          Выйти
        </Button>
      </section>
    </main>
  );
}
