import { cleanup, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';

import { CREATE_PUBLIC_LINK_DEFAULTS } from './admin-public-links-workspace.helpers';
import { PublicLinkAccessSettingsSection } from './public-link-access-settings-section';

import type { CreatePublicLinkValues } from './public-link-create-card.types';

const createForm = () =>
  renderHook(() => useForm<CreatePublicLinkValues>({ defaultValues: CREATE_PUBLIC_LINK_DEFAULTS }))
    .result.current;

const renderSection = () => {
  const form = createForm();
  render(<PublicLinkAccessSettingsSection form={form} />);
  return form;
};

describe('PublicLinkAccessSettingsSection', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows current public test template by default and stores Polus selection', async () => {
    const user = userEvent.setup();
    const form = renderSection();

    const templateSelect = screen.getByLabelText('Шаблон публичного теста');
    expect(templateSelect).toHaveValue('STANDARD');

    await user.selectOptions(templateSelect, 'POLUS');

    expect(form.getValues('publicTemplate')).toBe('POLUS');
  });

  it('locks the attempt limit to 1 for the demographic profile and restores it otherwise', async () => {
    const user = userEvent.setup();
    const form = renderSection();

    expect(screen.getByLabelText('Лимит попыток')).toHaveValue(1);
    expect(screen.getByLabelText('Лимит попыток')).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Анкета перед тестом'), 'EDUCATION_DEMOGRAPHIC');

    expect(form.getValues('entryProfileMode')).toBe('EDUCATION_DEMOGRAPHIC');
    expect(screen.getByLabelText('Лимит попыток')).toBeEnabled();
    expect(screen.getByLabelText('Лимит попыток')).toHaveValue(3);
  });

  it('upper-cases the short code as it is typed', async () => {
    const user = userEvent.setup();
    const form = renderSection();

    await user.type(screen.getByLabelText('Короткий код (опционально)'), 'test26');

    expect(screen.getByLabelText('Короткий код (опционально)')).toHaveValue('TEST26');
    expect(form.getValues('shortCode')).toBe('TEST26');
  });
});
