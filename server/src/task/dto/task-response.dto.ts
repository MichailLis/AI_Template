import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { TaskSchema } from '../../generated/zod';

export const TaskResponseSchema = TaskSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class TaskResponseDto extends createZodDto(TaskResponseSchema) {}
