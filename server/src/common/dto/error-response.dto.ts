import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  success: z.boolean(),
  error: z.object({
    statusCode: z.number().int(),
    code: z.string(),
    message: z.string(),
    details: z.array(z.unknown()),
  }),
  timestamp: z.string(),
  path: z.string(),
});

export class ErrorResponseDto extends createZodDto(ErrorResponseSchema) {}
