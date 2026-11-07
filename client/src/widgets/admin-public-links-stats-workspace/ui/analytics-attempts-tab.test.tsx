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
  restartHookMock,
} = vi.hoisted(() => ({
  exportMock: vi.fn(),
  downloadMock: vi.fn(),
  listHookMock: vi.fn(),
  detailHookMock: vi.fn(),
  deleteHookMock: vi.fn(),
  deleteAttemptMock: vi.fn(),
  closeDetailMock: vi.fn(),
  restartHookMock: vi.fn(),
}));

vi.mock('@/shared/api/generated/tests/tests', () => ({
  testsAdminAttemptsControllerExportPublicLinkAttempts: exportMock,
}));

vi.mock('../lib/test-analytics-download', () => ({
  downloadTestAnalyticsBlob: downloadMock,
}));

vi.mock('@/features/manage-attempt', () => ({
  useRestartAnalysis: restartHookMock,
  useDeletePublicLinkAttempt: () => deleteHookMock(),
}));

vi.mock('../model/use-admin-public-links-attempts', () => ({
  usePaginatedPublicAttempts: listHookMock,
  useAttemptDetail: () => detailHookMock(),
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
    restartHookMock.mockReturnValue({
      restartAttemptAnalysis: vi.fn(),
      isRestartingAttempt: false,
      restartFailedAnalyses: vi.fn(),
      isRestartingFailed: false,
    });
    listHookMock.mockReturnValue({
      failedAnalysisCount: 0,
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

  describe('restart of the failed analyses', () => {
    const withFailed = (failedAnalysisCount: number, restartOverrides = {}) => {
      const restartFailedAnalyses = vi.fn();
      listHookMock.mockReturnValue({
        failedAnalysisCount,
        publicAttempts: [],
        publicAttemptsPage: 1,
        publicAttemptsQuery: { isLoading: false, isFetching: false },
        publicAttemptsTotal: 0,
        publicAttemptsTotalPages: 1,
      });
      restartHookMock.mockReturnValue({
        restartAttemptAnalysis: vi.fn(),
        isRestartingAttempt: false,
        restartFailedAnalyses,
        isRestartingFailed: false,
        ...restartOverrides,
      });

      return restartFailedAnalyses;
    };

    it('has no restart button when no analysis of the link failed', () => {
      withFailed(0);
      renderTab();

      expect(
        screen.queryByRole('button', { name: /Перезапустить неудачные/ }),
      ).not.toBeInTheDocument();
    });

    it('shows how many failed analyses it would restart', () => {
      withFailed(12);
      renderTab();

      expect(screen.getByRole('button', { name: 'Перезапустить неудачные (12)' })).toBeEnabled();
    });

    it('asks for confirmation first and restarts only after it', async () => {
      const user = userEvent.setup();
      const restartFailedAnalyses = withFailed(12);
      renderTab();

      await user.click(screen.getByRole('button', { name: 'Перезапустить неудачные (12)' }));

      expect(restartFailedAnalyses).not.toHaveBeenCalled();
      expect(screen.getByText('Перезапустить неудачные анализы (12)?')).toBeInTheDocument();
      expect(screen.getByText(/платный запрос к провайдеру ИИ/)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Перезапустить' }));

      expect(restartFailedAnalyses).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(screen.queryByText('Перезапустить неудачные анализы (12)?')).not.toBeInTheDocument(),
      );
    });

    it('restarts nothing when the confirmation is cancelled', async () => {
      const user = userEvent.setup();
      const restartFailedAnalyses = withFailed(3);
      renderTab();

      await user.click(screen.getByRole('button', { name: 'Перезапустить неудачные (3)' }));
      await user.click(screen.getByRole('button', { name: 'Отмена' }));

      expect(restartFailedAnalyses).not.toHaveBeenCalled();
    });

    it('locks the button while the restart is being sent', () => {
      withFailed(3, { isRestartingFailed: true });
      renderTab();

      expect(screen.getByRole('button', { name: 'Перезапустить неудачные (3)' })).toBeDisabled();
    });
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
        'Действие необратимо: ответы и результат ученика будут удалены. Запись об удалении останется в журнале ссылки.',
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
