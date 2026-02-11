import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateTaskStatusSchema = z.object({
  done: z.boolean().describe('Task completion status'),
});

export class UpdateTaskStatusDto extends createZodDto(UpdateTaskStatusSchema) {}
