import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicLinksAttemptsTableCard } from './public-links-attempts-table-card';

describe('PublicLinksAttemptsTableCard duration and result', () => {
  afterEach(cleanup);

  const baseAttempt = {
    attemptNumber: 1,
    analysisStatus: 'READY',
    analysisResultKind: 'AI',
    llmStatus: null,
    entryProfileMode: 'DEMOGRAPHIC' as const,
    studentName: 'Мария',
    studentLastInitial: null,
    studentMiddleInitial: null,
    educationOrganization: null,
    groupOrClass: null,
    studentGender: 'FEMALE' as const,
    studentAge: 16,
    studentResidence: null,
    studentEducationLevel: null,
    startedAt: '2026-05-18T08:30:00.000Z',
    expiresAt: null,
  };

  it('shows duration and result for finished attempts and a marker for an open one', () => {
    render(
      <PublicLinksAttemptsTableCard
        selectedPublicLink={{ id: 1 }}
        publicAttempts={[
          {
            ...baseAttempt,
            attemptId: 301,
            status: 'COMPLETED',
            finishedAt: '2026-05-18T08:42:05.000Z',
            durationSeconds: 725,
            resultSummary: {
              primaryDirectionLabel: '3D-моделирование',
              profileTitle: 'Широкий профиль',
            },
          },
          {
            ...baseAttempt,
            attemptId: 302,
            attemptNumber: 2,
            status: 'IN_PROGRESS',
            analysisStatus: null,
            analysisResultKind: 'MISSING',
            finishedAt: null,
            durationSeconds: null,
            resultSummary: null,
          },
        ]}
        isLoading={false}
        isFetching={false}
        page={1}
        total={2}
        totalPages={1}
        pageSize={10}
        formatDateTime={(v) => v ?? '—'}
        onOpenAttemptDetails={vi.fn()}
        onPageSizeChange={vi.fn()}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
        sortBy="startedAt"
        sortOrder="desc"
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getByText('за 12 мин 05 с')).toBeInTheDocument();
    expect(screen.getByText('3D-моделирование')).toBeInTheDocument();
    expect(screen.getByText('Широкий профиль')).toBeInTheDocument();
    expect(screen.getByText('идёт')).toBeInTheDocument();
    expect(screen.getByText(/Всего попыток: 2/)).toBeInTheDocument();
  });
});
