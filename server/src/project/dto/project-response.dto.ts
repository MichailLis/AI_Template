import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ProjectSchema } from '../../generated/zod';

export const ProjectResponseSchema = ProjectSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class ProjectResponseDto extends createZodDto(ProjectResponseSchema) {}
