import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicLinkBrandingBuilder } from './public-link-branding-builder';

const standardLink = {
  id: 42,
  shortCode: 'BRAND2026',
  title: 'Профориентационный тест',
  educationOrganizationName: null,
  publicTemplate: 'STANDARD' as const,
  entryProfileMode: 'EDUCATION' as const,
  publicBranding: null,
  createdAt: '2026-05-19T10:30:00.000Z',
  archivedAt: null,
  isActive: true,
};

describe('PublicLinkBrandingBuilder', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('edits the background zone in preview state and saves branding', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <PublicLinkBrandingBuilder
        open
        link={standardLink}
        isSaving={false}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole('button', { name: /фон/i }));
    await user.clear(screen.getByRole('textbox', { name: 'Цвет фона' }));
    await user.type(screen.getByRole('textbox', { name: 'Цвет фона' }), '#f2f7fb');
    await user.click(screen.getByRole('button', { name: /применить/i }));
    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    expect(onSave).toHaveBeenCalledWith(
      standardLink.id,
      expect.objectContaining({
        version: 1,
        background: expect.objectContaining({ mode: 'solid', color: '#f2f7fb' }),
      }),
    );
  });

  it('uses palette swatches to set button colors', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <PublicLinkBrandingBuilder
        open
        link={standardLink}
        isSaving={false}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /кнопки/i })[0]);
    await user.click(screen.getByRole('button', { name: 'Выбрать #ff6b35 для Цвет кнопки' }));
    expect(screen.getByRole('textbox', { name: 'Цвет кнопки' })).toHaveValue('#ff6b35');

    await user.click(screen.getByRole('button', { name: /применить/i }));
    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    expect(onSave).toHaveBeenCalledWith(
      standardLink.id,
      expect.objectContaining({
        version: 1,
        buttons: expect.objectContaining({ primaryColor: '#ff6b35' }),
      }),
    );
  });
});
