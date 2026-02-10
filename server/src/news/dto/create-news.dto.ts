import { createZodDto } from 'nestjs-zod';
import { NewsSchema } from '../../generated/zod';

export const CreateNewsSchema = NewsSchema.pick({
  title: true,
  content: true,
});

export class CreateNewsDto extends createZodDto(CreateNewsSchema) {}
