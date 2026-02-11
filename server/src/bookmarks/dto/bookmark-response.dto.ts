import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BookmarkResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string(),
  userId: z.number(),
  createdAt: z.string().describe('ISO Date string'),
  updatedAt: z.string().describe('ISO Date string'),
});

export class BookmarkResponseDto extends createZodDto(BookmarkResponseSchema) {}
