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

    expect(screen.getByText('Реквизиты заполнены')).toBeInTheDocument();
    expect(screen.getByText('Реквизиты не заполнены')).toBeInTheDocument();
  });

  /**
   * Находка аудита UX-15: бейдж «Реквизиты не заполнены» стоял у всех заведений, включая те, где
   * работают ссылки, и не говорил, что именно он блокирует.
   */
  it('says what unfilled personal data details block', () => {
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

    expect(screen.getAllByText('Ссылки от имени заведения недоступны')).toHaveLength(1);
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
