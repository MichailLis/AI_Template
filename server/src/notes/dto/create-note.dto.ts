import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateNoteSchema = z.object({
  title: z.string().min(1).describe('The note title'),
  content: z.string().describe('The note content'),
});

export class CreateNoteDto extends createZodDto(CreateNoteSchema) {}
