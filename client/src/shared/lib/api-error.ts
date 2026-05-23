import { isRecord } from './type-guards';

const DEFAULT_API_ERROR_MESSAGE = 'Не удалось выполнить запрос';
const SESSION_EXPIRED_MESSAGE = 'Сессия истекла или доступ запрещен. Войдите заново.';
const SERVER_UNAVAILABLE_MESSAGE =
  'Сервер недоступен. Проверьте, что backend запущен на localhost:3000.';

interface ApiErrorMessageOptions {
  fallbackMessage?: string;
  unauthorizedMessage?: string;
  requestMessage?: string;
}

const extractErrorMessage = (data: Record<string, unknown>) => {
  const nestedError = data.error;

  if (isRecord(nestedError) && 'message' in nestedError) {
    return String(nestedError.message);
  }

  if ('message' in data) {
    return String(data.message);
  }

  return null;
};

export const getApiErrorMessage = (
  error: unknown,
  {
    fallbackMessage = DEFAULT_API_ERROR_MESSAGE,
    unauthorizedMessage,
    requestMessage,
  }: ApiErrorMessageOptions = {},
) => {
  if (!isRecord(error)) {
    return fallbackMessage;
  }

  if ('response' in error && isRecord(error.response)) {
    const response = error.response;

    if ('status' in response && response.status === 401 && unauthorizedMessage) {
      return unauthorizedMessage;
    }

    if ('data' in response && isRecord(response.data)) {
      const message = extractErrorMessage(response.data);
      if (message) {
        return message;
      }
    }
  }

  if ('request' in error && requestMessage) {
    return requestMessage;
  }

  return fallbackMessage;
};

export const parseApiError = (error: unknown) =>
  getApiErrorMessage(error, {
    fallbackMessage: DEFAULT_API_ERROR_MESSAGE,
    unauthorizedMessage: SESSION_EXPIRED_MESSAGE,
    requestMessage: SERVER_UNAVAILABLE_MESSAGE,
  });
