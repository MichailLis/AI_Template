import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const EmailSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.string().email('Invalid email format'),
);

/**
 * Rules for a password being set. Accounts are created only by an admin, so admin DTOs are the
 * callers; bootstrap-admin.ts keeps the same minimum of 8.
 */
export const NewPasswordSchema = z.string().min(8, 'Password must be at least 8 characters long');

export const UserNameSchema = z.string().min(2, 'Name is too short');

export const SigninSchema = z.object({
  email: EmailSchema,
  password: z.string(),
});

export class SigninDto extends createZodDto(SigninSchema) {}
