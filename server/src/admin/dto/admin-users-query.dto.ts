import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AdminUsersQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export class AdminUsersQueryDto extends createZodDto(AdminUsersQuerySchema) {}
