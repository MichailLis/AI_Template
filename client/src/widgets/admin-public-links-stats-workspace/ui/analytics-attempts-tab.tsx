import { FileSpreadsheet } from 'lucide-react';
import { useEffect, useState } from 'react';

import { testsAdminAttemptsControllerExportPublicLinkAttempts } from '@/shared/api/generated/tests/tests';
import {
  formatDateTimeOrDash,
  formatDateTimePreciseOrDash,
  getBrowserTimeZone,
} from '@/shared/lib/date-format';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import { PublicLinksAttemptDetailDialog } from './public-links-attempt-detail-dialog';
import { PublicLinksAttemptsTableCard } from './public-links-attempts-table-card';
import { downloadTestAnalyticsBlob } from './test-analytics-download';
import { useAttemptDetail, usePaginatedPublicAttempts } from './use-admin-public-links-attempts';

interface AnalyticsAttemptsTabProps {
  selectedPublicLink: { id: number; shortCode?: string } | null;
  effectivePublicLinkId: number | null;
  attemptsPage: number;
  attemptsLimit: number;
  setAttemptsPage: (updater: (previous: number) => number) => void;
  setAttemptsLimit: (limit: number) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

type AttemptsStatusFilter = '' | 'COMPLETED' | 'IN_PROGRESS' | 'EXPIRED' | 'ABANDONED';
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
  const {
    detailView,
    detailAttempt,
    attemptDetailQuery,
    isDetailDialogOpen,
    handleOpenAttemptDetails,
    handleCloseAttemptDetails,
  } = useAttemptDetail();

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
              <option value="ABANDONED">Брошено</option>
            </AdminSelectField>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="sm:ml-auto sm:h-9"
              disabled={isExporting || !selectedPublicLink}
              onClick={() => void handleExport()}
            >
              <FileSpreadsheet />
              {isExporting ? 'Готовим XLSX...' : 'Выгрузить XLSX'}
            </Button>
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
        onClose={handleCloseAttemptDetails}
        formatDateTime={formatDateTimePreciseOrDash}
        toPrettyJson={toPrettyJson}
      />
    </>
  );
}
