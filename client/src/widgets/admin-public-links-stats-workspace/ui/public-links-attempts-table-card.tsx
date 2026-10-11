import {
  getAnalysisResultKindLabel,
  getAnalysisResultKindTone,
} from '@/shared/lib/analysis-result-kind-labels';
import { getAttemptStatusLabel } from '@/shared/lib/attempt-status-labels';
import { formatDurationSeconds } from '@/shared/lib/date-format';
import { studentEducationLevelLabels, studentGenderLabels } from '@/shared/lib/public-test-labels';
import { AdminDataTable } from '@/shared/ui/admin-data-table';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminPagination } from '@/shared/ui/admin-pagination';
import { AdminSkeletonRows } from '@/shared/ui/admin-skeleton';
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { TableCell } from '@/shared/ui/table';

import { LlmStatusBadge } from './llm-status-badge';
import { ATTEMPTS_LIMIT_OPTIONS } from './use-admin-public-links-stats-workspace.model';

import type { AdminDataTableSortDirection } from '@/shared/ui/admin-data-table';
import type { ReactNode } from 'react';

type AttemptDetailView = 'analysis' | 'answers';

interface PublicAttemptRow {
  attemptId: number;
  attemptNumber: number;
  status: string;
  analysisStatus: string | null;

  analysisResultKind: string;

  llmStatus?: string | null;

  entryProfileMode: 'DEMOGRAPHIC' | 'EDUCATION' | 'EDUCATION_DEMOGRAPHIC';
  studentName: string | null;
  studentLastInitial: string | null;
  studentMiddleInitial: string | null;
  educationOrganization: string | null;
  groupOrClass: string | null;
  studentGender: 'MALE' | 'FEMALE' | null;
  studentAge: number | null;
  studentResidence: string | null;
  studentEducationLevel:
    | 'BASIC_GENERAL'
    | 'SECONDARY_GENERAL'
    | 'SECONDARY_SPECIAL'
    | 'INCOMPLETE_HIGHER_FROM_YEAR_3'
    | 'HIGHER'
    | null;
  startedAt: string;
  finishedAt: string | null;
  expiresAt: string | null;
  durationSeconds?: number | null;
  resultSummary?: {
    primaryDirectionLabel: string | null;
    profileTitle: string | null;
  } | null;
}

interface SelectedPublicLink {
  id: number;
}

interface PublicLinksAttemptsTableCardProps {
  selectedPublicLink: SelectedPublicLink | null;
  publicAttempts: PublicAttemptRow[];
  isLoading: boolean;
  isFetching: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  formatDateTime: (value: string | null) => string;
  onOpenAttemptDetails: (attemptId: number, view: AttemptDetailView) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageSizeChange: (pageSize: number) => void;
  /** Поиск и фильтры: рисует вкладка, потому что их состояние уходит в запрос к серверу. */
  toolbar?: ReactNode;
  /** Ошибка выгрузки, показывается под панелью поиска. */
  exportError?: string | null;
  hasActiveFilters?: boolean;
  /** Сортировка выполняется на сервере и действует на весь список, а не на страницу. */
  sortBy: AttemptsSortField;
  sortOrder: AdminDataTableSortDirection;
  onSortChange: (field: AttemptsSortField) => void;
}

type AttemptsSortField = 'attemptNumber' | 'startedAt' | 'studentName';

const getAttemptStatusBadgeClassName = (status: string) => {
  if (status === 'COMPLETED' || status === 'FINISHED') {
    return adminBadgeClassNames.success;
  }

  if (status === 'EXPIRED' || status === 'FAILED') {
    return adminBadgeClassNames.danger;
  }

  return adminBadgeClassNames.info;
};

/**
 * Цвет берётся из вида результата, а не из статуса записи: `READY` стоит и у заглушки, и у
 * настоящего ИИ-анализа, поэтому зелёный по статусу вводил админа в заблуждение.
 */
const analysisResultKindBadgeClassNames: Record<string, string> = {
  success: adminBadgeClassNames.success,
  warning: adminBadgeClassNames.warning,
  danger: adminBadgeClassNames.danger,
  neutral: adminBadgeClassNames.neutral,
};

