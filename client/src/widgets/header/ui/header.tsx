import { useAuthStore } from '@/entities/session';
import { Button } from '@/shared/ui/button';

export const Header = () => {
  const { user, logout, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-4">
        <div className="font-bold text-lg tracking-tight">Fullstack App</div>
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
