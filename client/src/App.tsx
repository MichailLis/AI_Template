import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import Dashboard from './pages/dashboard';
import { ProtectedRoute, PublicRoute } from './components/auth-guard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Защищенные роуты */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
        </Route>

        {/* Публичные роуты (только для неавторизованных) */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" richColors />
    </Router>
  );
}

export default App;