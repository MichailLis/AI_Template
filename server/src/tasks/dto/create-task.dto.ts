import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1).describe('Task title'),
});

export class CreateTaskDto extends createZodDto(CreateTaskSchema) {}
