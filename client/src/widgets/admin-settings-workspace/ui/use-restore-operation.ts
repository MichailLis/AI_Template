import { useQueryClient } from '@tanstack/react-query';

import {
  getAdminBackupsControllerGetOperationQueryKey,
  useAdminBackupsControllerGetOperation,
} from '@/shared/api/generated/admin/admin';

import { BACKUPS_POLL_INTERVAL_MS } from './admin-settings-backups.model';

import type { AdminBackupOperationResponseDto } from '@/shared/api/model';

export type RestoreOperationStatus = AdminBackupOperationResponseDto;

/** Статус восстановления опрашивается, пока оно идет: сам маршрут работает и в режиме обслуживания. */
export function useRestoreOperation() {
  const queryClient = useQueryClient();
  const operationQuery = useAdminBackupsControllerGetOperation({
    query: {
      refetchInterval: (query) =>
        query.state.data?.maintenance || query.state.data?.operation?.status === 'RUNNING'
          ? BACKUPS_POLL_INTERVAL_MS
          : false,
    },
  });

  const refreshOperation = () =>
    queryClient.invalidateQueries({ queryKey: getAdminBackupsControllerGetOperationQueryKey() });

  return {
    status: operationQuery.data,
    isRunning:
      Boolean(operationQuery.data?.maintenance) ||
      operationQuery.data?.operation?.status === 'RUNNING',
    refreshOperation,
  };
}
