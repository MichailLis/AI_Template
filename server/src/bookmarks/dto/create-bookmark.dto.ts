import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateBookmarkSchema = z.object({
  title: z.string().min(1).describe('Bookmark title'),
  url: z.string().url().describe('Bookmark URL'),
});

export class CreateBookmarkDto extends createZodDto(CreateBookmarkSchema) {}
