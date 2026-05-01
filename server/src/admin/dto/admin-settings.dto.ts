import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const OpenRouterApiKeySourceSchema = z.enum(['DATABASE', 'ENV', 'NONE']);

export const OpenRouterApiKeySettingsSchema = z.object({
  isConfigured: z.boolean(),
  maskedValue: z.string().nullable(),
  source: OpenRouterApiKeySourceSchema,
  updatedAt: z.string().datetime().nullable(),
});

export const AdminOpenRouterSettingsResponseSchema = z.object({
  openRouter: OpenRouterApiKeySettingsSchema,
});

export const UpdateOpenRouterApiKeySchema = z.object({
  apiKey: z.string().trim().min(1).max(500),
});

export class AdminOpenRouterSettingsResponseDto extends createZodDto(
  AdminOpenRouterSettingsResponseSchema,
) {}

export class UpdateOpenRouterApiKeyDto extends createZodDto(UpdateOpenRouterApiKeySchema) {}
