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
            analysisResultKind: 'AI',
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
            analysisResultKind: 'AI',
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
            analysisResultKind: 'AI',
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
            analysisResultKind: 'AI',
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
        sortBy="startedAt"
        sortOrder="desc"
        onSortChange={vi.fn()}
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
            analysisResultKind: 'AI',
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
        sortBy="startedAt"
        sortOrder="desc"
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getAllByText('ИИ-анализ готов').length).toBeGreaterThan(0);
    expect(screen.queryByText('READY')).not.toBeInTheDocument();
    expect(screen.getByText('Пройдено')).toBeInTheDocument();
    expect(screen.queryByText('ИИ готов')).not.toBeInTheDocument();
    expect(screen.queryByText('ИИ в обработке')).not.toBeInTheDocument();
    expect(screen.queryByText('ИИ ошибка')).not.toBeInTheDocument();
    expect(screen.queryByText('ИИ не запрашивался')).not.toBeInTheDocument();
  });

  /**
   * Находка аудита UX-01: у заглушки статус записи такой же `READY`, как у настоящего ИИ-анализа,
   * и таблица показывала обеим зелёное «Готов».
   */
  it('names a stub as a stub instead of showing it as a ready analysis', () => {
    render(
      <PublicLinksAttemptsTableCard
        selectedPublicLink={{ id: 1 }}
        publicAttempts={[
          {
            attemptId: 191,
            attemptNumber: 1,
            status: 'COMPLETED',
            analysisStatus: 'READY',
            analysisResultKind: 'STUB',
            llmStatus: null,
            entryProfileMode: 'EDUCATION',
            studentName: 'Пётр',
            studentLastInitial: null,
            studentMiddleInitial: null,
            educationOrganization: null,
            groupOrClass: null,
            studentGender: null,
            studentAge: null,
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
        sortBy="startedAt"
        sortOrder="desc"
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Заглушка, промпт не подключен')).toBeInTheDocument();
    expect(screen.queryByText('Готов')).not.toBeInTheDocument();
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
            analysisResultKind: 'AI',
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
        sortBy="startedAt"
        sortOrder="desc"
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
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
    analysisResultKind: 'AI',
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
        sortBy="startedAt"
        sortOrder="desc"
        onSortChange={vi.fn()}
        {...overrides}
      />,
    );

  it('reports the sort field to the caller and marks the active column', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    renderTable({ onSortChange, sortBy: 'attemptNumber', sortOrder: 'asc' });

    expect(screen.getByRole('columnheader', { name: /Попытка/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );

    await user.click(screen.getByRole('button', { name: 'Студент' }));
    await user.click(screen.getByRole('button', { name: /Начало и время/ }));

    expect(onSortChange).toHaveBeenNthCalledWith(1, 'studentName');
    expect(onSortChange).toHaveBeenNthCalledWith(2, 'startedAt');
  });

  it('keeps the rows in the order the server returned them', () => {
    renderTable({ sortBy: 'startedAt', sortOrder: 'desc' });

    expect(screen.getAllByText(/^#\d+$/).map((element) => element.textContent)).toEqual([
      '#1',
      '#2',
    ]);
  });

  it('shows the toolbar and a filter-specific empty message', () => {
    renderTable({
      publicAttempts: [],
      total: 0,
      hasActiveFilters: true,
      toolbar: <input aria-label="Поиск по прохождениям" />,
    });

    expect(screen.getByLabelText('Поиск по прохождениям')).toBeInTheDocument();
    expect(screen.getByText(/ничего не найдено/)).toBeInTheDocument();
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
