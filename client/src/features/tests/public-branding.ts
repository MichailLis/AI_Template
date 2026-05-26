import type { PublicLinkAccessResponseDtoPublicBranding } from '@/shared/api/model';
import type { CSSProperties } from 'react';

export type PublicBrandingConfig = PublicLinkAccessResponseDtoPublicBranding;

export interface PublicBrandingLogo {
  url: string;
  alt: string;
  size: 'sm' | 'md' | 'lg';
}

export type PublicBrandingStyle = CSSProperties & Record<`--${string}`, string>;

export interface ResolvedPublicBrandingTheme {
  className: string;
  style: PublicBrandingStyle;
  logos: PublicBrandingLogo[];
  backgroundMode: 'default' | 'solid' | 'image';
  backgroundImageUrl?: string;
  backgroundOverlay: number;
}

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const isHexColor = (value: string | undefined): value is string =>
  Boolean(value && HEX_COLOR_PATTERN.test(value));

const normalizeHexColor = (hex: string) => {
  const value = hex.replace('#', '');

  if (value.length === 3) {
    return value
      .split('')
      .map((character) => `${character}${character}`)
      .join('');
  }

  return value;
};

const roundPercent = (value: number) => Math.round(value * 100);

export const hexToHslToken = (hex: string) => {
  const normalized = normalizeHexColor(hex);
  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) {
    return `0 0% ${roundPercent(lightness)}%`;
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  if (max === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return `${Math.round(hue * 60)} ${roundPercent(saturation)}% ${roundPercent(lightness)}%`;
};

const setHslVariable = (
  style: PublicBrandingStyle,
  name: `--${string}`,
  color: string | undefined,
) => {
  if (isHexColor(color)) {
    style[name] = hexToHslToken(color);
  }
};

const resolveLogos = (branding: NonNullable<PublicBrandingConfig>): PublicBrandingLogo[] =>
  (branding.header?.logos ?? []).slice(0, 2).map((logo) => ({
    url: logo.url,
    alt: logo.alt,
    size: logo.size ?? 'md',
  }));

export const resolvePublicBrandingTheme = (
  branding: PublicBrandingConfig,
): ResolvedPublicBrandingTheme => {
  if (!branding) {
    return {
      className: '',
      style: {},
      logos: [],
      backgroundMode: 'default',
      backgroundImageUrl: undefined,
      backgroundOverlay: 0,
    };
  }

  const style: PublicBrandingStyle = {};

  setHslVariable(style, '--background', branding.background?.color);
  setHslVariable(style, '--primary', branding.buttons?.primaryColor);
  setHslVariable(style, '--ring', branding.buttons?.primaryColor);
  setHslVariable(style, '--primary-foreground', branding.buttons?.textColor);
  setHslVariable(style, '--accent', branding.accents?.accentColor);
  setHslVariable(style, '--secondary', branding.accents?.accentColor);
  setHslVariable(style, '--card', branding.surfaces?.cardColor);
  setHslVariable(style, '--popover', branding.surfaces?.cardColor);
  setHslVariable(style, '--border', branding.surfaces?.borderColor);
  setHslVariable(style, '--input', branding.surfaces?.borderColor);

  const backgroundMode = branding.background?.mode ?? 'default';
  const backgroundImageUrl = backgroundMode === 'image' ? branding.background?.imageUrl : undefined;

  return {
    className: 'theme-public--branded',
    style,
    logos: resolveLogos(branding),
    backgroundMode,
    backgroundImageUrl,
    backgroundOverlay: branding.background?.overlay ?? 0,
  };
};
