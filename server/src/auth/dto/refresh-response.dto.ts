import { createZodDto } from '../../common/zod-dto';
import { z } from 'zod';

export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
});

export class RefreshResponseDto extends createZodDto(RefreshResponseSchema) {}
