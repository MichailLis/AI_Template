import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCalculationSchema = z.object({
  expression: z.string().describe('The mathematical expression (e.g. "2 + 2")'),
  result: z.string().describe('The calculated result'),
});

export class CreateCalculationDto extends createZodDto(
  CreateCalculationSchema,
) {}
