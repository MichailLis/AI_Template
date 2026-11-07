import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuthStore, useLogout } from '@/entities/session';
import { AdminShell } from '@/features/admin';

export function AdminPageLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { logout, isPending } = useLogout();

  const handleLogout = () => {
    logout(() => {
      toast.success('Сессия завершена');
      navigate('/login');
    });
  };

  return (
    <AdminShell
      userLabel={user?.email ?? 'Admin'}
      activePath={location.pathname}
      onLogout={handleLogout}
      isLoggingOut={isPending}
    >
      <Outlet />
    </AdminShell>
  );
}
