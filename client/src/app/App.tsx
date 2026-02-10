import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import Dashboard from '@/pages/dashboard';
import ProjectsPage from '@/pages/projects/projects-page';
import { Header } from '@/widgets/header';
import { ProtectedRoute, PublicRoute } from './providers/auth-guard';

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
              <Route path="/projects" element={<ProjectsPage />} />
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