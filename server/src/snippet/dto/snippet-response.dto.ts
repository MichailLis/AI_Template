import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SnippetSchema } from '../../generated/zod';

export const SnippetResponseSchema = SnippetSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class SnippetResponseDto extends createZodDto(SnippetResponseSchema) {}
