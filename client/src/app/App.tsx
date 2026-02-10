import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import BookmarksPage from '@/pages/bookmarks/bookmarks-page';
import Dashboard from '@/pages/dashboard';
import LoginPage from '@/pages/login';
import NewsPage from '@/pages/news/news-page';
import RegisterPage from '@/pages/register';
import SnippetsPage from '@/pages/snippets/snippets-page';
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
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/snippets" element={<SnippetsPage />} />
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
