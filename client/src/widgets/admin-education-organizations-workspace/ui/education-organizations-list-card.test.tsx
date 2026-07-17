import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EducationOrganizationsListCard } from './education-organizations-list-card';

import type { AdminEducationOrganizationsListResponseDtoOrganizationsItem } from '@/shared/api/model';

const createOrganization = (
  id: number,
  personalDataReady: boolean,
): AdminEducationOrganizationsListResponseDtoOrganizationsItem => ({
  id,
  name: `Лицей ${id}`,
  fullName: 'Заполненное полное имя',
  shortName: 'Краткое имя',
  inn: null,
  ogrn: null,
  legalAddress: null,
  email: null,
  phone: null,
  privacyPolicyUrl: 'https://example.com/privacy',
  consentDocumentUrl: null,
  logoUrl: null,
  personalDataReady,
  isActive: true,
  groupValidationMode: 'NONE',
  groupValidationPattern: null,
  groupValidationExample: null,
  groupValidationHint: null,
  linksCount: 0,
  activeLinksCount: 0,
  attemptsCount: 0,
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T00:00:00.000Z',
});

describe('EducationOrganizationsListCard', () => {
  afterEach(cleanup);

  it('renders readiness directly from the server flag', () => {
    render(
      <EducationOrganizationsListCard
        organizations={[createOrganization(1, true), createOrganization(2, false)]}
        page={1}
        total={2}
        totalPages={1}
        isFetching={false}
        onEditOrganization={vi.fn()}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
      />,
    );

    expect(screen.getByText('ПДн готовы')).toBeInTheDocument();
    expect(screen.getByText('ПДн не готовы')).toBeInTheDocument();
  });

  it('opens the requested organization from a keyboard-accessible edit button', async () => {
    const user = userEvent.setup();
    const onEditOrganization = vi.fn();
    const organization = createOrganization(42, true);

    render(
      <EducationOrganizationsListCard
        organizations={[organization]}
        page={1}
        total={1}
        totalPages={1}
        isFetching={false}
        onEditOrganization={onEditOrganization}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
      />,
    );

    const editButton = screen.getByRole('button', { name: 'Редактировать Лицей 42' });
    editButton.focus();
    await user.keyboard('{Enter}');

    expect(onEditOrganization).toHaveBeenCalledWith(organization);
  });
});
