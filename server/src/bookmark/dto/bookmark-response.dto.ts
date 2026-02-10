import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { BookmarkSchema } from '../../generated/zod';

export const BookmarkResponseSchema = BookmarkSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class BookmarkResponseDto extends createZodDto(BookmarkResponseSchema) {}