const getAnalysisResultBadgeClassName = (kind: string | null | undefined) =>
  analysisResultKindBadgeClassNames[getAnalysisResultKindTone(kind)] ??
  adminBadgeClassNames.neutral;

const getAttemptProfilePrimary = (attempt: PublicAttemptRow) => {
  if (attempt.entryProfileMode === 'DEMOGRAPHIC') {
    return [
      attempt.studentGender ? studentGenderLabels[attempt.studentGender] : null,
      attempt.studentAge ? `${attempt.studentAge} лет` : null,
    ]
      .filter(Boolean)
      .join(', ');
  }

  if (attempt.entryProfileMode === 'EDUCATION_DEMOGRAPHIC') {
    return [attempt.studentName, attempt.studentAge ? `${attempt.studentAge} лет` : null]
      .filter(Boolean)
      .join(', ');
  }

  return attempt.studentName ?? '—';
};

const getAttemptProfileSecondary = (attempt: PublicAttemptRow) => {
  if (attempt.entryProfileMode === 'DEMOGRAPHIC') {
    return [
      attempt.studentResidence,
      attempt.studentEducationLevel
        ? studentEducationLevelLabels[attempt.studentEducationLevel]
        : null,
    ]
      .filter(Boolean)
      .join(' • ');
  }

  const educationDetails = [
    attempt.studentLastInitial && attempt.studentMiddleInitial
      ? `${attempt.studentLastInitial}.${attempt.studentMiddleInitial}.`
      : null,
    attempt.educationOrganization,
    attempt.groupOrClass,
  ];

  if (attempt.entryProfileMode === 'EDUCATION_DEMOGRAPHIC') {
    educationDetails.push(
      attempt.studentGender ? studentGenderLabels[attempt.studentGender] : null,
      attempt.studentResidence,
      attempt.studentEducationLevel
        ? studentEducationLevelLabels[attempt.studentEducationLevel]
        : null,
    );
  }

  return educationDetails.filter(Boolean).join(' • ');
};

