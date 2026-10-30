import { z } from 'zod';

/**
 * Sign-in only checks that something was entered. A length rule here would validate the wrong
 * side of the exchange: the password either already exists or it does not, so a client-side
 * minimum cannot add security and can only reject credentials the server would have accepted.
 *
 * Rules for *creating* a password belong to the server and live there only — NewPasswordSchema in
 * server/src/auth/dto/auth.dto.ts and bootstrap-admin.ts both require 8. A copy of that rule
 * here would be a second source of truth, and the copy that used to exist had already drifted.
 */
export const loginSchema = z.object({
  // Сообщения видит пользователь на русскоязычном экране входа, поэтому они на русском.
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
  rememberDevice: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
