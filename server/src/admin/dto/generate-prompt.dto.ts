import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const JsonSchemaObjectSchema = z.object({}).passthrough();

const GeneratePromptResponseSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  strict: z.boolean().optional(),
  schema: JsonSchemaObjectSchema,
});

export const GeneratePromptSchema = z.object({
  model: z.string().min(1),
  prompt: z.string().min(1).max(8000),
  temperature: z.number().min(0).max(2).optional(),
  responseFormat: z.enum(['text', 'json']).default('text'),
  responseSchema: GeneratePromptResponseSchema.optional(),
  requireParameters: z.boolean().optional(),
  useResponseHealing: z.boolean().optional(),
});

export class GeneratePromptDto extends createZodDto(GeneratePromptSchema) {}
