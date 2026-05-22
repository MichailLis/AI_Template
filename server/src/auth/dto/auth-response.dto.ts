import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserResponseSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().optional().nullable(),
});

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  user: UserResponseSchema,
});

export class AuthResponseDto extends createZodDto(AuthResponseSchema) {}
