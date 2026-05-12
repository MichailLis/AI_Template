import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export class RefreshResponseDto extends createZodDto(RefreshResponseSchema) {}
