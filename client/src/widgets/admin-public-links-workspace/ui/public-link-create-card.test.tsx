import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicLinkCreateDialog } from './public-link-create-card';

import type { PublicLinkCreateCardProps } from './public-link-create-card.types';

const buildProps = (
  overrides: Partial<PublicLinkCreateCardProps> = {},
): PublicLinkCreateCardProps => ({
  topics: [{ id: 1, draftTitle: 'Профориентационный тест', publishedVersionNumber: 1 }],
  educationOrganizations: [],
  effectiveSelectedTopicId: 1,
  onSelectTopic: vi.fn(),
  newEducationOrganizationId: null,
  onEducationOrganizationSelect: vi.fn(),
  newPersonalDataProcessingMode: 'PUBLIC',
  onPersonalDataProcessingModeChange: vi.fn(),
  newEducationOrganizationName: '',
  onEducationOrganizationNameChange: vi.fn(),
  groupValidationMode: 'NONE',
  onGroupValidationModeChange: vi.fn(),
  groupValidationPattern: '',
  onGroupValidationPatternChange: vi.fn(),
  groupValidationExample: '',
  onGroupValidationExampleChange: vi.fn(),
  groupValidationHint: '',
  onGroupValidationHintChange: vi.fn(),
  onCreateEducationOrganization: vi.fn(),
  onUpdateEducationOrganization: vi.fn(),
  isCreatingEducationOrganization: false,
  isUpdatingEducationOrganization: false,
  newPublicShortCode: '',
  onShortCodeChange: vi.fn(),
  newPublicTemplate: 'STANDARD',
  onPublicTemplateChange: vi.fn(),
  newPublicEntryProfileMode: 'EDUCATION',
  onEntryProfileModeChange: vi.fn(),
  newPublicMaxAttempts: '1',
  onMaxAttemptsChange: vi.fn(),
  newPublicTimeLimit: '30',
  onTimeLimitChange: vi.fn(),
  newPublicConsentVersion: '',
  onConsentVersionChange: vi.fn(),
  newPublicConsentText: '',
  onConsentTextChange: vi.fn(),
  newPublicAllowResume: true,
  onAllowResumeChange: vi.fn(),
  onCreatePublicLink: vi.fn(),
  isCreatingPublicLink: false,
  hasPublishedVersion: true,
  ...overrides,
});

const renderDialog = (overrides: Partial<PublicLinkCreateCardProps> = {}) =>
  render(<PublicLinkCreateDialog open onOpenChange={vi.fn()} {...buildProps(overrides)} />);

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
