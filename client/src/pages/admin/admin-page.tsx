import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuthStore } from '@/entities/session';
import { AdminShell } from '@/features/admin/ui/admin-shell';
import { useAdminControllerGetOverview } from '@/shared/api/generated/admin/admin';
import { useAuthControllerLogout } from '@/shared/api/generated/auth/auth';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

import type { AdminOverviewResponseDto } from '@/shared/api/model';

export interface AdminOutletContext {
  overview: AdminOverviewResponseDto;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
        activePath={location.pathname}
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      >
        <Card className="border-slate-200">
          <CardContent className="p-6 text-sm text-slate-500">
            Loading admin overview...
          </CardContent>
        </Card>
      </AdminShell>
    );
  }

  if (adminQuery.isError || !adminQuery.data) {
    return (
      <AdminShell
        userLabel={user?.email ?? 'Admin'}
        activePath={location.pathname}
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      >
        <Card className="border-red-200 bg-red-50">
          <CardContent className="space-y-4 p-6 text-sm text-red-700">
            <p>Access denied or admin data is unavailable.</p>
            <Button variant="outline" size="sm" onClick={() => adminQuery.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      userLabel={user?.email ?? 'Admin'}
      activePath={location.pathname}
      onLogout={handleLogout}
      isLoggingOut={logoutMutation.isPending}
    >
      <Outlet context={{ overview: adminQuery.data }} />
    </AdminShell>
  );
}
