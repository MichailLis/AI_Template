import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { EmailSchema, NewPasswordSchema, UserNameSchema } from '../../auth/dto/auth.dto';

export const CreateUserSchema = z.object({
  email: EmailSchema,
  name: UserNameSchema.optional(),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  /** Omit to let the server generate one; it is returned once in `generatedPassword`. */
  password: NewPasswordSchema.optional(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
