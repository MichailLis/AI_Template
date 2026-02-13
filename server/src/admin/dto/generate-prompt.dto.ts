import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GeneratePromptSchema = z.object({
  model: z.string().min(1),
  prompt: z.string().min(1).max(8000),
  temperature: z.number().min(0).max(2).optional(),
  responseFormat: z.enum(['text', 'json']).default('text'),
});

export class GeneratePromptDto extends createZodDto(GeneratePromptSchema) {}
