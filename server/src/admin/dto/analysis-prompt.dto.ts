import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const IsoDateStringSchema = z.string().datetime();

export const AnalysisPromptVersionStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const AnalysisPromptVersionSchema = z.object({
  id: z.number(),
  promptId: z.number(),
  versionNumber: z.number(),
  status: AnalysisPromptVersionStatusSchema,
  model: z.string(),
  temperature: z.number().min(0).max(2),
  prompt: z.string(),
  publishedAt: IsoDateStringSchema.nullable(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});

export const AnalysisPromptSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
  versions: z.array(AnalysisPromptVersionSchema),
});

export const AnalysisPromptListResponseSchema = z.object({
  prompts: z.array(AnalysisPromptSchema),
});

export const AnalysisPromptResponseSchema = z.object({
  prompt: AnalysisPromptSchema,
});

export const AnalysisPromptVersionResponseSchema = z.object({
  version: AnalysisPromptVersionSchema,
});

export const CreateAnalysisPromptSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  model: z.string().trim().min(1),
  temperature: z.number().min(0).max(2).default(0.2),
  prompt: z.string().trim().min(1).max(12000),
});

export const UpdateAnalysisPromptVersionSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  model: z.string().trim().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  prompt: z.string().trim().min(1).max(12000).optional(),
});

export const PublishAnalysisPromptVersionSchema = z.object({
  versionId: z.number().int().min(1),
});

export const PromptSimulationRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(12000),
  model: z.string().trim().min(1),
  temperature: z.number().min(0).max(2).default(0.2),
  questionIds: z.array(z.number().int().min(1)).min(1),
  generateAnswers: z.boolean().default(true),
});

export const PromptSimulationResponseSchema = z.object({
  model: z.string(),
  output: z.string(),
  syntheticAnswers: z.unknown().nullable(),
  questionCount: z.number().int().min(0),
});

export class AnalysisPromptListResponseDto extends createZodDto(AnalysisPromptListResponseSchema) {}
export class AnalysisPromptResponseDto extends createZodDto(AnalysisPromptResponseSchema) {}
export class AnalysisPromptVersionResponseDto extends createZodDto(
  AnalysisPromptVersionResponseSchema,
) {}
export class CreateAnalysisPromptDto extends createZodDto(CreateAnalysisPromptSchema) {}
export class UpdateAnalysisPromptVersionDto extends createZodDto(
  UpdateAnalysisPromptVersionSchema,
) {}
export class PublishAnalysisPromptVersionDto extends createZodDto(
  PublishAnalysisPromptVersionSchema,
) {}
export class PromptSimulationRequestDto extends createZodDto(PromptSimulationRequestSchema) {}
export class PromptSimulationResponseDto extends createZodDto(PromptSimulationResponseSchema) {}
