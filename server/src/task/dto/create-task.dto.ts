import { createZodDto } from 'nestjs-zod';
import { TaskSchema } from '../../generated/zod';

export const CreateTaskSchema = TaskSchema.pick({
  title: true,
});

export class CreateTaskDto extends createZodDto(CreateTaskSchema) {}
