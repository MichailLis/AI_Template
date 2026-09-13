import { formatDateTime } from './date-format';
import { entryProfileModeLabels, publicTemplateLabels } from './public-test-labels';

import type {
  AuditHistoryResponseDtoEventsItemActor,
  AuditHistoryResponseDtoEventsItemChangesItem,
} from '@/shared/api/model';

/**
 * Журнал изменений хранит служебные значения. Здесь они превращаются в историю человеческим языком.
 * Неизвестное действие, поле или значение показывается как есть: лучше сырая строка, чем пропуск,
 * если сервер начнет писать новое событие раньше, чем клиент узнает его подпись.
 */
const AUDIT_ACTION_LABELS: Record<string, string> = {
  USER_CREATED: 'Пользователь создан',
  USER_UPDATED: 'Изменены данные пользователя',
  USER_ROLE_CHANGED: 'Изменена роль',
  USER_STATUS_CHANGED: 'Изменен доступ',
  USER_PASSWORD_RESET: 'Сброшен пароль',
  USER_SESSIONS_REVOKED: 'Завершены сеансы',
  PROMPT_CREATED: 'Промпт создан',
  PROMPT_VERSION_CREATED: 'Создана новая версия промпта',
  PROMPT_VERSION_PUBLISHED: 'Опубликована версия промпта',
  PROMPT_ARCHIVED: 'Промпт удален',
  SETTING_UPDATED: 'Изменена настройка',
  PUBLIC_LINK_CREATED: 'Ссылка создана',
  PUBLIC_LINK_UPDATED: 'Изменены настройки ссылки',
  PUBLIC_LINK_CODE_REGENERATED: 'Перевыпущен код ссылки',
  PUBLIC_LINK_ARCHIVED: 'Ссылка архивирована',
  PUBLIC_LINK_RESTORED: 'Ссылка восстановлена',
  PUBLIC_LINK_MOVED_TO_ACTIVE_VERSION: 'Ссылка переведена на новую версию теста',
};

const AUDIT_FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  name: 'Имя',
  role: 'Роль',
  status: 'Доступ',
  title: 'Название',
  versionNumber: 'Версия',
  model: 'Модель',
  temperature: 'Температура',
  prompt: 'Текст промпта',
  publishedVersionNumber: 'Опубликованная версия',
  version: 'Версия политики',
  publishedAt: 'Дата публикации',
  operatorFullName: 'Оператор персональных данных',
  content: 'Текст политики',
  publicUrl: 'Адрес атласа профессий',
  apiUrl: 'Адрес API атласа профессий',
  shortCode: 'Код ссылки',
  topicVersionNumber: 'Версия теста',
  isActive: 'Ссылка активна',
  startsAt: 'Начало доступа',
  endsAt: 'Окончание доступа',
  entryProfileMode: 'Анкета',
  publicTemplate: 'Шаблон',
  maxAttemptsPerStudent: 'Попыток на участника',
  timeLimitMinutes: 'Лимит времени, мин',
  allowResume: 'Можно продолжить прохождение',
  educationOrganizationId: 'Учебное заведение',
  personalDataProcessingMode: 'Оператор персональных данных',
  consentVersion: 'Версия согласия',
  consentText: 'Текст согласия',
  publicBranding: 'Оформление страницы',
};

const VALUE_LABELS: Record<string, Record<string, string>> = {
  role: { ADMIN: 'Администратор', USER: 'Пользователь' },
  status: { ACTIVE: 'включен', DEACTIVATED: 'отключен' },
  isActive: { true: 'да', false: 'нет' },
  allowResume: { true: 'да', false: 'нет' },
  entryProfileMode: entryProfileModeLabels,
  publicTemplate: publicTemplateLabels,
  personalDataProcessingMode: {
    PUBLIC: 'платформа',
    ON_BEHALF_OF_EDUCATION_ORGANIZATION: 'учебное заведение',
  },
};

const DATE_FIELDS = new Set(['publishedAt', 'startsAt', 'endsAt']);
const VERSION_FIELDS = new Set(['versionNumber', 'topicVersionNumber', 'publishedVersionNumber']);

const formatAuditValue = (field: string, value: string | null) => {
  if (value === null) {
    return '—';
  }

  if (DATE_FIELDS.has(field)) {
    return formatDateTime(value);
  }

  if (VERSION_FIELDS.has(field)) {
    return `v${value}`;
  }

  return VALUE_LABELS[field]?.[value] ?? value;
};

export const getAuditActionLabel = (action: string) => AUDIT_ACTION_LABELS[action] ?? action;

/**
 * Поле и его значения до и после. У скрытых полей — текстов промпта, политики, согласия — журнал
 * хранит только факт изменения, поэтому оба значения пустые.
 */
export const formatAuditChange = ({
  field,
  before,
  after,
}: AuditHistoryResponseDtoEventsItemChangesItem) => {
  const fieldLabel = AUDIT_FIELD_LABELS[field] ?? field;

  if (before === null && after === null) {
    return `${fieldLabel}: изменен`;
  }

  return `${fieldLabel}: ${formatAuditValue(field, before)} → ${formatAuditValue(field, after)}`;
};

export const getAuditActorLabel = (actor: AuditHistoryResponseDtoEventsItemActor | null) =>
  actor ? (actor.name ?? actor.email) : 'Автор неизвестен';
