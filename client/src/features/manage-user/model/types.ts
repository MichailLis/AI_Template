import type { AdminUsersResponseDtoUsersItem } from '@/shared/api/model';

export type AdminUser = AdminUsersResponseDtoUsersItem;
export type UserRole = AdminUser['role'];

/** Пароль, который сервер сгенерировал и вернул один раз; после закрытия окна он недоступен. */
export interface IssuedCredentials {
  email: string;
  password: string;
  reason: 'created' | 'reset';
}
