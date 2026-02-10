import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NoteSchema } from '../../generated/zod';

export const NoteResponseSchema = NoteSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class NoteResponseDto extends createZodDto(NoteResponseSchema) {}