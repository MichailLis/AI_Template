import { createZodDto } from 'nestjs-zod';
import { SnippetSchema } from '../../generated/zod';

export const CreateSnippetSchema = SnippetSchema.pick({
  title: true,
  content: true,
});

export class CreateSnippetDto extends createZodDto(CreateSnippetSchema) {}
