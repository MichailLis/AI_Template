import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/entities/session';

import { AccessPendingScreen } from './access-pending-screen';

import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role);
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  // A session persisted before signin returned the role has none; it is let through, because the
  // server still checks the role on every admin request.
  if (requiredRole && role && role !== requiredRole) {
    return <AccessPendingScreen />;
  }

  return children;
};
