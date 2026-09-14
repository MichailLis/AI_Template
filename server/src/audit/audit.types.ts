import type { AuditEntityType } from '@prisma/client';

/**
 * Действия, которые попадают в журнал. Строка, а не enum в базе: новое действие не должно требовать
 * миграции, а клиент показывает неизвестное действие как есть.
 */
export const AUDIT_ACTIONS = [
  'USER_CREATED',
  'USER_UPDATED',
  'USER_ROLE_CHANGED',
  'USER_STATUS_CHANGED',
  'USER_PASSWORD_RESET',
  'USER_SESSIONS_REVOKED',
  'PROMPT_CREATED',
  'PROMPT_VERSION_CREATED',
  'PROMPT_VERSION_PUBLISHED',
  'PROMPT_ARCHIVED',
  'SETTING_UPDATED',
  'PUBLIC_LINK_CREATED',
  'PUBLIC_LINK_UPDATED',
  'PUBLIC_LINK_CODE_REGENERATED',
  'PUBLIC_LINK_ARCHIVED',
  'PUBLIC_LINK_RESTORED',
  'PUBLIC_LINK_MOVED_TO_ACTIVE_VERSION',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type { AuditEntityType };

/** Одно изменившееся поле. Значения — текст; у скрытых полей оба значения равны null. */
export interface AuditChange {
  field: string;
  before: string | null;
  after: string | null;
}
