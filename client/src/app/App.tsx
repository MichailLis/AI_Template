import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import { useAuthStore } from '@/entities/session';
import { ProtectedRoute } from '@/features/auth';
import api, { configureApiBaseUrl } from '@/shared/api/api';
import { configureInterceptorsRuntime, setupInterceptors } from '@/shared/api/interceptors';
import { discoverAndConfigureApiBaseUrl } from '@/shared/api/runtime-api-base-url';

const AdminAnalyticsPage = lazy(() => import('@/pages/admin/admin-analytics-page'));
const AdminPage = lazy(() => import('@/pages/admin/admin-page'));
const AdminPromptsPage = lazy(() => import('@/pages/admin/admin-prompts-page'));
const AdminPublicLinksPage = lazy(() => import('@/pages/admin/admin-public-links-page'));
const AdminPublicLinksOrganizationsPage = lazy(
  () => import('@/pages/admin/admin-public-links-organizations-page'),
);
const AdminPublicLinksStatsPage = lazy(() => import('@/pages/admin/admin-public-links-stats-page'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/admin-settings-page'));
const AdminTestsPage = lazy(() => import('@/pages/admin/admin-tests-page'));
const AdminUsersPage = lazy(() => import('@/pages/admin/admin-users-page'));
const LoginPage = lazy(() => import('@/pages/login'));
const PublicTestEntryPage = lazy(() => import('@/pages/t/public-test-entry-page'));
const PublicTestResultPage = lazy(() => import('@/pages/t/public-test-result-page'));
const PublicTestRunPage = lazy(() => import('@/pages/t/public-test-run-page'));

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

function RouteLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm text-slate-600">
      Загружаем страницу...
    </main>
  );
}

function App() {
  const [apiReady, setApiReady] = useState(Boolean(import.meta.env.VITE_API_URL));

  useEffect(() => {
    if (import.meta.env.VITE_API_URL) {
      return;
    }

    let cancelled = false;

    const resolveRuntimeApiBaseUrl = async () => {
      await discoverAndConfigureApiBaseUrl();

      if (!cancelled) {
        setApiReady(true);
      }
    };

    void resolveRuntimeApiBaseUrl();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!apiReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm text-slate-600">
        Подключаемся к API...
      </main>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<RouteLoadingScreen />}>
          <main>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/t/:code" element={<PublicTestEntryPage />} />
              <Route path="/t/:code/session/:sessionToken" element={<PublicTestRunPage />} />
              <Route path="/t/:code/result/:sessionToken" element={<PublicTestResultPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/tests" replace />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                <Route path="/admin/prompts" element={<AdminPromptsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/tests" element={<AdminTestsPage />} />
                <Route path="/admin/tests/:topicId" element={<AdminTestsPage />} />
                <Route path="/admin/tests/:topicId/settings" element={<AdminTestsPage />} />
                <Route path="/admin/public-links" element={<AdminPublicLinksPage />} />
                <Route
                  path="/admin/public-links/organizations"
                  element={<AdminPublicLinksOrganizationsPage />}
                />
                <Route path="/admin/public-links/stats" element={<AdminPublicLinksStatsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </Suspense>
        <Toaster position="top-right" richColors />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
