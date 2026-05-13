import { AdminDataTable } from '@/shared/ui/admin-data-table';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminPagination } from '@/shared/ui/admin-pagination';
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { TableCell } from '@/shared/ui/table';

type AttemptDetailView = 'analysis' | 'answers';

interface PublicAttemptRow {
  attemptId: number;
  attemptNumber: number;
  status: string;
  analysisStatus: string | null;
  studentName: string;
  studentLastInitial: string;
  studentMiddleInitial: string;
  educationOrganization: string;
  groupOrClass: string;
  startedAt: string;
  finishedAt: string | null;
  expiresAt: string | null;
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
  total: number;
  totalPages: number;
  formatDateTime: (value: string | null) => string;
  onOpenAttemptDetails: (attemptId: number, view: AttemptDetailView) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const PUBLIC_ATTEMPTS_COLUMNS = [
  { id: 'id', header: 'ID', className: 'whitespace-nowrap' },
  { id: 'number', header: '№', className: 'whitespace-nowrap' },
  { id: 'status', header: 'Статус', className: 'whitespace-nowrap' },
  { id: 'analysis', header: 'Анализ', className: 'whitespace-nowrap' },
  { id: 'student', header: 'Студент', className: 'min-w-32' },
  { id: 'initials', header: 'Инициалы', className: 'whitespace-nowrap' },
  { id: 'organization', header: 'Учреждение', className: 'min-w-44' },
  { id: 'group', header: 'Группа/класс', className: 'whitespace-nowrap' },
  { id: 'started', header: 'Начало работы', className: 'whitespace-nowrap' },
  { id: 'finished', header: 'Завершение работы', className: 'whitespace-nowrap' },
  { id: 'expires', header: 'Истекает через', className: 'whitespace-nowrap' },
  { id: 'view', header: 'Просмотр', className: 'min-w-36 text-right' },
];

const getAttemptStatusBadgeClassName = (status: string) => {
  if (status === 'COMPLETED' || status === 'FINISHED') {
    return adminBadgeClassNames.success;
  }

  if (status === 'EXPIRED' || status === 'FAILED') {
    return adminBadgeClassNames.danger;
  }

  return adminBadgeClassNames.info;
};

const getAnalysisStatusBadgeClassName = (status: string | null) => {
  if (status === 'READY') {
    return adminBadgeClassNames.success;
  }

  if (status === 'FAILED') {
    return adminBadgeClassNames.danger;
  }

  if (status === 'PENDING') {
    return adminBadgeClassNames.warning;
  }

  return adminBadgeClassNames.neutral;
};

export function PublicLinksAttemptsTableCard({
  selectedPublicLink,
  publicAttempts,
  isLoading,
  isFetching,
  page,
  total,
  totalPages,
  formatDateTime,
  onOpenAttemptDetails,
  onPreviousPage,
  onNextPage,
}: PublicLinksAttemptsTableCardProps) {
  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader>
        <CardTitle>Прохождения студентов</CardTitle>
        <CardDescription>
          {selectedPublicLink ? `Тестов пройдено: ${total}` : 'Сначала выберите ссылку'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <AdminStateBlock>Загружаем данные прохождений...</AdminStateBlock> : null}

        {!isLoading && !selectedPublicLink ? (
          <AdminStateBlock>
            Сначала выберите ссылку, чтобы увидеть прохождения студентов.
          </AdminStateBlock>
        ) : null}

        {!isLoading && selectedPublicLink ? (
          <AdminDataTable
            columns={PUBLIC_ATTEMPTS_COLUMNS}
            items={publicAttempts}
            getRowKey={(attempt) => attempt.attemptId}
            emptyMessage="По выбранной ссылке пока нет прохождений. Студенты могут начать тестирование по ссылке."
            className="overflow-x-auto"
            renderRow={(attempt) => (
              <>
                <TableCell className="whitespace-nowrap">{attempt.attemptId}</TableCell>
                <TableCell className="whitespace-nowrap">#{attempt.attemptNumber}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getAttemptStatusBadgeClassName(attempt.status)}
                  >
                    {attempt.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getAnalysisStatusBadgeClassName(attempt.analysisStatus)}
                  >
                    {attempt.analysisStatus ?? 'NONE'}
                  </Badge>
                </TableCell>
                <TableCell className="min-w-32 max-w-48 truncate">{attempt.studentName}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {attempt.studentLastInitial}.{attempt.studentMiddleInitial}.
                </TableCell>
                <TableCell className="min-w-44 max-w-64 truncate">
                  {attempt.educationOrganization}
                </TableCell>
                <TableCell className="whitespace-nowrap">{attempt.groupOrClass}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(attempt.startedAt)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(attempt.finishedAt)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(attempt.expiresAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenAttemptDetails(attempt.attemptId, 'analysis')}
                    >
                      Анализ
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenAttemptDetails(attempt.attemptId, 'answers')}
                    >
                      Ответы
                    </Button>
                  </div>
                </TableCell>
              </>
            )}
          />
        ) : null}

        {selectedPublicLink && total > 0 ? (
          <AdminPagination
            page={page}
            totalPages={totalPages}
            isFetching={isFetching}
            onPrevious={onPreviousPage}
            onNext={onNextPage}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
