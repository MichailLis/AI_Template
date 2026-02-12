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

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
