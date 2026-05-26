import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuthStore } from '@/entities/session';
import { AdminShell } from '@/features/admin';
import { useAuthControllerLogout } from '@/shared/api/generated/auth/auth';

export function AdminPageLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logoutLocal = useAuthStore((state) => state.logout);

  const logoutMutation = useAuthControllerLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        logoutLocal();
        toast.success('Сессия завершена');
        navigate('/login');
      },
    });
  };

  return (
    <AdminShell
      userLabel={user?.email ?? 'Admin'}
      activePath={location.pathname}
      onLogout={handleLogout}
      isLoggingOut={logoutMutation.isPending}
    >
      <Outlet />
    </AdminShell>
  );
}
