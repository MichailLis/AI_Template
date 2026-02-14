import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AdminPromptModelSchema = z.object({
  id: z.string(),
  label: z.string(),
  provider: z.string(),
  isFree: z.boolean(),
  supportsStructuredOutputs: z.boolean(),
  contextLength: z.number().nullable(),
  promptPrice: z.number().nullable(),
  completionPrice: z.number().nullable(),
});

export const AdminPromptModelsResponseSchema = z.object({
  defaultModel: z.string(),
  models: z.array(AdminPromptModelSchema),
});

export class AdminPromptModelsResponseDto extends createZodDto(
  AdminPromptModelsResponseSchema,
) {}
