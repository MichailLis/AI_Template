import { cn } from '@/shared/lib/utils';
import { AdminDataTable } from '@/shared/ui/admin-data-table';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { TableCell } from '@/shared/ui/table';

import { AdminUserActionsMenu } from './admin-user-actions-menu';

import type { AdminUser, SortBy, SortOrder, UserRole } from './admin-users-workspace.types';

interface AdminUsersTableProps {
  users: AdminUser[];
  currentUserId?: number;
  pendingUserId: number | null;
  activeActionsUserId: number | null;
  onToggleActionsMenu: (userId: number) => void;
  onCloseActionsMenu: () => void;
  onEditUser: (user: AdminUser) => void;
  onToggleRole: (targetUserId: number, nextRole: UserRole) => void;
  onResetPassword: (user: AdminUser) => void;
  onRevokeSessions: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onCopyEmail: (email: string) => Promise<void>;
  formatDateTime: (value: string) => string;
  getRoleBadgeClass: (role: string) => string;
  getRoleLabel: (role: string) => string;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortByChange: (nextSortBy: SortBy) => void;
}

const buildColumns = ({
  sortBy,
  sortOrder,
  onSortByChange,
}: Pick<AdminUsersTableProps, 'sortBy' | 'sortOrder' | 'onSortByChange'>) => [
  { id: 'user', header: 'Пользователь', className: 'w-32 sm:min-w-48' },
  { id: 'role', header: 'Роль', className: 'w-20 sm:w-36' },
  { id: 'status', header: 'Статус', className: 'hidden w-32 md:table-cell' },
  { id: 'last-login', header: 'Последний вход', className: 'hidden xl:table-cell' },
  {
    id: 'created',
    header: 'Создан',
    className: 'hidden lg:table-cell',
    onSort: () => onSortByChange('createdAt'),
    sortDirection: sortBy === 'createdAt' ? sortOrder : null,
  },
  {
    id: 'updated',
    header: 'Обновлен',
    className: 'hidden lg:table-cell',
    onSort: () => onSortByChange('updatedAt'),
    sortDirection: sortBy === 'updatedAt' ? sortOrder : null,
  },
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
  onEditUser,
  onToggleRole,
  onResetPassword,
  onRevokeSessions,
  onToggleStatus,
  onCopyEmail,
  formatDateTime,
  getRoleBadgeClass,
  getRoleLabel,
  sortBy,
  sortOrder,
  onSortByChange,
}: AdminUsersTableProps) {
  return (
    <AdminDataTable
      columns={buildColumns({ sortBy, sortOrder, onSortByChange })}
      items={users}
      getRowKey={(user) => user.id}
      emptyMessage="По текущим фильтрам пользователи не найдены."
      renderRow={(user) => (
        <>
          <TableCell className="w-32 sm:min-w-48">
            <div className="min-w-0">
              {/* Email режется многоточием, а не рвется по буквам: разорванный посреди слова адрес
                  мешает просматривать колонку глазами, полный адрес доступен по наведению. */}
              <p className="truncate font-medium text-foreground" title={user.email}>
                {user.email}
              </p>
              <p className={cn('text-xs', adminClassNames.text.muted)}>ID: {user.id}</p>
              {user.name ? (
                <p className={cn('text-xs', adminClassNames.text.muted)}>{user.name}</p>
              ) : null}
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
          <TableCell className="hidden w-32 md:table-cell">
            <Badge
              variant="outline"
              className={
                user.deactivatedAt === null
                  ? adminBadgeClassNames.active
                  : adminBadgeClassNames.inactive
              }
            >
              {user.deactivatedAt === null ? 'Активен' : 'Отключён'}
            </Badge>
          </TableCell>
          <TableCell className={cn('hidden xl:table-cell', adminClassNames.table.mutedCell)}>
            {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Не входил'}
          </TableCell>
          <TableCell className={cn('hidden lg:table-cell', adminClassNames.table.mutedCell)}>
            {formatDateTime(user.createdAt)}
          </TableCell>
          <TableCell className={cn('hidden lg:table-cell', adminClassNames.table.mutedCell)}>
            {formatDateTime(user.updatedAt)}
          </TableCell>
          <TableCell className="w-10 text-right sm:w-12">
            <AdminUserActionsMenu
              user={user}
              currentUserId={currentUserId}
              pendingUserId={pendingUserId}
              isOpen={activeActionsUserId === user.id}
              onToggleOpen={onToggleActionsMenu}
              onEdit={() => onEditUser(user)}
              onToggleRole={onToggleRole}
              onResetPassword={() => onResetPassword(user)}
              onRevokeSessions={() => onRevokeSessions(user)}
              onToggleStatus={() => onToggleStatus(user)}
              onCopyEmail={onCopyEmail}
              onClose={onCloseActionsMenu}
            />
          </TableCell>
        </>
      )}
    />
  );
}
