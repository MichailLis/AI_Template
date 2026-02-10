import { createZodDto } from 'nestjs-zod';
import { BookmarkSchema } from '../../generated/zod';

export const CreateBookmarkSchema = BookmarkSchema.pick({
  title: true,
  url: true,
});

export class CreateBookmarkDto extends createZodDto(CreateBookmarkSchema) {}
