import { z } from 'zod';

import type { AdminUser } from './admin-users-workspace.types';
import type { CreateUserDto, UpdateUserDto } from '@/shared/api/model';
import type { FieldPath } from 'react-hook-form';

/**
 * Проверяет только то, без чего запрос не имеет смысла. Правила email, имени и пароля живут на
 * сервере (NewPasswordSchema и соседние схемы в server/src/auth/dto/auth.dto.ts): сервер
 * возвращает их ошибки по полям, форма показывает их под полями, и второй копии правил не нужно.
 */
export const adminUserFormSchema = z.object({
  email: z.string().trim().min(1, 'Введите email'),
  name: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  password: z.string(),
});

export type AdminUserFormValues = z.infer<typeof adminUserFormSchema>;

export const getAdminUserFormValues = (user?: AdminUser): AdminUserFormValues => ({
  email: user?.email ?? '',
  name: user?.name ?? '',
  role: user?.role ?? 'USER',
  password: '',
});

export const toCreateUserPayload = (values: AdminUserFormValues): CreateUserDto => {
  const name = values.name.trim();

  return {
    email: values.email.trim(),
    role: values.role,
    ...(name ? { name } : {}),
    // Пустое поле — не пароль, а просьба сгенерировать его на сервере.
    ...(values.password ? { password: values.password } : {}),
  };
};

export const toUpdateUserPayload = (values: AdminUserFormValues): UpdateUserDto => {
  const name = values.name.trim();

  return {
    email: values.email.trim(),
    name: name ? name : null,
  };
};

const FORM_FIELD_NAMES = new Set<FieldPath<AdminUserFormValues>>([
  'email',
  'name',
  'role',
  'password',
]);

export const toAdminUserFormField = (path: string): FieldPath<AdminUserFormValues> | null => {
  const fieldName = path.split('.').at(-1) as FieldPath<AdminUserFormValues>;
  return FORM_FIELD_NAMES.has(fieldName) ? fieldName : null;
};

// Перевод сообщений сервера, а не копия его правил: сами пороги сервер проверяет сам.
const SERVER_FIELD_MESSAGES: Record<string, string> = {
  'Invalid email format': 'Введите корректный email',
  'Name is too short': 'Имя должно содержать минимум 2 символа',
  'Password must be at least 8 characters long': 'Пароль должен содержать минимум 8 символов',
};

export const translateServerFieldMessage = (message: string) =>
  SERVER_FIELD_MESSAGES[message] ?? message;
