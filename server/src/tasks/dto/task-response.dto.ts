import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TaskResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  done: z.boolean(),
  userId: z.number(),
  createdAt: z.string().describe('ISO Date string'),
  updatedAt: z.string().describe('ISO Date string'),
});

export class TaskResponseDto extends createZodDto(TaskResponseSchema) {}
