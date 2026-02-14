import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import { useAuthStore } from '@/entities/session';
import { ProtectedRoute } from '@/features/auth';
import AdminAnalyticsPage from '@/pages/admin/admin-analytics-page';
import AdminOverviewPage from '@/pages/admin/admin-overview-page';
import AdminPage from '@/pages/admin/admin-page';
import AdminPromptsPage from '@/pages/admin/admin-prompts-page';
import AdminSecurityPage from '@/pages/admin/admin-security-page';
import AdminTestsPage from '@/pages/admin/admin-tests-page';
import AdminUsersPage from '@/pages/admin/admin-users-page';
import LoginPage from '@/pages/login';
import api, { configureApiBaseUrl } from '@/shared/api/api';
import { configureInterceptorsRuntime, setupInterceptors } from '@/shared/api/interceptors';

configureApiBaseUrl(import.meta.env.VITE_API_URL);
configureInterceptorsRuntime({
  onAuthRefreshFailed: () => {
    useAuthStore.getState().logout();
  },
});
setupInterceptors(api);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOverviewPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/security" element={<AdminSecurityPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/prompts" element={<AdminPromptsPage />} />
              <Route path="/admin/tests" element={<AdminTestsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
        <Toaster position="top-right" richColors />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
