import { Link } from 'react-router-dom';

import { useAuthStore } from '@/entities/session';
import { Button } from '@/shared/ui/button';

export const Header = () => {
  const { user, logout, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-4">
        <div className="flex items-center gap-6">
          <div className="font-bold text-lg tracking-tight">Fullstack App</div>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link to="/" className="transition-colors hover:text-foreground/80">
              Dashboard
            </Link>
            <Link to="/calculator" className="transition-colors hover:text-foreground/80">
              Calculator
            </Link>
            <Link to="/bookmarks" className="transition-colors hover:text-foreground/80">
              Bookmarks
            </Link>
            <Link to="/notes" className="transition-colors hover:text-foreground/80">
              Notes
            </Link>
            <Link to="/tasks" className="transition-colors hover:text-foreground/80">
              Tasks
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
