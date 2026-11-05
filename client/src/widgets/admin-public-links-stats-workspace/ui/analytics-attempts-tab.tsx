import { FileSpreadsheet, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { testsAdminAttemptsControllerExportPublicLinkAttempts } from '@/shared/api/generated/tests/tests';
import {
  formatDateTimeOrDash,
  formatDateTimePreciseOrDash,
  getBrowserTimeZone,
} from '@/shared/lib/date-format';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Button } from '@/shared/ui/button';
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';
import { Input } from '@/shared/ui/input';

import { PublicLinksAttemptDetailDialog } from './public-links-attempt-detail-dialog';
import { PublicLinksAttemptsTableCard } from './public-links-attempts-table-card';
import { downloadTestAnalyticsBlob } from './test-analytics-download';
import {
  useAttemptDetail,
  useDeletePublicLinkAttempt,
  usePaginatedPublicAttempts,
} from './use-admin-public-links-attempts';
import { useRestartAnalysis } from './use-restart-analysis';

interface AnalyticsAttemptsTabProps {
  selectedPublicLink: { id: number; shortCode?: string } | null;
  effectivePublicLinkId: number | null;
  effectiveTopicId: number | null;
  attemptsPage: number;
  attemptsLimit: number;
  setAttemptsPage: (updater: (previous: number) => number) => void;
  setAttemptsLimit: (limit: number) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

type AttemptsStatusFilter = '' | 'COMPLETED' | 'IN_PROGRESS' | 'EXPIRED';
type AttemptsSortBy = 'startedAt' | 'attemptNumber' | 'studentName';
type AttemptsSortOrder = 'asc' | 'desc';

const toPrettyJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export function AnalyticsAttemptsTab({
  selectedPublicLink,
  effectivePublicLinkId,
  effectiveTopicId,
  attemptsPage,
  attemptsLimit,
  setAttemptsPage,
  setAttemptsLimit,
}: AnalyticsAttemptsTabProps) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AttemptsStatusFilter>('');
  const [sortBy, setSortBy] = useState<AttemptsSortBy>('startedAt');
  const [sortOrder, setSortOrder] = useState<AttemptsSortOrder>('desc');

  // Запрос уходит после паузы в наборе, а не на каждую букву. Страница сбрасывается вместе с
  // поиском: иначе на 3-й странице нового, более короткого списка было бы пусто.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const resetPage = () => setAttemptsPage(() => 1);

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Файл строится по тем же поиску, статусу и сортировке, что и таблица, но без постраничности.
  const handleExport = async () => {
    if (!effectivePublicLinkId) {
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const blob = await testsAdminAttemptsControllerExportPublicLinkAttempts(
        effectivePublicLinkId,
        {
          search: search || undefined,
          status: status || undefined,
          sortBy,
          sortOrder,
          timeZone: getBrowserTimeZone(),
        },
      );

      downloadTestAnalyticsBlob(
        blob,
        `attempts-${selectedPublicLink?.shortCode ?? effectivePublicLinkId}-${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`,
      );
    } catch {
      setExportError('Не удалось сформировать файл. Попробуйте еще раз.');
    } finally {
      setIsExporting(false);
    }
  };

