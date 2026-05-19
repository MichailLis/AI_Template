import { cleanup, render, screen } from '@testing-library/react';
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
  isUpdatingPublicLink: false,
  isRegeneratingShortCode: false,
  isArchivingPublicLink: false,
  isRestoringPublicLink: false,
};

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
      isActive: true,
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

    expect(screen.getByText('Учебная + демографическая')).toBeInTheDocument();
    expect(
      screen.getByText(`Создана: ${formatExpectedPublicLinkCreatedAt(createdAt)}`),
    ).toBeInTheDocument();
  });
});
