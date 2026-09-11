import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicLinksAttemptsTableCard } from './public-links-attempts-table-card';

describe('PublicLinksAttemptsTableCard', () => {
  afterEach(cleanup);

  it('renders LLM status badges for failed, pending, ready, and not_requested attempts', () => {
    render(
      <PublicLinksAttemptsTableCard
        selectedPublicLink={{ id: 1 }}
        publicAttempts={[
          {
            attemptId: 101,
            attemptNumber: 1,
            status: 'COMPLETED',
            analysisStatus: 'READY',
            llmStatus: 'failed',
            entryProfileMode: 'DEMOGRAPHIC',
            studentName: 'Иван',
            studentLastInitial: null,
            studentMiddleInitial: null,
            educationOrganization: null,
            groupOrClass: null,
            studentGender: 'MALE',
            studentAge: 16,
            studentResidence: null,
            studentEducationLevel: null,
            startedAt: '2026-05-18T08:30:00.000Z',
            finishedAt: '2026-05-18T08:45:00.000Z',
            expiresAt: null,
          },
          {
            attemptId: 102,
            attemptNumber: 2,
            status: 'COMPLETED',
            analysisStatus: 'READY',
            llmStatus: 'pending',
            entryProfileMode: 'DEMOGRAPHIC',
            studentName: 'Анна',
            studentLastInitial: null,
            studentMiddleInitial: null,
            educationOrganization: null,
            groupOrClass: null,
            studentGender: 'FEMALE',
            studentAge: 17,
            studentResidence: null,
            studentEducationLevel: null,
            startedAt: '2026-05-18T09:30:00.000Z',
            finishedAt: '2026-05-18T09:45:00.000Z',
            expiresAt: null,
          },
          {
            attemptId: 103,
            attemptNumber: 3,
            status: 'COMPLETED',
            analysisStatus: 'READY',
            llmStatus: 'ready',
            entryProfileMode: 'DEMOGRAPHIC',
            studentName: 'Сергей',
            studentLastInitial: null,
            studentMiddleInitial: null,
            educationOrganization: null,
            groupOrClass: null,
            studentGender: 'MALE',
            studentAge: 18,
            studentResidence: null,
            studentEducationLevel: null,
            startedAt: '2026-05-18T10:30:00.000Z',
            finishedAt: '2026-05-18T10:45:00.000Z',
            expiresAt: null,
          },
          {
            attemptId: 104,
            attemptNumber: 4,
            status: 'COMPLETED',
            analysisStatus: 'READY',
            llmStatus: 'not_requested',
            entryProfileMode: 'DEMOGRAPHIC',
            studentName: 'Ольга',
            studentLastInitial: null,
            studentMiddleInitial: null,
            educationOrganization: null,
            groupOrClass: null,
            studentGender: 'FEMALE',
            studentAge: 16,
            studentResidence: null,
            studentEducationLevel: null,
            startedAt: '2026-05-18T11:30:00.000Z',
            finishedAt: '2026-05-18T11:45:00.000Z',
            expiresAt: null,
          },
        ]}
        isLoading={false}
        isFetching={false}
        page={1}
        total={4}
        totalPages={1}
        formatDateTime={(v) => v ?? '—'}
        onOpenAttemptDetails={vi.fn()}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
      />,
    );

    expect(screen.getByText('ИИ ошибка')).toBeInTheDocument();
    expect(screen.getByText('ИИ в обработке')).toBeInTheDocument();
    expect(screen.getByText('ИИ готов')).toBeInTheDocument();
    expect(screen.getByText('ИИ не запрашивался')).toBeInTheDocument();
  });

  it('renders no LLM badge when the analysis has no separate LLM phase', () => {
    render(
      <PublicLinksAttemptsTableCard
        selectedPublicLink={{ id: 1 }}
        publicAttempts={[
          {
            attemptId: 201,
            attemptNumber: 1,
            status: 'COMPLETED',
            analysisStatus: 'READY',
            llmStatus: null,
            entryProfileMode: 'DEMOGRAPHIC',
            studentName: 'Пётр',
            studentLastInitial: null,
            studentMiddleInitial: null,
            educationOrganization: null,
            groupOrClass: null,
            studentGender: 'MALE',
            studentAge: 16,
            studentResidence: null,
            studentEducationLevel: null,
            startedAt: '2026-05-18T08:30:00.000Z',
            finishedAt: '2026-05-18T08:45:00.000Z',
            expiresAt: null,
          },
        ]}
        isLoading={false}
        isFetching={false}
        page={1}
        total={1}
        totalPages={1}
        formatDateTime={(v) => v ?? '—'}
        onOpenAttemptDetails={vi.fn()}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
      />,
    );

    expect(screen.getAllByText('READY').length).toBeGreaterThan(0);
    expect(screen.queryByText('ИИ готов')).not.toBeInTheDocument();
    expect(screen.queryByText('ИИ в обработке')).not.toBeInTheDocument();
    expect(screen.queryByText('ИИ ошибка')).not.toBeInTheDocument();
    expect(screen.queryByText('ИИ не запрашивался')).not.toBeInTheDocument();
  });
});
