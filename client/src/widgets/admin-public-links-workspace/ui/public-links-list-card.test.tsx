import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicLinksListCard } from './public-links-list-card';

const baseHandlers = {
  onRetryPublicLinks: vi.fn(),
  onCopyShortLink: vi.fn(),
  onOpenShortLink: vi.fn(),
  onOpenQr: vi.fn(),
  onTogglePublicLink: vi.fn(),
  onRegenerateShortCode: vi.fn(),
  onArchivePublicLink: vi.fn(),
  onRestorePublicLink: vi.fn(),
  onOpenBrandingBuilder: vi.fn(),
  onMoveToActiveVersion: vi.fn(),
  isUpdatingPublicLink: false,
  isRegeneratingShortCode: false,
  isArchivingPublicLink: false,
  isRestoringPublicLink: false,
};

/** Ссылка ведёт на опубликованную версию теста — отставания нет. */
const upToDateVersion = {
  publishedVersionId: 50,
  topicVersionNumber: 1,
  activePublishedVersionId: 50,
  activePublishedVersionNumber: 1,
};

const renderLinks = (links: Parameters<typeof PublicLinksListCard>[0]['visiblePublicLinks']) =>
  render(
    <PublicLinksListCard
      publicLinksTab="active"
      visiblePublicLinks={links}
      publicLinksLoading={false}
      publicLinksError={false}
      searchValue=""
      {...baseHandlers}
    />,
  );

const formatExpectedPublicLinkCreatedAt = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

describe('PublicLinksListCard', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the entry profile mode and created date for hybrid public links', () => {
    const createdAt = '2026-05-19T10:30:00.000Z';
    const hybridLink = {
      id: 42,
      shortCode: 'HYBRID2026',
      title: 'Профориентационный тест',
      educationOrganizationName: 'Лицей',
      publicTemplate: 'POLUS' as const,
      entryProfileMode: 'EDUCATION_DEMOGRAPHIC' as const,
      createdAt,
      archivedAt: null,
      topicArchivedAt: null,
      isActive: true,
      ...upToDateVersion,
    };

    render(
      <PublicLinksListCard
        publicLinksTab="active"
        visiblePublicLinks={[hybridLink]}
        publicLinksLoading={false}
        publicLinksError={false}
        searchValue=""
        {...baseHandlers}
      />,
    );

    expect(screen.getByText('Анкета: Учебная + демографическая')).toBeInTheDocument();
    expect(
      screen.getByText(`Создана: ${formatExpectedPublicLinkCreatedAt(createdAt)}`),
    ).toBeInTheDocument();
  });

  it('reports that the test is archived instead of calling its link active', () => {
    const archivedTopicLink = {
      id: 7,
      shortCode: 'AUDITA01',
      title: 'AUDIT-A',
      educationOrganizationName: null,
      publicTemplate: 'STANDARD' as const,
      entryProfileMode: 'EDUCATION' as const,
      createdAt: '2026-05-19T10:30:00.000Z',
      archivedAt: null,
      topicArchivedAt: '2026-09-11T10:00:00.000Z',
      isActive: true,
      ...upToDateVersion,
    };

    render(
      <PublicLinksListCard
        publicLinksTab="active"
        visiblePublicLinks={[archivedTopicLink]}
        publicLinksLoading={false}
        publicLinksError={false}
        searchValue=""
        {...baseHandlers}
      />,
    );

    expect(screen.getByText('Тест в архиве')).toBeInTheDocument();
    expect(screen.queryByText('Активна')).not.toBeInTheDocument();
    expect(screen.getByText('Доступ закрыт для участников')).toBeInTheDocument();
  });

  it('opens the page styling action for active STANDARD links', async () => {
    const user = userEvent.setup();
    const standardLink = {
      id: 43,
      shortCode: 'BRAND2026',
      title: 'Профориентационный тест',
      educationOrganizationName: null,
      publicTemplate: 'STANDARD' as const,
      entryProfileMode: 'EDUCATION' as const,
      createdAt: '2026-05-19T10:30:00.000Z',
      archivedAt: null,
      topicArchivedAt: null,
      isActive: true,
      ...upToDateVersion,
    };

    render(
      <PublicLinksListCard
        publicLinksTab="active"
        visiblePublicLinks={[standardLink]}
        publicLinksLoading={false}
        publicLinksError={false}
        searchValue=""
        {...baseHandlers}
      />,
    );

    await user.click(screen.getByLabelText('Действия публичной ссылки'));
    await user.click(screen.getByRole('button', { name: /оформление страницы/i }));

    expect(baseHandlers.onOpenBrandingBuilder).toHaveBeenCalledWith(standardLink);
  });
});

/**
 * Находка аудита UX-04: бейдж «Текущий» означал шаблон страницы, а читался как «текущая версия
 * теста». Ссылка остаётся на своей версии (решение ait-rcw.2), но версию и отставание не было видно.
 */
describe('PublicLinksListCard test version', () => {
  const outdatedLink = {
    id: 61,
    shortCode: 'OLDV2026',
    title: 'Профориентационный тест',
    educationOrganizationName: null,
    publicTemplate: 'STANDARD' as const,
    entryProfileMode: 'EDUCATION' as const,
    createdAt: '2026-05-19T10:30:00.000Z',
    archivedAt: null,
    topicArchivedAt: null,
    isActive: true,
    publishedVersionId: 50,
    topicVersionNumber: 1,
    activePublishedVersionId: 51,
    activePublishedVersionNumber: 2,
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('labels the page template and the entry form instead of showing bare values', () => {
    renderLinks([{ ...outdatedLink, ...upToDateVersion }]);

    expect(screen.getByText('Шаблон: Стандартный')).toBeInTheDocument();
    expect(screen.getByText('Анкета: Учебная')).toBeInTheDocument();
    expect(screen.queryByText('Текущий')).not.toBeInTheDocument();
  });

  it('shows the version the link serves and the newer published version', () => {
    renderLinks([outdatedLink]);

    expect(screen.getByText('Тест v1')).toBeInTheDocument();
    expect(screen.getByText('есть v2')).toBeInTheDocument();
  });

  it('does not flag a link that already serves the published version', () => {
    renderLinks([{ ...outdatedLink, ...upToDateVersion }]);

    expect(screen.getByText('Тест v1')).toBeInTheDocument();
    expect(screen.queryByText(/есть v/)).not.toBeInTheDocument();
  });

  it('offers to move an outdated link to the published version', async () => {
    const user = userEvent.setup();
    renderLinks([outdatedLink]);

    await user.click(screen.getByLabelText('Действия публичной ссылки'));
    await user.click(screen.getByRole('button', { name: 'Перевести на v2' }));

    expect(baseHandlers.onMoveToActiveVersion).toHaveBeenCalledWith(outdatedLink);
  });

  it('does not offer the move for a link that already serves the published version', async () => {
    const user = userEvent.setup();
    renderLinks([{ ...outdatedLink, ...upToDateVersion }]);

    await user.click(screen.getByLabelText('Действия публичной ссылки'));

    expect(screen.queryByRole('button', { name: /Перевести на/ })).not.toBeInTheDocument();
  });
});
