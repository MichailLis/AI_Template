import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AdminUserResponseSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(['USER', 'ADMIN']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class AdminUserResponseDto extends createZodDto(
  AdminUserResponseSchema,
) {}
