import { cleanup, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

  it('stores the access window as local date and time', async () => {
    const user = userEvent.setup();
    const form = renderSection();

    await user.type(screen.getByLabelText('Открыть с'), '121120261000');

    expect(form.getValues('startsAt')).toBe('2026-11-12T10:00');
    expect(screen.getByLabelText('Открыть с')).toHaveValue('12.11.2026 10:00');
  });

  it('explains that the window closes before it opens and keeps the form readable', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.type(screen.getByLabelText('Открыть с'), '121120261000');
    await user.type(screen.getByLabelText('Закрыть в'), '121120260900');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Время «Закрыть в» должно быть позже «Открыть с».',
    );
  });

  it('reports an unfinished window date so the wizard can block creation', async () => {
    const user = userEvent.setup();
    const onDraftValidityChange = vi.fn();
    const form = createForm();
    render(
      <PublicLinkAccessSettingsSection
        form={form}
        onAccessWindowDraftValidityChange={onDraftValidityChange}
      />,
    );

    await user.type(screen.getByLabelText('Закрыть в'), '1211');

    expect(onDraftValidityChange).toHaveBeenLastCalledWith(false);
    expect(form.getValues('endsAt')).toBe('');
  });
});
