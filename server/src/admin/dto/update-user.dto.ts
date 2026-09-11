import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { EmailSchema, UserNameSchema } from '../../auth/dto/auth.dto';

export const UpdateUserSchema = z.object({
  email: EmailSchema.optional(),
  /** `null` clears the name; an omitted field is left unchanged. */
  name: UserNameSchema.nullable().optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