function AttemptRowCells({
  attempt,
  formatDateTime,
  onOpenAttemptDetails,
}: {
  attempt: PublicAttemptRow;
  formatDateTime: (value: string | null) => string;
  onOpenAttemptDetails: (attemptId: number, view: AttemptDetailView) => void;
}) {
  const profileSecondary = getAttemptProfileSecondary(attempt);

  return (
    <>
      <TableCell className="whitespace-nowrap">
        <span className={adminClassNames.text.heading}>#{attempt.attemptNumber}</span>
        <span className={`ml-2 text-xs ${adminClassNames.text.muted}`}>ID {attempt.attemptId}</span>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={getAttemptStatusBadgeClassName(attempt.status)}>
          {getAttemptStatusLabel(attempt.status)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <Badge
            variant="outline"
            className={`whitespace-nowrap ${getAnalysisResultBadgeClassName(attempt.analysisResultKind)}`}
          >
            {getAnalysisResultKindLabel(attempt.analysisResultKind)}
          </Badge>
          <LlmStatusBadge status={attempt.llmStatus} />
        </div>
      </TableCell>
      <TableCell className="min-w-40 max-w-44">
        <p className={`truncate ${adminClassNames.text.heading}`}>
          {getAttemptProfilePrimary(attempt) || '—'}
        </p>
        {profileSecondary ? (
          <p className={`truncate text-xs ${adminClassNames.text.muted}`} title={profileSecondary}>
            {profileSecondary}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="min-w-36 max-w-44">
        {attempt.resultSummary?.primaryDirectionLabel || attempt.resultSummary?.profileTitle ? (
          <>
            <p
              className={`truncate ${adminClassNames.text.heading}`}
              title={attempt.resultSummary.primaryDirectionLabel ?? undefined}
            >
              {attempt.resultSummary.primaryDirectionLabel ?? '—'}
            </p>
            {attempt.resultSummary.profileTitle ? (
              <p
                className={`truncate text-xs ${adminClassNames.text.muted}`}
                title={attempt.resultSummary.profileTitle}
              >
                {attempt.resultSummary.profileTitle}
              </p>
            ) : null}
          </>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <p>{formatDateTime(attempt.startedAt)}</p>
        {attempt.status === 'IN_PROGRESS' || attempt.durationSeconds != null ? (
          <p className={`text-xs ${adminClassNames.text.muted}`}>
            {attempt.status === 'IN_PROGRESS'
              ? 'идёт'
              : `за ${formatDurationSeconds(attempt.durationSeconds)}`}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            onOpenAttemptDetails(attempt.attemptId, 'answers');
          }}
        >
          Ответы
        </Button>
      </TableCell>
    </>
  );
}

export function PublicLinksAttemptsTableCard({
  selectedPublicLink,
  publicAttempts,
  isLoading,
  isFetching,
  page,
  pageSize,
  total,
  totalPages,
  formatDateTime,
  onOpenAttemptDetails,
  onPreviousPage,
  onNextPage,
  onPageSizeChange,
  toolbar,
  exportError = null,
  hasActiveFilters = false,
  sortBy,
  sortOrder,
  onSortChange,
}: PublicLinksAttemptsTableCardProps) {
  const columns = [
    {
      id: 'attempt',
      header: 'Попытка',
      className: 'whitespace-nowrap',
      onSort: () => onSortChange('attemptNumber'),
      sortDirection: sortBy === 'attemptNumber' ? sortOrder : null,
    },
    { id: 'status', header: 'Статус', className: 'whitespace-nowrap' },
    { id: 'analysis', header: 'Анализ', className: 'whitespace-nowrap' },
    {
      id: 'student',
      header: 'Студент',
      className: 'min-w-44',
      onSort: () => onSortChange('studentName'),
      sortDirection: sortBy === 'studentName' ? sortOrder : null,
    },
    { id: 'result', header: 'Результат', className: 'min-w-36' },
    {
      id: 'started',
      header: 'Начало и время',
      className: 'whitespace-nowrap',
      onSort: () => onSortChange('startedAt'),
      sortDirection: sortBy === 'startedAt' ? sortOrder : null,
    },
    { id: 'view', header: 'Ответы', className: 'min-w-24 text-right' },
  ];

  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader>
        <CardTitle>Прохождения студентов</CardTitle>
        <CardDescription>
          {selectedPublicLink
            ? `${hasActiveFilters ? 'Найдено' : 'Всего'} попыток: ${total}, включая незавершённые. Клик по строке открывает анализ; сортировка действует на весь список.`
            : 'Сначала выберите ссылку'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectedPublicLink ? toolbar : null}
        {exportError ? (
          <p className={`text-xs ${adminClassNames.text.muted}`}>{exportError}</p>
        ) : null}

        {isLoading ? (
          <AdminSkeletonRows rows={5} columns={5} label="Загружаем прохождения" />
        ) : null}

        {!isLoading && !selectedPublicLink ? (
          <AdminStateBlock>
            Сначала выберите ссылку, чтобы увидеть прохождения студентов.
          </AdminStateBlock>
        ) : null}

        {!isLoading && selectedPublicLink ? (
          <AdminDataTable
            columns={columns}
            items={publicAttempts}
            getRowKey={(attempt) => attempt.attemptId}
            emptyMessage={
              hasActiveFilters
                ? 'По заданному поиску и статусу ничего не найдено. Сбросьте фильтры.'
                : 'По выбранной ссылке пока нет прохождений. Студенты могут начать тестирование по ссылке.'
            }
            stickyHeader
            onRowClick={(attempt) => onOpenAttemptDetails(attempt.attemptId, 'analysis')}
            renderRow={(attempt) => (
              <AttemptRowCells
                attempt={attempt}
                formatDateTime={formatDateTime}
                onOpenAttemptDetails={onOpenAttemptDetails}
              />
            )}
          />
        ) : null}

        {selectedPublicLink && total > 0 ? (
          <AdminPagination
            page={page}
            totalPages={totalPages}
            isFetching={isFetching}
            pageSize={pageSize}
            pageSizeOptions={ATTEMPTS_LIMIT_OPTIONS}
            onPageSizeChange={onPageSizeChange}
            onPrevious={onPreviousPage}
            onNext={onNextPage}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
