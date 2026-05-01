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
  { id: 'user', header: 'Пользователь' },
  { id: 'role', header: 'Роль' },
  { id: 'created', header: 'Создан' },
  { id: 'updated', header: 'Обновлен' },
  { id: 'actions', header: 'Действия', className: 'text-right' },
];

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
          <TableCell>
            <div>
              <p className="font-medium text-slate-900">{user.email}</p>
              <p className="text-xs text-slate-500">ID: {user.id}</p>
              {user.name ? <p className="text-xs text-slate-500">{user.name}</p> : null}
            </div>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
              {getRoleLabel(user.role)}
            </Badge>
          </TableCell>
          <TableCell className="text-slate-600">{formatDateTime(user.createdAt)}</TableCell>
          <TableCell className="text-slate-600">{formatDateTime(user.updatedAt)}</TableCell>
          <TableCell>
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
