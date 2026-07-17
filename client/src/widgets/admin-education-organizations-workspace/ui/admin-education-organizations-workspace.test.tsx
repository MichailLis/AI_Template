import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminEducationOrganizationsWorkspace } from './admin-education-organizations-workspace';

import type { AdminEducationOrganizationsListResponseDtoOrganizationsItem } from '@/shared/api/model';

const apiMocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  refetch: vi.fn(),
}));

const organization = vi.hoisted(() => ({
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
  groupValidationMode: 'NONE' as const,
  groupValidationPattern: null,
  groupValidationExample: null,
  groupValidationHint: null,
  linksCount: 1,
  activeLinksCount: 1,
  attemptsCount: 2,
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T00:00:00.000Z',
})) satisfies AdminEducationOrganizationsListResponseDtoOrganizationsItem;

vi.mock('@/shared/api/generated/tests/tests', () => ({
  useTestsAdminEducationOrganizationsControllerListEducationOrganizations: () => ({
    data: {
      organizations: [organization],
      page: 1,
      total: 1,
      totalPages: 1,
    },
    isFetching: false,
    refetch: apiMocks.refetch,
  }),
  useTestsAdminEducationOrganizationsControllerCreateEducationOrganization: () => ({
    mutateAsync: apiMocks.create,
  }),
  useTestsAdminEducationOrganizationsControllerUpdateEducationOrganization: () => ({
    mutateAsync: apiMocks.update,
  }),
}));

const renderWorkspace = () =>
  render(
    <MemoryRouter>
      <AdminEducationOrganizationsWorkspace />
    </MemoryRouter>,
  );

describe('AdminEducationOrganizationsWorkspace', () => {
  beforeEach(() => {
    apiMocks.create.mockResolvedValue(organization);
    apiMocks.update.mockResolvedValue(organization);
    apiMocks.refetch.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('keeps forms unmounted until create or edit is requested', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    expect(screen.queryByLabelText('Название *')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Добавить заведение' }));
    expect(screen.getByRole('dialog', { name: 'Новое учебное заведение' })).toBeInTheDocument();
    expect(screen.getByLabelText('Название *')).toHaveValue('');

    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(screen.queryByLabelText('Название *')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Редактировать Лицей 42' }));
    expect(screen.getByRole('dialog', { name: 'Редактирование заведения' })).toBeInTheDocument();
    expect(screen.getByLabelText('Название *')).toHaveValue('Лицей 42');
  });

  it('creates an organization, refetches page one and closes the editor', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole('button', { name: 'Добавить заведение' }));
    await user.type(screen.getByLabelText('Название *'), 'Гимназия 7');
    await user.click(screen.getByRole('button', { name: 'Создать заведение' }));

    expect(apiMocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Гимназия 7' }),
    });
    expect(apiMocks.refetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Название *')).not.toBeInTheDocument();
  });
});
