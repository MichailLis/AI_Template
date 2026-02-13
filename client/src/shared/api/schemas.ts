import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name is too short'),
});

export const adminOverviewSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  cards: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      value: z.number(),
      trend: z.string(),
    }),
  ),
  shortcuts: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      hint: z.string(),
      path: z.string(),
    }),
  ),
});

export const adminUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

export const adminPromptGenerateSchema = z.object({
  model: z.string().min(1),
  prompt: z.string().min(1).max(8000),
  temperature: z.number().min(0).max(2).default(0.7),
  responseFormat: z.enum(['text', 'json']).default('text'),
});

export const testsTopicCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type AdminUserRoleInput = z.infer<typeof adminUserRoleSchema>;
export type AdminPromptGenerateInput = z.infer<typeof adminPromptGenerateSchema>;
export type TestsTopicCreateInput = z.infer<typeof testsTopicCreateSchema>;
