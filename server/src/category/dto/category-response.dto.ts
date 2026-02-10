import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CategorySchema } from '../../generated/zod';

export const CategoryResponseSchema = CategorySchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class CategoryResponseDto extends createZodDto(CategoryResponseSchema) {}
