import { createZodDto } from '../../common/zod-dto';
import { z } from 'zod';

export const AdminPromptResponseSchema = z.object({
  model: z.string(),
  output: z.string(),
});

export class AdminPromptResponseDto extends createZodDto(AdminPromptResponseSchema) {}
