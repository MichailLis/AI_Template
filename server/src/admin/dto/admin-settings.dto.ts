import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const OpenRouterApiKeySourceSchema = z.enum(['ENV', 'NONE']);

export const OpenRouterApiKeySettingsSchema = z.object({
  isConfigured: z.boolean(),
  maskedValue: z.string().nullable(),
  source: OpenRouterApiKeySourceSchema,
  updatedAt: z.string().datetime().nullable(),
});

export const AdminOpenRouterSettingsResponseSchema = z.object({
  openRouter: OpenRouterApiKeySettingsSchema,
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

export const UpdateProfessionAtlasUrlSchema = z.object({
  publicUrl: z.string().trim().url().max(2048),
  apiUrl: z.string().trim().url().max(2048),
});

export class AdminOpenRouterSettingsResponseDto extends createZodDto(
  AdminOpenRouterSettingsResponseSchema,
) {}

export class AdminProfessionAtlasSettingsResponseDto extends createZodDto(
  AdminProfessionAtlasSettingsResponseSchema,
) {}

export class ProfessionAtlasCoverageResponseDto extends createZodDto(
  ProfessionAtlasCoverageResponseSchema,
) {}

export class UpdateProfessionAtlasUrlDto extends createZodDto(UpdateProfessionAtlasUrlSchema) {}
