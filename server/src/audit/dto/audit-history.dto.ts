import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AuditHistoryChangeSchema = z.object({
  field: z.string(),
  /** Текстовое значение до изменения; null — значения не было или поле скрыто. */
  before: z.string().nullable(),
  after: z.string().nullable(),
});

export const AuditHistoryEventSchema = z.object({
  id: z.number().int(),
  action: z.string(),
  /** Автор изменения; null — событие записано без автора или автор удален. */
  actor: z
    .object({
      id: z.number().int(),
      email: z.string(),
      name: z.string().nullable(),
    })
    .nullable(),
  changes: z.array(AuditHistoryChangeSchema),
  createdAt: z.string(),
});

export const AuditHistoryResponseSchema = z.object({
  events: z.array(AuditHistoryEventSchema),
});

export class AuditHistoryResponseDto extends createZodDto(AuditHistoryResponseSchema) {}
