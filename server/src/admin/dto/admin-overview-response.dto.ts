import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AdminCardSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number(),
  trend: z.string(),
});

const AdminShortcutSchema = z.object({
  id: z.string(),
  label: z.string(),
  hint: z.string(),
  path: z.string(),
});

export const AdminOverviewResponseSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  cards: z.array(AdminCardSchema),
  shortcuts: z.array(AdminShortcutSchema),
});

export class AdminOverviewResponseDto extends createZodDto(AdminOverviewResponseSchema) {}