  const {
    failedAnalysisCount,
    publicAttempts,
    publicAttemptsPage,
    publicAttemptsQuery,
    publicAttemptsTotal,
    publicAttemptsTotalPages,
  } = usePaginatedPublicAttempts(effectivePublicLinkId, attemptsPage, attemptsLimit, {
    search: search || undefined,
    status: status || undefined,
    sortBy,
    sortOrder,
  });
  const { restartAttemptAnalysis, isRestartingAttempt, restartFailedAnalyses, isRestartingFailed } =
    useRestartAnalysis(effectivePublicLinkId);
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false);
  const {
    detailView,
    detailAttempt,
    attemptDetailQuery,
    isDetailDialogOpen,
    handleOpenAttemptDetails,
    handleCloseAttemptDetails,
  } = useAttemptDetail();
  const [pendingDeleteAttemptId, setPendingDeleteAttemptId] = useState<number | null>(null);
  const { deleteAttempt, isDeleting } = useDeletePublicLinkAttempt(
    effectivePublicLinkId,
    effectiveTopicId,
  );

  const handleConfirmDeleteAttempt = () => {
    if (pendingDeleteAttemptId === null) {
      return;
    }

    deleteAttempt(pendingDeleteAttemptId, () => {
      setPendingDeleteAttemptId(null);
      handleCloseAttemptDetails();
    });
  };

  const handlePreviousAttemptsPage = () => {
    setAttemptsPage((previous) => Math.max(1, previous - 1));
  };
  const handleNextAttemptsPage = () => {
    setAttemptsPage((previous) => Math.min(publicAttemptsTotalPages, previous + 1));
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    resetPage();
  };
  const handleStatusChange = (value: AttemptsStatusFilter) => {
    setStatus(value);
    resetPage();
  };
  const handleSortChange = (field: AttemptsSortBy) => {
    if (field === sortBy) {
      setSortOrder((previous) => (previous === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'studentName' ? 'asc' : 'desc');
    }
    resetPage();
  };

  return (
    <>
      <PublicLinksAttemptsTableCard
        toolbar={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Поиск: имя, учебное заведение, группа, город"
              aria-label="Поиск по прохождениям"
              maxLength={100}
              className="sm:max-w-sm"
            />
            <AdminSelectField
              value={status}
              onChange={(event) => handleStatusChange(event.target.value as AttemptsStatusFilter)}
              aria-label="Статус прохождения"
              className="sm:w-52"
            >
              <option value="">Все статусы</option>
              <option value="COMPLETED">Пройдено</option>
              <option value="IN_PROGRESS">В процессе</option>
              <option value="EXPIRED">Истекло</option>
            </AdminSelectField>
            <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
              {failedAnalysisCount > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="sm:h-9"
                  disabled={isRestartingFailed}
                  onClick={() => setIsRestartConfirmOpen(true)}
                >
                  <RotateCw />
                  {`Перезапустить неудачные (${failedAnalysisCount})`}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="sm:h-9"
                disabled={isExporting || !selectedPublicLink}
                onClick={() => void handleExport()}
              >
                <FileSpreadsheet />
                {isExporting ? 'Готовим XLSX...' : 'Выгрузить XLSX'}
              </Button>
            </div>
          </div>
        }
        exportError={exportError}
        hasActiveFilters={Boolean(search || status)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        selectedPublicLink={selectedPublicLink}
        publicAttempts={publicAttempts}
        isLoading={publicAttemptsQuery.isLoading}
        isFetching={publicAttemptsQuery.isFetching}
        page={publicAttemptsPage}
        pageSize={attemptsLimit}
        total={publicAttemptsTotal}
        totalPages={publicAttemptsTotalPages}
        formatDateTime={formatDateTimeOrDash}
        onOpenAttemptDetails={handleOpenAttemptDetails}
        onPreviousPage={handlePreviousAttemptsPage}
        onNextPage={handleNextAttemptsPage}
        onPageSizeChange={setAttemptsLimit}
      />

      {/* В карточке прохождения секунды нужны: админ разбирает конкретную попытку. В таблице они
          только мешают сканировать столбец, поэтому там формат без секунд. */}
      <PublicLinksAttemptDetailDialog
        isOpen={isDetailDialogOpen}
        detailView={detailView}
        detailAttempt={detailAttempt ?? null}
        isLoading={attemptDetailQuery.isLoading}
        isRestartingAnalysis={isRestartingAttempt}
        onClose={handleCloseAttemptDetails}
        onRestartAnalysis={restartAttemptAnalysis}
        formatDateTime={formatDateTimePreciseOrDash}
        toPrettyJson={toPrettyJson}
        onRequestDelete={setPendingDeleteAttemptId}
      />

      <ConfirmActionDialog
        open={pendingDeleteAttemptId !== null}
        title="Удалить попытку?"
        description="Действие необратимо: ответы и результат ученика будут удалены. Запись о удалении останется в журнале ссылки."
        confirmLabel="Удалить попытку"
        variant="destructive"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDeleteAttempt}
        onClose={() => setPendingDeleteAttemptId(null)}
      />

      <ConfirmActionDialog
        open={isRestartConfirmOpen}
        title={`Перезапустить неудачные анализы (${failedAnalysisCount})?`}
        description="Анализы, которые закончились ошибкой, будут запущены заново. Каждый перезапуск — отдельный платный запрос к провайдеру ИИ, поэтому сначала убедитесь, что причина устранена: ключ действует, на балансе есть средства, сервис отвечает (это показывает «Проверить ключ и баланс» в настройках). Если неудачных много, они перезапускаются партиями: повторите действие, когда партия обработается."
        confirmLabel="Перезапустить"
        onConfirm={() => {
          setIsRestartConfirmOpen(false);
          restartFailedAnalyses();
        }}
        onClose={() => setIsRestartConfirmOpen(false)}
      />
    </>
  );
}
