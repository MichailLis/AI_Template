import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { NewPasswordSchema } from '../../auth/dto/auth.dto';

export const ResetUserPasswordSchema = z.object({
  /** Omit to let the server generate one; it is returned once in `generatedPassword`. */
  password: NewPasswordSchema.optional(),
});

export class ResetUserPasswordDto extends createZodDto(ResetUserPasswordSchema) {}
