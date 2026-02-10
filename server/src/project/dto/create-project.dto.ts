import { createZodDto } from 'nestjs-zod';
import { ProjectSchema } from '../../generated/zod';

export const CreateProjectSchema = ProjectSchema.pick({
  title: true,
  description: true,
});

export class CreateProjectDto extends createZodDto(CreateProjectSchema) {}
