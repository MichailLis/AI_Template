import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).optional(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
