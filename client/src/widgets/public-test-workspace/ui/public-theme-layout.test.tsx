import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PublicThemeLayout } from './public-theme-layout';

describe('PublicThemeLayout', () => {
  afterEach(() => {
    cleanup();
  });

  it('applies STANDARD branding variables and header logos when configured', () => {
    render(
      <PublicThemeLayout
        branding={{
          version: 1,
          header: {
            logos: [{ url: 'https://cdn.example.com/logo.svg', alt: 'Client logo' }],
          },
          buttons: { primaryColor: '#0066cc', textColor: '#ffffff' },
        }}
      >
        <button type="button">Start</button>
      </PublicThemeLayout>,
    );

    const main = screen.getByRole('main');

    expect(screen.getByAltText('Client logo')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /политика обработки персональных данных/i }),
    ).not.toBeInTheDocument();
    expect(main).toHaveClass('theme-public--branded');
    expect(main.style.getPropertyValue('--primary')).toBe('210 100% 40%');
    expect(main.style.getPropertyValue('--primary-foreground')).toBe('0 0% 100%');
  });
});
