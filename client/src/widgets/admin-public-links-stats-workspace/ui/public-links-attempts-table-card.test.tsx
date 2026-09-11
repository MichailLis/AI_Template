import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
        pageSize={10}
        formatDateTime={(v) => v ?? '—'}
        onOpenAttemptDetails={vi.fn()}
        onPageSizeChange={vi.fn()}
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
        pageSize={10}
        formatDateTime={(v) => v ?? '—'}
        onOpenAttemptDetails={vi.fn()}
        onPageSizeChange={vi.fn()}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
      />,
    );

    expect(screen.getAllByText('Готов').length).toBeGreaterThan(0);
    expect(screen.queryByText('READY')).not.toBeInTheDocument();
    expect(screen.getByText('Пройдено')).toBeInTheDocument();
    expect(screen.queryByText('ИИ готов')).not.toBeInTheDocument();
    expect(screen.queryByText('ИИ в обработке')).not.toBeInTheDocument();
    expect(screen.queryByText('ИИ ошибка')).not.toBeInTheDocument();
    expect(screen.queryByText('ИИ не запрашивался')).not.toBeInTheDocument();
  });

  it('keeps the table to six columns and moves completion timing into the attempt card', () => {
    render(
      <PublicLinksAttemptsTableCard
        selectedPublicLink={{ id: 1 }}
        publicAttempts={[
          {
            attemptId: 301,
            attemptNumber: 7,
            status: 'COMPLETED',
            analysisStatus: 'READY',
            llmStatus: null,
            entryProfileMode: 'EDUCATION',
            studentName: 'Мария',
            studentLastInitial: 'К',
            studentMiddleInitial: 'П',
            educationOrganization: 'Лицей №1',
            groupOrClass: 'ИС-21',
            studentGender: null,
            studentAge: null,
            studentResidence: null,
            studentEducationLevel: null,
            startedAt: '2026-05-18T08:30:00.000Z',
            finishedAt: '2026-05-18T08:45:00.000Z',
            expiresAt: '2026-05-18T09:30:00.000Z',
          },
        ]}
        isLoading={false}
        isFetching={false}
        page={1}
        total={1}
        totalPages={1}
        pageSize={10}
        formatDateTime={(v) => v ?? '—'}
        onOpenAttemptDetails={vi.fn()}
        onPageSizeChange={vi.fn()}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('columnheader')).toHaveLength(6);
    expect(
      screen.queryByRole('columnheader', { name: 'Завершение работы' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Истекает через' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Детали профиля' })).not.toBeInTheDocument();

    expect(screen.getByText('#7')).toBeInTheDocument();
    expect(screen.getByText('ID 301')).toBeInTheDocument();
    expect(screen.getByText('К.П. • Лицей №1 • ИС-21')).toBeInTheDocument();
  });

  const buildAttempt = (attemptId: number, attemptNumber: number, startedAt: string) => ({
    attemptId,
    attemptNumber,
    status: 'COMPLETED',
    analysisStatus: 'READY',
    llmStatus: null,
    entryProfileMode: 'EDUCATION' as const,
    studentName: `Студент ${attemptNumber}`,
    studentLastInitial: null,
    studentMiddleInitial: null,
    educationOrganization: null,
    groupOrClass: null,
    studentGender: null,
    studentAge: null,
    studentResidence: null,
    studentEducationLevel: null,
    startedAt,
    finishedAt: null,
    expiresAt: null,
  });

  const renderTable = (overrides: Record<string, unknown> = {}) =>
    render(
      <PublicLinksAttemptsTableCard
        selectedPublicLink={{ id: 1 }}
        publicAttempts={[
          buildAttempt(401, 1, '2026-05-18T08:00:00.000Z'),
          buildAttempt(402, 2, '2026-05-18T10:00:00.000Z'),
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
        {...overrides}
      />,
    );

  it('reverses the visible order when the sortable header is pressed', async () => {
    const user = userEvent.setup();
    renderTable();

    const readAttemptOrder = () =>
      screen.getAllByText(/^#\d+$/).map((element) => element.textContent);

    expect(readAttemptOrder()).toEqual(['#1', '#2']);
    expect(screen.getByRole('columnheader', { name: /Попытка/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );

    await user.click(screen.getByRole('button', { name: 'Попытка' }));

    expect(readAttemptOrder()).toEqual(['#2', '#1']);
    expect(screen.getByRole('columnheader', { name: /Попытка/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('opens the analysis from a row click and the answers from the row button', async () => {
    const user = userEvent.setup();
    const onOpenAttemptDetails = vi.fn();
    renderTable({ onOpenAttemptDetails });

    await user.click(screen.getByText('Студент 1'));
    expect(onOpenAttemptDetails).toHaveBeenLastCalledWith(401, 'analysis');

    await user.click(screen.getAllByRole('button', { name: 'Ответы' })[0]);
    expect(onOpenAttemptDetails).toHaveBeenLastCalledWith(401, 'answers');
    expect(onOpenAttemptDetails).toHaveBeenCalledTimes(2);
  });

  it('reports the page size back to the caller', async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();
    renderTable({ onPageSizeChange });

    await user.selectOptions(screen.getByLabelText('Строк на странице'), '25');

    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });
});
