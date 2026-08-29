import { z } from 'zod';

/**
 * Sign-in only checks that something was entered. A length rule here would validate the wrong
 * side of the exchange: the password either already exists or it does not, so a client-side
 * minimum cannot add security and can only reject credentials the server would have accepted.
 *
 * Rules for *creating* a password belong to the server and live there only — SignupSchema in
 * server/src/auth/dto/auth.dto.ts and bootstrap-admin.ts both require 8. A copy of that rule
 * here would be a second source of truth, and the copy that used to exist had already drifted.
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Enter your password'),
});

/**
 * The three schemas below are declared per feature in `template/features.manifest.json` and
 * checked by `npm run verify:architecture`. They describe each feature's primary payload shape.
 */
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
export type AdminPromptGenerateInput = z.infer<typeof adminPromptGenerateSchema>;
export type TestsTopicCreateInput = z.infer<typeof testsTopicCreateSchema>;
