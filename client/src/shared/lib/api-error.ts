import { isRecord } from './type-guards';

const DEFAULT_API_ERROR_MESSAGE = 'Не удалось выполнить запрос';
const SESSION_EXPIRED_MESSAGE = 'Сессия истекла или доступ запрещен. Войдите заново.';
const SERVER_UNAVAILABLE_MESSAGE = 'Сервер недоступен. Попробуйте позже.';

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
  groupValidationExample: 'Пример группы/класса',
  title: 'Название',
  description: 'Описание',
  shortCode: 'Короткий код',
  maxAttemptsPerStudent: 'Попыток на ученика',
  timeLimitMinutes: 'Лимит времени, мин',
  startsAt: 'Открыть с',
  endsAt: 'Закрыть в',
  password: 'Пароль',
  prompt: 'Текст промпта',
  model: 'Модель',
  temperature: 'Температура',
  baseUrl: 'Адрес API провайдера',
  apiKey: 'Ключ API',
  publicUrl: 'Публичная страница Атласа',
  apiUrl: 'Адрес API Атласа',
  version: 'Версия',
  content: 'Текст',
  operatorFullName: 'Оператор персональных данных',
  perMinute: 'Запросов в минуту',
  burst: 'Всплеск подряд',
};

const normalizeValidationMessage = (message: string) => {
  // «Неверный URL» — та же ошибка из русской локали zod на сервере.
  if (
    message === 'Invalid URL' ||
    message === 'Неверный URL' ||
    message === 'URL must use http or https'
  ) {
    return 'укажите полный адрес, начинающийся с http:// или https://';
  }

  return message;
};

/**
 * Прикладные ошибки сервер отдаёт с машинным кодом (`error.code`, #148) и английским или русским
 * текстом. Переводим по коду: раньше словарь держался за точный английский текст, и любая правка
 * формулировки на сервере молча возвращала в интерфейс английский. Русские сообщения сервера и
 * незнакомые коды показываются как пришли, чтобы не прятать новую ошибку за общей фразой.
 */
const CODE_TRANSLATIONS: Record<string, string> = {
  INVALID_CREDENTIALS: 'Неверный email или пароль',
  ACCOUNT_DEACTIVATED: 'Аккаунт отключён. Обратитесь к администратору.',
  REFRESH_DENIED: 'Доступ запрещен',
  ADMIN_ONLY: 'Раздел доступен только администраторам',
  EMAIL_ALREADY_EXISTS: 'Пользователь с таким email уже есть',
  USER_NOT_FOUND: 'Пользователь не найден',
  CANNOT_REVOKE_OWN_ADMIN_ROLE: 'Нельзя снять права администратора с самого себя',
  CANNOT_DEACTIVATE_OWN_ACCOUNT: 'Нельзя отключить собственный аккаунт',
  PUBLIC_LINK_NOT_FOUND: 'Публичная ссылка не найдена. Возможно, ее уже удалили.',
  PUBLISHED_VERSION_NOT_FOUND: 'Опубликованная версия не найдена',
  PUBLIC_LINK_REQUIRES_PUBLISHED_VERSION:
    'Публичную ссылку можно создать только для опубликованной версии теста',
  PUBLIC_LINK_DATE_INVALID: 'Неверный формат даты публичной ссылки',
  PUBLIC_LINK_DATE_RANGE_INVALID: 'Дата закрытия ссылки должна быть позже даты открытия',
  PUBLIC_LINK_PROMPT_ARCHIVED: 'Промпт анализа этой версии теста удалён. Подключите другой промпт.',
  NO_PUBLISHED_VERSION_TO_MOVE:
    'У теста нет опубликованной версии, на которую можно перевести ссылку',
  SHORT_CODE_GENERATION_FAILED: 'Не удалось подобрать свободный короткий код. Попробуйте еще раз.',
  TEST_TOPIC_NOT_FOUND: 'Тест не найден. Возможно, его уже удалили.',
  TEST_TOPIC_IN_USE:
    'Тест с опубликованными версиями, ссылками или прохождениями нельзя удалить насовсем',
  NO_ACTIVE_DRAFT: 'У теста нет версии в работе',
  QUESTION_NOT_FOUND: 'Вопрос не найден в версии в работе',
  DRAFT_HAS_NO_QUESTIONS: 'В версии теста нет ни одного вопроса',
  QUESTION_ORDER_NOT_UNIQUE: 'Порядок вопросов внутри версии должен быть уникальным',
  REORDER_DUPLICATE_QUESTIONS: 'В новом порядке вопросы повторяются',
  REORDER_INCOMPLETE: 'Новый порядок должен включать каждый вопрос версии ровно один раз',
  TEST_QUESTIONS_NOT_FOUND: 'Часть выбранных вопросов не найдена',
  SLIDER_BAND_RANGE_INVALID: 'Верхняя граница диапазона должна быть больше нижней',
  QUESTION_SETTINGS_INVALID_JSON: 'Настройки вопроса должны быть корректным JSON',
  VALUE_INVALID_JSON: 'Значение должно быть корректным JSON',
  ANALYSIS_PROMPT_NOT_FOUND: 'Промпт не найден. Возможно, его уже удалили.',
  ANALYSIS_PROMPT_VERSION_NOT_FOUND: 'Версия промпта не найдена',
  ANALYSIS_PROMPT_VERSION_NOT_PUBLISHED:
    'Подключить к тесту можно только опубликованную версию промпта',
  ATTEMPT_NOT_FOUND: 'Прохождение не найдено',
  AI_PROVIDER_NOT_CONFIGURED: 'Ключ API провайдера ИИ не настроен',
  AI_PROVIDER_API_KEY_REQUIRED: 'После смены адреса провайдера введите ключ API заново',
  ATLAS_URLS_REQUIRED: 'Адреса Атласа профессий не могут быть пустыми',
  PRIVACY_POLICY_SETTINGS_INVALID: 'Настройки политики персональных данных заполнены неверно',
};

const translateByCode = (code: unknown, message: string) => {
  if (code === 'SHORT_CODE_TAKEN') {
    const shortCode = /"(.+)"/.exec(message)?.[1];
    return shortCode
      ? `Короткий код «${shortCode}» уже занят. Укажите другой.`
      : 'Этот короткий код уже занят. Укажите другой.';
  }

  return (typeof code === 'string' && CODE_TRANSLATIONS[code]) || message;
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

export const extractNestedApiError = (error: unknown) => {
  if (!isRecord(error) || !('response' in error) || !isRecord(error.response)) {
    return null;
  }

  const response = error.response;
  if (!('data' in response) || !isRecord(response.data) || !isRecord(response.data.error)) {
    return null;
  }

  return response.data.error;
};

/** Машинный код ошибки сервера (error.code): по нему клиент ветвится, текст сообщения — только для показа. */
export const getApiErrorCode = (error: unknown) => {
  const code = extractNestedApiError(error)?.code;
  return typeof code === 'string' ? code : null;
};

export const getApiErrorStatus = (error: unknown) =>
  isRecord(error) && isRecord(error.response) && typeof error.response.status === 'number'
    ? error.response.status
    : null;

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
      return translateByCode(nestedError.code, String(nestedError.message));
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
