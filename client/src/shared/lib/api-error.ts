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

/**
 * Прикладные ошибки сервер формулирует по-английски, и раньше они попадали в русский интерфейс как
 * есть: админ видел `Public link short code "MC5CKWDB" already exists`. Переводятся только те
 * сообщения, которые пользователь реально может получить и на которые может повлиять; остальное
 * по-прежнему показывается как пришло, чтобы не прятать неизвестную ошибку за общей фразой.
 */
const EXACT_MESSAGE_TRANSLATIONS: Record<string, string> = {
  'Invalid credentials': 'Неверный email или пароль',
  'Access Denied': 'Доступ запрещен',
  'Admin area only': 'Раздел доступен только администраторам',
  'Email already exists': 'Пользователь с таким email уже есть',
  'User not found': 'Пользователь не найден',
  'Education organization with this name already exists':
    'Учебное заведение с таким названием уже есть',
  'Public link not found': 'Публичная ссылка не найдена. Возможно, ее уже удалили.',
  'Published version not found': 'Опубликованная версия не найдена',
  'Test topic not found': 'Тест не найден. Возможно, его уже удалили.',
  'Topic has no active draft version': 'У теста нет версии в работе',
  'Question not found in active draft': 'Вопрос не найден в версии в работе',
  'Public link can be created only for published test version':
    'Публичную ссылку можно создать только для опубликованной версии теста',
  'Unable to generate unique short code for public link':
    'Не удалось подобрать свободный короткий код. Попробуйте еще раз.',
  'Questions order must be unique within draft':
    'Порядок вопросов внутри версии должен быть уникальным',
  'Reorder payload contains duplicate question ids': 'В новом порядке вопросы повторяются',
  'Some selected test questions were not found': 'Часть выбранных вопросов не найдена',
  'Slider band maxValue must be greater than minValue':
    'Верхняя граница диапазона должна быть больше нижней',
  'Question settings must be valid JSON': 'Настройки вопроса должны быть корректным JSON',
  'Value must be valid JSON': 'Значение должно быть корректным JSON',
  'Profession atlas URLs must not be empty': 'Адреса Атласа профессий не могут быть пустыми',
  'Privacy policy settings are invalid': 'Настройки политики персональных данных заполнены неверно',
  'Invalid public link date format': 'Неверный формат даты публичной ссылки',
};

const PATTERN_MESSAGE_TRANSLATIONS: Array<{
  pattern: RegExp;
  translate: (match: string[]) => string;
}> = [
  {
    pattern: /^Public link short code "(.+)" already exists$/,
    translate: ([, shortCode]) => `Короткий код «${shortCode}» уже занят. Укажите другой.`,
  },
];

const translateKnownMessage = (message: string) => {
  const exact = EXACT_MESSAGE_TRANSLATIONS[message];

  if (exact) {
    return exact;
  }

  for (const { pattern, translate } of PATTERN_MESSAGE_TRANSLATIONS) {
    const match = pattern.exec(message);

    if (match) {
      return translate(match);
    }
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
      return translateKnownMessage(String(nestedError.message));
    }
  }

  if ('message' in data) {
    return translateKnownMessage(String(data.message));
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
