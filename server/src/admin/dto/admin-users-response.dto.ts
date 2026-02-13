import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { AdminUserResponseSchema } from './admin-user-response.dto';

export const AdminUsersResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  users: z.array(AdminUserResponseSchema),
});

export class AdminUsersResponseDto extends createZodDto(
  AdminUsersResponseSchema,
) {}
