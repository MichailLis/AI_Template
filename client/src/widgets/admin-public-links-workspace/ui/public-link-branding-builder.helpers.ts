import type { PublicBrandingConfig } from '@/features/tests';

export type DraftPublicBrandingConfig = NonNullable<PublicBrandingConfig>;

export const createDefaultBrandingConfig = (): DraftPublicBrandingConfig => ({ version: 1 });

export const createDraftBrandingConfig = (
  branding: PublicBrandingConfig | undefined,
): DraftPublicBrandingConfig => branding ?? createDefaultBrandingConfig();

export const updateBrandingSection = <K extends keyof DraftPublicBrandingConfig>(
  config: DraftPublicBrandingConfig,
  key: K,
  value: DraftPublicBrandingConfig[K],
): DraftPublicBrandingConfig => ({
  ...config,
  [key]: value,
});
