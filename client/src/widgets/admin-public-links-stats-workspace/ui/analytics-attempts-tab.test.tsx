import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsAttemptsTab } from './analytics-attempts-tab';

const { exportMock, downloadMock, listHookMock } = vi.hoisted(() => ({
  exportMock: vi.fn(),
  downloadMock: vi.fn(),
  listHookMock: vi.fn(),
}));

vi.mock('@/shared/api/generated/tests/tests', () => ({
  testsAdminAttemptsControllerExportPublicLinkAttempts: exportMock,
}));

vi.mock('./test-analytics-download', () => ({
  downloadTestAnalyticsBlob: downloadMock,
}));

vi.mock('./use-admin-public-links-attempts', () => ({
  usePaginatedPublicAttempts: listHookMock,
  useAttemptDetail: () => ({
    detailView: null,
    detailAttempt: undefined,
    attemptDetailQuery: { isLoading: false },
    isDetailDialogOpen: false,
    handleOpenAttemptDetails: vi.fn(),
    handleCloseAttemptDetails: vi.fn(),
  }),
}));

const renderTab = (setAttemptsPage = vi.fn()) =>
  render(
    <AnalyticsAttemptsTab
      selectedPublicLink={{ id: 13, shortCode: 'ABC123' }}
      effectivePublicLinkId={13}
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
});
