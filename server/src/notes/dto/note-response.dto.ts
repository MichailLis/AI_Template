import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const NoteResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  userId: z.number(),
  createdAt: z.string().describe('ISO Date string'),
  updatedAt: z.string().describe('ISO Date string'),
});

export class NoteResponseDto extends createZodDto(NoteResponseSchema) {}
