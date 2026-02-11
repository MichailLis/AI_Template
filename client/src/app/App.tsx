import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import BookmarksPage from '@/pages/bookmarks';
import CalculatorPage from '@/pages/calculator';
import Dashboard from '@/pages/dashboard';
import LoginPage from '@/pages/login';
import NotesPage from '@/pages/notes';
import RegisterPage from '@/pages/register';
import TasksPage from '@/pages/tasks';
import api, { configureApiBaseUrl } from '@/shared/api/api';
import { setupInterceptors } from '@/shared/api/interceptors';
import { Header } from '@/widgets/header';

import { ProtectedRoute, PublicRoute } from './providers/auth-guard';

configureApiBaseUrl(import.meta.env.VITE_API_URL);
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
        <Header />
        <main>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/tasks" element={<TasksPage />} />
            </Route>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Routes>
        </main>
        <Toaster position="top-right" richColors />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
