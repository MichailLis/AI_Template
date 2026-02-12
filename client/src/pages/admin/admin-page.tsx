import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuthStore } from '@/entities/session';
import { AdminOverview } from '@/features/admin/ui/admin-overview';
import { AdminShell } from '@/features/admin/ui/admin-shell';
import { useAdminControllerGetOverview } from '@/shared/api/generated/admin/admin';
import { useAuthControllerLogout } from '@/shared/api/generated/auth/auth';

export default function AdminPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logoutLocal = useAuthStore((state) => state.logout);

  const adminQuery = useAdminControllerGetOverview();
  const logoutMutation = useAuthControllerLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        logoutLocal();
        toast.success('Session closed');
        navigate('/login');
      },
    });
  };

  if (adminQuery.isLoading) {
    return (
      <AdminShell
        userLabel={user?.email ?? 'Admin'}
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      >
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading admin overview...
        </div>
      </AdminShell>
    );
  }

  if (adminQuery.isError || !adminQuery.data) {
    return (
      <AdminShell
        userLabel={user?.email ?? 'Admin'}
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      >
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Access denied or admin data is unavailable.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      userLabel={user?.email ?? 'Admin'}
      onLogout={handleLogout}
      isLoggingOut={logoutMutation.isPending}
    >
      <AdminOverview
        title={adminQuery.data.title}
        subtitle={adminQuery.data.subtitle}
        cards={adminQuery.data.cards}
        shortcuts={adminQuery.data.shortcuts}
      />
    </AdminShell>
  );
}
