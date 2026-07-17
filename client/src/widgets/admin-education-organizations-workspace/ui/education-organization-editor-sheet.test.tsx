import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EducationOrganizationEditorSheet } from './education-organization-editor-sheet';

import type { AdminEducationOrganizationsListResponseDtoOrganizationsItem } from '@/shared/api/model';

const organization: AdminEducationOrganizationsListResponseDtoOrganizationsItem = {
  id: 42,
  name: 'Лицей 42',
  fullName: 'Полное имя лицея',
  shortName: 'Лицей 42',
  inn: null,
  ogrn: null,
  legalAddress: null,
  email: null,
  phone: null,
  privacyPolicyUrl: 'https://example.com/privacy',
  consentDocumentUrl: null,
  logoUrl: null,
  personalDataReady: true,
  isActive: true,
  groupValidationMode: 'NONE',
  groupValidationPattern: null,
  groupValidationExample: null,
  groupValidationHint: null,
  linksCount: 1,
  activeLinksCount: 1,
  attemptsCount: 2,
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T00:00:00.000Z',
};

describe('EducationOrganizationEditorSheet', () => {
  afterEach(cleanup);

  it('does not mount form fields while closed', () => {
    render(
      <EducationOrganizationEditorSheet
        open={false}
        mode="create"
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('Название *')).not.toBeInTheDocument();
  });

  it('opens an empty create form', () => {
    render(
      <EducationOrganizationEditorSheet open mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />,
    );

    expect(screen.getByRole('dialog', { name: 'Новое учебное заведение' })).toBeInTheDocument();
    expect(screen.getByLabelText('Название *')).toHaveValue('');
    expect(screen.getByText('Заполнение данных ПДн: 0 из 3')).toBeInTheDocument();
  });

  it('opens a populated edit form', () => {
    render(
      <EducationOrganizationEditorSheet
        open
        mode="edit"
        organization={organization}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Редактирование заведения' })).toBeInTheDocument();
    expect(screen.getByLabelText('Название *')).toHaveValue('Лицей 42');
    expect(screen.getByText('Заполнение данных ПДн: 3 из 3')).toBeInTheDocument();
  });

  it('describes filled privacy fields without claiming an inactive organization is ready', () => {
    render(
      <EducationOrganizationEditorSheet
        open
        mode="edit"
        organization={{ ...organization, isActive: false }}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText('Заполнение данных ПДн: 3 из 3')).toBeInTheDocument();
    expect(screen.queryByText('Готовность ПДн: 3 из 3')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Эти поля не блокируют сохранение. Для статуса «ПДн готовы» нужны все три поля и активное заведение.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Заполните все три, чтобы организация была готова/),
    ).not.toBeInTheDocument();
  });

  it('shows validation messages next to fields and focuses the first error', async () => {
    const user = userEvent.setup();

    render(
      <EducationOrganizationEditorSheet open mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />,
    );

    await user.type(screen.getByLabelText('Название *'), 'А');
    await user.click(screen.getByRole('button', { name: 'Создать заведение' }));

    expect(screen.getByText('Название должно содержать не менее 2 символов')).toBeInTheDocument();
    expect(screen.getByLabelText('Название *')).toHaveFocus();
  });

  it('maps server validation details to the matching field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            details: [{ path: 'privacyPolicyUrl', message: 'Ссылка не прошла проверку' }],
          },
        },
      },
    });

    render(
      <EducationOrganizationEditorSheet open mode="create" onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    await user.type(screen.getByLabelText('Название *'), 'Лицей 42');
    await user.type(
      screen.getByLabelText('Политика обработки ПДн'),
      'https://school.example/privacy',
    );
    await user.click(screen.getByRole('button', { name: 'Создать заведение' }));

    expect(await screen.findByText('Ссылка не прошла проверку')).toBeInTheDocument();
    expect(screen.getByLabelText('Политика обработки ПДн')).toHaveFocus();
  });

  it('asks for confirmation before closing a dirty form', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <EducationOrganizationEditorSheet open mode="create" onClose={onClose} onSubmit={vi.fn()} />,
    );

    await user.type(screen.getByLabelText('Название *'), 'Лицей 42');
    await user.click(screen.getByRole('button', { name: 'Отмена' }));

    expect(
      screen.getByRole('alertdialog', { name: 'Закрыть без сохранения?' }),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submits valid values and closes the sheet', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <EducationOrganizationEditorSheet open mode="create" onClose={onClose} onSubmit={onSubmit} />,
    );

    await user.type(screen.getByLabelText('Название *'), 'Лицей 42');
    await user.click(screen.getByRole('button', { name: 'Создать заведение' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Лицей 42' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
