import { Prisma } from '@prisma/client';

import { PublicBrandingConfigSchema, type PublicBrandingConfig } from './dto/tests-public.dto';

type PublicBrandingInput = PublicBrandingConfig | null | undefined;

export const toPrismaPublicBranding = (
  value: PublicBrandingInput,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.DbNull;
  }

  return value;
};

export const toPublicBrandingResponse = (
  value: Prisma.JsonValue | null | undefined,
): PublicBrandingConfig | null => {
  const parsed = PublicBrandingConfigSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
};
