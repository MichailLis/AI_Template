import { getApiErrorMessage } from '@/shared/lib/api-error';

export const toBackupErrorMessage = (error: unknown) =>
  getApiErrorMessage(error, { fallbackMessage: 'Запрос не выполнен' });
