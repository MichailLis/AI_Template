import { createZodDto } from 'nestjs-zod';
import { CategorySchema } from '../../generated/zod';

export const CreateCategorySchema = CategorySchema.pick({
  name: true,
});

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}
