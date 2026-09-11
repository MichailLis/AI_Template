import {
  Copy,
  KeyRound,
  LogOut,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
} from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

import type { UserRole } from './admin-users-workspace.types';
import type { ReactNode } from 'react';

interface AdminUserActionsMenuProps {
  user: {
    id: number;
    email: string;
    role: UserRole;
    deactivatedAt: string | null;
  };
  currentUserId?: number;
  pendingUserId: number | null;
  isOpen: boolean;
  onToggleOpen: (userId: number) => void;
  onEdit: () => void;
  onToggleRole: (targetUserId: number, nextRole: UserRole) => void;
  onResetPassword: () => void;
  onRevokeSessions: () => void;
  onToggleStatus: () => void;
  onCopyEmail: (email: string) => Promise<void>;
  onClose: () => void;
}

interface MenuItemProps {
  children: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onSelect: () => void;
}

function MenuItem({ children, disabled = false, danger = false, onSelect }: MenuItemProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'w-full justify-start',
        danger && 'text-admin-danger-foreground hover:text-admin-danger-foreground',
      )}
      disabled={disabled}
      onClick={onSelect}
    >
      {children}
    </Button>
  );
}

const getRoleToggleLabel = (role: UserRole) => {
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
  onEdit,
  onToggleRole,
  onResetPassword,
  onRevokeSessions,
  onToggleStatus,
  onCopyEmail,
  onClose,
}: AdminUserActionsMenuProps) {
  const isSelf = currentUserId === user.id;
  const isPending = pendingUserId === user.id;
  const isDeactivated = user.deactivatedAt !== null;
  const select = (action: () => void) => () => {
    action();
    onClose();
  };

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
        <Card className={adminClassNames.actionMenu.card}>
          <CardContent className={adminClassNames.actionMenu.content}>
            <MenuItem disabled={isPending} onSelect={select(onEdit)}>
              <Pencil className="mr-2 h-4 w-4" />
              Изменить данные
            </MenuItem>
            <MenuItem
              disabled={isPending || (isSelf && user.role === 'ADMIN')}
              onSelect={select(() =>
                onToggleRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN'),
              )}
            >
              {isPending ? 'Обновление…' : getRoleToggleLabel(user.role)}
            </MenuItem>
            {/* Себе эти действия не предлагаются: сброс пароля и завершение сеансов выбросили бы
                администратора из его же сеанса, а отключить себя не даст и сервер. */}
            <MenuItem disabled={isPending || isSelf} onSelect={select(onResetPassword)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Сбросить пароль
            </MenuItem>
            <MenuItem disabled={isPending || isSelf} onSelect={select(onRevokeSessions)}>
              <LogOut className="mr-2 h-4 w-4" />
              Завершить сеансы
            </MenuItem>
            <MenuItem
              danger={!isDeactivated}
              disabled={isPending || isSelf}
              onSelect={select(onToggleStatus)}
            >
              {isDeactivated ? (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Включить доступ
                </>
              ) : (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Отключить доступ
                </>
              )}
            </MenuItem>
            <MenuItem onSelect={select(() => void onCopyEmail(user.email))}>
              <Copy className="mr-2 h-4 w-4" />
              Скопировать email
            </MenuItem>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
