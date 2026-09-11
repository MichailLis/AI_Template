import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { AdminUserResponseSchema } from './admin-user-response.dto';

export const AdminUserCredentialsResponseSchema = z.object({
  user: AdminUserResponseSchema,
  /**
   * The password the server generated, shown to the admin exactly once. `null` when the admin
   * supplied the password. Only the argon2 hash is stored, so it cannot be read back later.
   */
  generatedPassword: z.string().nullable(),
});

export class AdminUserCredentialsResponseDto extends createZodDto(
  AdminUserCredentialsResponseSchema,
) {}
