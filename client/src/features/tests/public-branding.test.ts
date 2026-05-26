import { describe, expect, it } from 'vitest';

import { hexToHslToken, resolvePublicBrandingTheme } from './public-branding';

describe('public branding adapter', () => {
  it('returns empty defaults when branding is not configured', () => {
    expect(resolvePublicBrandingTheme(null)).toEqual({
      className: '',
      style: {},
      logos: [],
      backgroundMode: 'default',
      backgroundImageUrl: undefined,
      backgroundOverlay: 0,
    });
  });

  it('maps configured colors to public theme CSS variables', () => {
    expect(
      resolvePublicBrandingTheme({
        version: 1,
        buttons: { primaryColor: '#0066cc', textColor: '#ffffff' },
        accents: { accentColor: '#00a889' },
      }),
    ).toMatchObject({
      className: 'theme-public--branded',
      style: {
        '--primary': '210 100% 40%',
        '--ring': '210 100% 40%',
        '--primary-foreground': '0 0% 100%',
        '--accent': '169 100% 33%',
      },
    });
  });

  it('resolves image backgrounds and header logos', () => {
    const resolved = resolvePublicBrandingTheme({
      version: 1,
      background: {
        mode: 'image',
        color: '#f2f7fb',
        imageUrl: 'https://cdn.example.com/background.png',
        overlay: 0.35,
      },
      header: {
        logos: [
          { url: 'https://cdn.example.com/logo.svg', alt: 'Client logo', size: 'md' },
          { url: 'https://cdn.example.com/partner.svg', alt: 'Partner logo', size: 'sm' },
        ],
      },
    });

    expect(resolved.backgroundMode).toBe('image');
    expect(resolved.backgroundImageUrl).toBe('https://cdn.example.com/background.png');
    expect(resolved.backgroundOverlay).toBe(0.35);
    expect(resolved.style).toMatchObject({ '--background': hexToHslToken('#f2f7fb') });
    expect(resolved.logos).toHaveLength(2);
    expect(resolved.logos[0]).toMatchObject({ alt: 'Client logo', size: 'md' });
  });
});
