import { Copy, MoreHorizontal, ShieldCheck, ShieldOff } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

interface AdminUserActionsMenuProps {
  user: {
    id: number;
    email: string;
    role: 'USER' | 'ADMIN';
  };
  currentUserId?: number;
  pendingUserId: number | null;
  isOpen: boolean;
  onToggleOpen: (userId: number) => void;
  onToggleRole: (targetUserId: number, nextRole: 'USER' | 'ADMIN') => void;
  onCopyEmail: (email: string) => Promise<void>;
  onClose: () => void;
}

const getRoleToggleLabel = (role: 'USER' | 'ADMIN') => {
  if (role === 'ADMIN') {
    return (
      <>
        <ShieldOff className="mr-2 h-4 w-4" />
        Снять права администратора
      </>
    );
  }

  return (
    <>
      <ShieldCheck className="mr-2 h-4 w-4" />
      Сделать администратором
    </>
  );
};

export function AdminUserActionsMenu({
  user,
  currentUserId,
  pendingUserId,
  isOpen,
  onToggleOpen,
  onToggleRole,
  onCopyEmail,
  onClose,
}: AdminUserActionsMenuProps) {
  return (
    <div className="relative flex justify-end">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Действия для ${user.email}`}
        onClick={() => onToggleOpen(user.id)}
        disabled={pendingUserId === user.id}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen ? (
        <Card className="absolute right-0 top-10 z-20 w-48 border-slate-200 shadow-md">
          <CardContent className="space-y-2 p-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start"
              disabled={
                pendingUserId === user.id || (currentUserId === user.id && user.role === 'ADMIN')
              }
              onClick={() => onToggleRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
            >
              {pendingUserId === user.id ? 'Обновление…' : getRoleToggleLabel(user.role)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                void onCopyEmail(user.email);
                onClose();
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Скопировать email
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
