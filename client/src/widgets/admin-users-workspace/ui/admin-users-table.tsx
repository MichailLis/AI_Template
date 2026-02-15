import { Badge } from '@/shared/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Пользователь</TableHead>
          <TableHead>Роль</TableHead>
          <TableHead>Создан</TableHead>
          <TableHead>Обновлен</TableHead>
          <TableHead className="text-right">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
              По текущим фильтрам пользователи не найдены.
            </TableCell>
          </TableRow>
        ) : null}
        {users.map((user) => (
          <TableRow key={user.id}>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
