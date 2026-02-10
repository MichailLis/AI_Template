import { createZodDto } from 'nestjs-zod';
import { NoteSchema } from '../../generated/zod';

export const CreateNoteSchema = NoteSchema.pick({
  title: true,
  content: true,
});

export class CreateNoteDto extends createZodDto(CreateNoteSchema) {}
