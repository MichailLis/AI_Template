import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name is too short').optional(),
});

export const SigninSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string(),
});

export class SignupDto extends createZodDto(SignupSchema) {}
export class SigninDto extends createZodDto(SigninSchema) {}
