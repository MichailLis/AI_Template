import { cleanup, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CREATE_PUBLIC_LINK_DEFAULTS } from './admin-public-links-workspace.helpers';
import { PublicLinkCreateDialog } from './public-link-create-card';

import type {
  CreatePublicLinkValues,
  PublicLinkCreateCardProps,
} from './public-link-create-card.types';

const createForm = () =>
  renderHook(() => useForm<CreatePublicLinkValues>({ defaultValues: CREATE_PUBLIC_LINK_DEFAULTS }))
    .result.current;

type DialogOverrides = Partial<Omit<PublicLinkCreateCardProps, 'form'>>;

const renderDialog = (overrides: DialogOverrides = {}) => {
  const form = createForm();
  render(
    <PublicLinkCreateDialog
      open
      onOpenChange={vi.fn()}
      form={form}
      topics={[{ id: 1, draftTitle: 'Профориентационный тест', publishedVersionNumber: 1 }]}
      educationOrganizations={[]}
      effectiveSelectedTopicId={1}
      onSelectTopic={vi.fn()}
      onCreateEducationOrganization={vi.fn()}
      onEditEducationOrganization={vi.fn()}
      onCreatePublicLink={vi.fn()}
      isCreatingPublicLink={false}
      hasPublishedVersion
      {...overrides}
    />,
  );
  return form;
};

describe('PublicLinkCreateDialog', () => {
  afterEach(cleanup);

  it('opens on the first step and hides the later steps', () => {
    renderDialog();

    expect(screen.getByText('Шаг 1 из 3 · Тест')).toBeInTheDocument();
    expect(screen.getByText('Тест для публикации')).toBeInTheDocument();
    expect(screen.queryByText('Короткий код (опционально)')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Создать ссылку' })).not.toBeInTheDocument();
  });

  it('walks forward to the access step and back again', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    expect(screen.getByText('Шаг 2 из 3 · Учебное заведение')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    expect(screen.getByText('Шаг 3 из 3 · Доступ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Создать ссылку' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Далее' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByText('Шаг 2 из 3 · Учебное заведение')).toBeInTheDocument();
  });

  it('keeps typed values when the operator steps back and forth', async () => {
    const user = userEvent.setup();
    const form = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    await user.click(screen.getByLabelText('От имени учебного заведения'));
    await user.click(screen.getByRole('button', { name: 'Далее' }));
    await user.type(screen.getByLabelText('Короткий код (опционально)'), 'keep');
    await user.click(screen.getByRole('button', { name: 'Назад' }));

    expect(screen.getByLabelText('От имени учебного заведения')).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Далее' }));

    expect(screen.getByLabelText('Короткий код (опционально)')).toHaveValue('KEEP');
    expect(form.getValues('personalDataProcessingMode')).toBe(
      'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
    );
  });

  it('keeps a failed creation visible on the last step of the wizard', async () => {
    const user = userEvent.setup();
    renderDialog({ createError: 'Короткий код «MC5CKWDB» уже занят. Укажите другой.' });

    // На первом шаге ошибка предыдущей попытки не показывается: она относится к шагу доступа.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    await user.click(screen.getByRole('button', { name: 'Далее' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Короткий код «MC5CKWDB» уже занят. Укажите другой.',
    );
  });

  it('blocks the first step while the test has no published version', () => {
    renderDialog({ hasPublishedVersion: false });

    expect(screen.getByRole('button', { name: 'Далее' })).toBeDisabled();
    expect(
      screen.getByText(
        'У выбранного теста нет опубликованной версии. Опубликуйте тест, чтобы создать публичную ссылку.',
      ),
    ).toBeInTheDocument();
  });
});
