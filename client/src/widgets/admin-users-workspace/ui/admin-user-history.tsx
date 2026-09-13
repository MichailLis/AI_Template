import { useAdminControllerGetUserHistory } from '@/shared/api/generated/admin/admin';
import { AuditHistoryList } from '@/shared/ui/audit-history-list';

/** История изменений аккаунта: роль, доступ, сброс пароля, завершение сеансов, данные. */
export function AdminUserHistory({ userId }: { userId: number }) {
  const historyQuery = useAdminControllerGetUserHistory(userId);

  return (
    <AuditHistoryList
      events={historyQuery.data?.events}
      isLoading={historyQuery.isLoading}
      isError={historyQuery.isError}
    />
  );
}
