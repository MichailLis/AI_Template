import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { AI_PROVIDER_IDS } from '../../ai-provider/ai-provider.config';

export const AiProviderApiKeySourceSchema = z.enum(['DB', 'ENV', 'NONE']);

/**
 * Результат живой проверки связи с провайдером ИИ. Устроен так же, как `coverage` у атласа:
 * статус, время проверки и причина отказа.
 */
export const AiProviderHealthSchema = z.object({
  status: z.enum(['ok', 'failed', 'not_configured']),
  checkedAt: z.string().datetime(),
  errorMessage: z.string().optional(),
});

export const AiProviderSettingsSchema = z.object({
  provider: z.enum(AI_PROVIDER_IDS),
  label: z.string(),
  baseUrl: z.string().nullable(),
  defaultModel: z.string().nullable(),
  isConfigured: z.boolean(),
  maskedValue: z.string().nullable(),
  source: AiProviderApiKeySourceSchema,
  updatedAt: z.string().datetime().nullable(),
  health: AiProviderHealthSchema,
});

export const AdminAiProviderSettingsResponseSchema = z.object({
  aiProvider: AiProviderSettingsSchema,
});

export const UpdateAiProviderSchema = z.object({
  provider: z.enum(AI_PROVIDER_IDS),
  baseUrl: z.string().trim().url().max(2048).nullable(),
  apiKey: z.string().trim().min(1).max(512).optional(),
  clearApiKey: z.boolean().optional(),
  defaultModel: z.string().trim().max(256).nullable(),
});

export const ProfessionAtlasCoverageItemSchema = z.object({
  title: z.string(),
  status: z.enum(['found', 'missing', 'duplicate']),
  matches: z.array(
    z.object({
      title: z.string(),
      slug: z.string(),
      url: z.string().url(),
    }),
  ),
});

export const ProfessionAtlasCoverageResponseSchema = z.object({
  status: z.enum(['ready', 'partial', 'unavailable']),
  checkedAt: z.string().datetime(),
  total: z.number().int().min(0),
  found: z.number().int().min(0),
  missing: z.array(z.string()),
  duplicates: z.array(z.string()),
  items: z.array(ProfessionAtlasCoverageItemSchema),
  errorMessage: z.string().optional(),
});

export const ProfessionAtlasSettingsSchema = z.object({
  url: z.string().url().nullable(),
  publicUrl: z.string().url().nullable(),
  apiUrl: z.string().url().nullable(),
  updatedAt: z.string().datetime().nullable(),
  coverage: ProfessionAtlasCoverageResponseSchema.nullable().optional(),
});

export const AdminProfessionAtlasSettingsResponseSchema = z.object({
  professionAtlas: ProfessionAtlasSettingsSchema,
});

export const PrivacyPolicySettingsSchema = z.object({
  version: z.string(),
  publishedAt: z.string().datetime(),
  content: z.string(),
  operatorFullName: z.string(),
  updatedAt: z.string().datetime().nullable(),
});

export const AdminPrivacyPolicySettingsResponseSchema = z.object({
  privacyPolicy: PrivacyPolicySettingsSchema,
});

export const UpdateProfessionAtlasUrlSchema = z.object({
  publicUrl: z.string().trim().url().max(2048),
  apiUrl: z.string().trim().url().max(2048),
});

export const UpdatePrivacyPolicySchema = z.object({
  version: z.string().trim().min(1).max(64),
  publishedAt: z.string().datetime(),
  content: z.string().trim().min(1).max(160000),
  operatorFullName: z.string().trim().min(1).max(512),
});

export class AdminAiProviderSettingsResponseDto extends createZodDto(
  AdminAiProviderSettingsResponseSchema,
) {}

export class UpdateAiProviderDto extends createZodDto(UpdateAiProviderSchema) {}

export class AdminProfessionAtlasSettingsResponseDto extends createZodDto(
  AdminProfessionAtlasSettingsResponseSchema,
) {}

export class AdminPrivacyPolicySettingsResponseDto extends createZodDto(
  AdminPrivacyPolicySettingsResponseSchema,
) {}

export class ProfessionAtlasCoverageResponseDto extends createZodDto(
  ProfessionAtlasCoverageResponseSchema,
) {}

export class UpdateProfessionAtlasUrlDto extends createZodDto(UpdateProfessionAtlasUrlSchema) {}

export class UpdatePrivacyPolicyDto extends createZodDto(UpdatePrivacyPolicySchema) {}
