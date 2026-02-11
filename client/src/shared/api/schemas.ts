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

export const bookmarkSchema = z.object({
  title: z.string().min(2, 'Title is too short'),
  url: z.string().url('Enter a valid URL'),
});

export const snippetSchema = z.object({
  title: z.string().min(2, 'Title is too short'),
  content: z.string().min(3, 'Content is too short'),
});

export const newsSchema = z.object({
  title: z.string().min(2, 'Title is too short'),
  content: z.string().min(10, 'News content is too short'),
});

export const calculatorSchema = z.object({
  expression: z.string().min(1, 'Expression is required'),
});

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type BookmarkInput = z.infer<typeof bookmarkSchema>;
export type SnippetInput = z.infer<typeof snippetSchema>;
export type NewsInput = z.infer<typeof newsSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
