import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CalculationResponseSchema = z.object({
  id: z.number(),
  expression: z.string(),
  result: z.string(),
  userId: z.number(),
  createdAt: z.string().describe('ISO Date string'),
});

export class CalculationResponseDto extends createZodDto(
  CalculationResponseSchema,
) {}
