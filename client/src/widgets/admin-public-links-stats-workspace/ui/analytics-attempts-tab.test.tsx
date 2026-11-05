import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsAttemptsTab } from './analytics-attempts-tab';

const {
  exportMock,
  downloadMock,
  listHookMock,
  detailHookMock,
  deleteHookMock,
  deleteAttemptMock,
  closeDetailMock,
} = vi.hoisted(() => ({
  exportMock: vi.fn(),
  downloadMock: vi.fn(),
  listHookMock: vi.fn(),
  detailHookMock: vi.fn(),
  deleteHookMock: vi.fn(),
  deleteAttemptMock: vi.fn(),
  closeDetailMock: vi.fn(),
}));

vi.mock('@/shared/api/generated/tests/tests', () => ({
  testsAdminAttemptsControllerExportPublicLinkAttempts: exportMock,
}));

vi.mock('./test-analytics-download', () => ({
  downloadTestAnalyticsBlob: downloadMock,
}));

vi.mock('./use-admin-public-links-attempts', () => ({
  usePaginatedPublicAttempts: listHookMock,
  useAttemptDetail: () => detailHookMock(),
  useDeletePublicLinkAttempt: () => deleteHookMock(),
}));

const closedDetail = {
  detailView: null,
  detailAttempt: undefined,
  attemptDetailQuery: { isLoading: false },
  isDetailDialogOpen: false,
  handleOpenAttemptDetails: vi.fn(),
  handleCloseAttemptDetails: closeDetailMock,
};

// Карточка прохождения открыта на ответах: без анализа, поэтому ее текст короткий.
const openAttemptDetail = {
  ...closedDetail,
  detailView: 'answers' as const,
  isDetailDialogOpen: true,
  detailAttempt: {
    attemptId: 33,
    attemptNumber: 2,
    status: 'COMPLETED',
    entryProfileMode: 'EDUCATION' as const,
    startedAt: '2026-01-01T10:00:00.000Z',
    finishedAt: null,
    expiresAt: null,
    professionAtlasUrl: null,
    studentName: 'Иван',
    studentLastInitial: null,
    studentMiddleInitial: null,
    educationOrganization: null,
    groupOrClass: null,
    studentGender: null,
    studentAge: null,
    studentResidence: null,
    studentEducationLevel: null,
    analysis: null,
    answers: [],
  },
};

const renderTab = (setAttemptsPage = vi.fn()) =>
  render(
    <AnalyticsAttemptsTab
      selectedPublicLink={{ id: 13, shortCode: 'ABC123' }}
      effectivePublicLinkId={13}
      effectiveTopicId={7}
      attemptsPage={3}
      attemptsLimit={10}
      setAttemptsPage={setAttemptsPage}
      setAttemptsLimit={vi.fn()}
    />,
  );

describe('AnalyticsAttemptsTab', () => {
  beforeEach(() => {
    listHookMock.mockReturnValue({
      publicAttempts: [],
      publicAttemptsPage: 1,
      publicAttemptsQuery: { isLoading: false, isFetching: false },
      publicAttemptsTotal: 0,
      publicAttemptsTotalPages: 1,
    });
    detailHookMock.mockReturnValue(closedDetail);
    deleteHookMock.mockReturnValue({ deleteAttempt: deleteAttemptMock, isDeleting: false });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('sends the search to the server after a pause and goes back to the first page', async () => {
    const user = userEvent.setup();
    const setAttemptsPage = vi.fn();
    renderTab(setAttemptsPage);

    await user.type(screen.getByLabelText('Поиск по прохождениям'), 'лицей');

    await waitFor(() =>
      expect(listHookMock).toHaveBeenLastCalledWith(13, 3, 10, {
        search: 'лицей',
        status: undefined,
        sortBy: 'startedAt',
        sortOrder: 'desc',
      }),
    );
    expect(setAttemptsPage).toHaveBeenCalled();
    expect(setAttemptsPage.mock.calls[0][0](3)).toBe(1);
  });

  it('filters by status on the server', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.selectOptions(screen.getByLabelText('Статус прохождения'), 'EXPIRED');

    expect(listHookMock).toHaveBeenLastCalledWith(13, 3, 10, {
      search: undefined,
      status: 'EXPIRED',
      sortBy: 'startedAt',
      sortOrder: 'desc',
    });
  });

  it('exports the list with the current status filter and downloads the file', async () => {
    const user = userEvent.setup();
    const blob = new Blob(['xlsx']);
    exportMock.mockResolvedValue(blob);
    renderTab();

    await user.selectOptions(screen.getByLabelText('Статус прохождения'), 'COMPLETED');
    await user.click(screen.getByRole('button', { name: 'Выгрузить XLSX' }));

    await waitFor(() => expect(downloadMock).toHaveBeenCalledTimes(1));
    expect(exportMock).toHaveBeenCalledWith(13, {
      search: undefined,
      status: 'COMPLETED',
      sortBy: 'startedAt',
      sortOrder: 'desc',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    expect(downloadMock).toHaveBeenCalledWith(blob, expect.stringMatching(/^attempts-ABC123-/));
  });

  it('reports a failed export instead of staying silent', async () => {
    const user = userEvent.setup();
    exportMock.mockRejectedValue(new Error('network'));
    renderTab();

    await user.click(screen.getByRole('button', { name: 'Выгрузить XLSX' }));

    expect(await screen.findByText(/Не удалось сформировать файл/)).toBeInTheDocument();
    expect(downloadMock).not.toHaveBeenCalled();
  });

  it('asks for confirmation with the irreversibility warning before deleting the attempt', async () => {
    const user = userEvent.setup();
    detailHookMock.mockReturnValue(openAttemptDetail);
    renderTab();

    await user.click(screen.getByRole('button', { name: 'Удалить попытку' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByText(
        'Действие необратимо: ответы и результат ученика будут удалены. Запись о удалении останется в журнале ссылки.',
      ),
    ).toBeInTheDocument();
    expect(deleteAttemptMock).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Удалить попытку' }));

    expect(deleteAttemptMock).toHaveBeenCalledWith(33, expect.any(Function));
  });

  it('keeps the card and the confirmation open while the server has not confirmed the deletion', async () => {
    const user = userEvent.setup();
    detailHookMock.mockReturnValue(openAttemptDetail);
    renderTab();

    await user.click(screen.getByRole('button', { name: 'Удалить попытку' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Удалить попытку',
      }),
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(closeDetailMock).not.toHaveBeenCalled();
  });

  it('closes the confirmation and the card once the attempt is deleted', async () => {
    const user = userEvent.setup();
    detailHookMock.mockReturnValue(openAttemptDetail);
    deleteAttemptMock.mockImplementation((_attemptId: number, onDeleted: () => void) =>
      onDeleted(),
    );
    renderTab();

    await user.click(screen.getByRole('button', { name: 'Удалить попытку' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Удалить попытку',
      }),
    );

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(closeDetailMock).toHaveBeenCalledTimes(1);
  });
});
