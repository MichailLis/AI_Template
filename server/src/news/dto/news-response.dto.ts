import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NewsSchema } from '../../generated/zod';

export const NewsResponseSchema = NewsSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class NewsResponseDto extends createZodDto(NewsResponseSchema) {}
