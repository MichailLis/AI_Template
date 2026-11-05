import { createZodDto } from '../../common/zod-dto';
import { z } from 'zod';

import { AI_USAGE_PURPOSES } from '../../ai-provider/ai-usage';

/**
 * Начало периода. Границы «сегодня», «7 дней» и «30 дней» считает браузер по своему часовому поясу
 * и присылает моментом, поэтому сервер часовой пояс не угадывает. Конец периода — «сейчас».
 */
export const AdminAiUsageQuerySchema = z.object({
  from: z.string().datetime({ offset: true }),
});

/** Итог по группе вызовов; `cost` — Decimal строкой в единицах счёта провайдера. */
const AiUsageBucketSchema = z.object({
  calls: z.number().int(),
  failedCalls: z.number().int(),
  callsWithoutCost: z.number().int(),
  promptTokens: z.number().int(),
  completionTokens: z.number().int(),
  totalTokens: z.number().int(),
  cost: z.string(),
});

export const AdminAiUsageSummaryResponseSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  totals: AiUsageBucketSchema,
  byPurpose: z.array(AiUsageBucketSchema.extend({ purpose: z.enum(AI_USAGE_PURPOSES) })),
  byModel: z.array(AiUsageBucketSchema.extend({ model: z.string() })),
});

export class AdminAiUsageQueryDto extends createZodDto(AdminAiUsageQuerySchema) {}
export class AdminAiUsageSummaryResponseDto extends createZodDto(
  AdminAiUsageSummaryResponseSchema,
) {}
