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

export interface ApiValidationIssue {
  path: string;
  message: string;
}

const VALIDATION_FIELD_LABELS: Record<string, string> = {
  name: 'Название',
  fullName: 'Полное наименование',
  shortName: 'Сокращённое наименование',
  inn: 'ИНН',
  ogrn: 'ОГРН',
  legalAddress: 'Юридический адрес',
  email: 'Email',
  phone: 'Телефон',
  privacyPolicyUrl: 'Политика обработки ПДн',
  consentDocumentUrl: 'Документ согласия',
  logoUrl: 'Логотип',
  groupValidationPattern: 'Шаблон группы/класса',
};

const normalizeValidationMessage = (message: string) => {
  if (message === 'Invalid URL' || message === 'URL must use http or https') {
    return 'укажите полный адрес, начинающийся с http:// или https://';
  }

  return message;
};

const extractValidationDetails = (error: Record<string, unknown>): ApiValidationIssue[] => {
  if (error.code !== 'VALIDATION_ERROR' || !Array.isArray(error.details)) {
    return [];
  }

  const messagesByPath = new Map<string, Set<string>>();

  for (const detail of error.details) {
    if (!isRecord(detail) || typeof detail.message !== 'string') {
      continue;
    }

    const path = typeof detail.path === 'string' && detail.path ? detail.path : 'Данные';
    const messages = messagesByPath.get(path) ?? new Set<string>();
    messages.add(normalizeValidationMessage(detail.message));
    messagesByPath.set(path, messages);
  }

  return Array.from(messagesByPath, ([path, messages]) => ({
    path,
    message: Array.from(messages).join('; '),
  }));
};

const formatValidationDetails = (issues: ApiValidationIssue[]) =>
  issues
    .map(({ path, message }) => `${VALIDATION_FIELD_LABELS[path] ?? path}: ${message}`)
    .join('. ');

const extractNestedApiError = (error: unknown) => {
  if (!isRecord(error) || !('response' in error) || !isRecord(error.response)) {
    return null;
  }

  const response = error.response;
  if (!('data' in response) || !isRecord(response.data) || !isRecord(response.data.error)) {
    return null;
  }

  return response.data.error;
};

export const extractApiValidationIssues = (error: unknown): ApiValidationIssue[] => {
  const nestedError = extractNestedApiError(error);
  return nestedError ? extractValidationDetails(nestedError) : [];
};

const extractErrorMessage = (data: Record<string, unknown>) => {
  const nestedError = data.error;

  if (isRecord(nestedError)) {
    const validationDetails = extractValidationDetails(nestedError);
    if (validationDetails.length > 0) {
      return formatValidationDetails(validationDetails);
    }

    if ('message' in nestedError) {
      return String(nestedError.message);
    }
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
