import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

export class UpdateUserRoleDto extends createZodDto(UpdateUserRoleSchema) {}
