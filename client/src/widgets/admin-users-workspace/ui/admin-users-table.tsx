import { cn } from '@/shared/lib/utils';
import { AdminDataTable } from '@/shared/ui/admin-data-table';
import { Badge } from '@/shared/ui/badge';
import { TableCell } from '@/shared/ui/table';

import { AdminUserActionsMenu } from './admin-user-actions-menu';

interface AdminUsersTableUser {
  id: number;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

interface AdminUsersTableProps {
  users: AdminUsersTableUser[];
  currentUserId?: number;
  pendingUserId: number | null;
  activeActionsUserId: number | null;
  onToggleActionsMenu: (userId: number) => void;
  onCloseActionsMenu: () => void;
  onToggleRole: (targetUserId: number, nextRole: 'USER' | 'ADMIN') => void;
  onCopyEmail: (email: string) => Promise<void>;
  formatDateTime: (value: string) => string;
  getRoleBadgeClass: (role: string) => string;
  getRoleLabel: (role: string) => string;
}

const ADMIN_USERS_COLUMNS = [
  { id: 'user', header: 'Пользователь', className: 'w-32 sm:min-w-48' },
  { id: 'role', header: 'Роль', className: 'w-20 sm:w-36' },
  { id: 'created', header: 'Создан', className: 'hidden lg:table-cell' },
  { id: 'updated', header: 'Обновлен', className: 'hidden lg:table-cell' },
  {
    id: 'actions',
    header: 'Действия',
    className: 'w-10 text-right text-[0px] sm:w-12 sm:text-sm',
  },
];

const getMobileRoleLabel = (role: string) => {
  if (role === 'ADMIN') {
    return 'Админ';
  }

  return 'Польз.';
};

export function AdminUsersTable({
  users,
  currentUserId,
  pendingUserId,
  activeActionsUserId,
  onToggleActionsMenu,
  onCloseActionsMenu,
  onToggleRole,
  onCopyEmail,
  formatDateTime,
  getRoleBadgeClass,
  getRoleLabel,
}: AdminUsersTableProps) {
  return (
    <AdminDataTable
      columns={ADMIN_USERS_COLUMNS}
      items={users}
      getRowKey={(user) => user.id}
      emptyMessage="По текущим фильтрам пользователи не найдены."
      renderRow={(user) => (
        <>
          <TableCell className="w-32 sm:min-w-48">
            <div>
              <p className="break-all font-medium text-foreground">{user.email}</p>
              <p className="text-xs text-slate-500">ID: {user.id}</p>
              {user.name ? <p className="text-xs text-slate-500">{user.name}</p> : null}
            </div>
          </TableCell>
          <TableCell className="w-20 sm:w-36">
            <Badge
              variant="outline"
              className={cn(
                'max-w-full justify-center whitespace-normal text-center leading-5',
                getRoleBadgeClass(user.role),
              )}
            >
              <span className="hidden sm:inline">{getRoleLabel(user.role)}</span>
              <span className="sm:hidden">{getMobileRoleLabel(user.role)}</span>
            </Badge>
          </TableCell>
          <TableCell className="hidden text-slate-600 lg:table-cell">
            {formatDateTime(user.createdAt)}
          </TableCell>
          <TableCell className="hidden text-slate-600 lg:table-cell">
            {formatDateTime(user.updatedAt)}
          </TableCell>
          <TableCell className="w-10 text-right sm:w-12">
            <AdminUserActionsMenu
              user={{ id: user.id, email: user.email, role: user.role }}
              currentUserId={currentUserId}
              pendingUserId={pendingUserId}
              isOpen={activeActionsUserId === user.id}
              onToggleOpen={onToggleActionsMenu}
              onToggleRole={onToggleRole}
              onCopyEmail={onCopyEmail}
              onClose={onCloseActionsMenu}
            />
          </TableCell>
        </>
      )}
    />
  );
}
