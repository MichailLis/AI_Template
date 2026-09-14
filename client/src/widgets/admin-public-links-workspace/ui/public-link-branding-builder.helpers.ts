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

export const isValidHexColor = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed);
};
