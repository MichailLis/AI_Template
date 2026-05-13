import { AdminDataTable } from '@/shared/ui/admin-data-table';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminPagination } from '@/shared/ui/admin-pagination';
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
  { id: 'id', header: 'ID' },
  { id: 'number', header: '№' },
  { id: 'status', header: 'Статус' },
  { id: 'analysis', header: 'Анализ' },
  { id: 'student', header: 'Студент' },
  { id: 'initials', header: 'Инициалы' },
  { id: 'organization', header: 'Учреждение' },
  { id: 'group', header: 'Группа/класс' },
  { id: 'started', header: 'Начало работы' },
  { id: 'finished', header: 'Завершение работы' },
  { id: 'expires', header: 'Истекает через' },
  { id: 'view', header: 'Просмотр', className: 'text-right' },
];

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
        {isLoading ? (
          <p className={`text-sm ${adminClassNames.text.muted}`}>Загружаем данные прохождений...</p>
        ) : null}

        {!isLoading && !selectedPublicLink ? (
          <p className={`text-sm ${adminClassNames.text.muted}`}>
            Сначала выберите ссылку, чтобы увидеть прохождения студентов.
          </p>
        ) : null}

        {selectedPublicLink ? (
          <AdminDataTable
            columns={PUBLIC_ATTEMPTS_COLUMNS}
            items={publicAttempts}
            getRowKey={(attempt) => attempt.attemptId}
            emptyMessage="По выбранной ссылке пока нет прохождений. Студенты могут начать тестирование по ссылке."
            renderRow={(attempt) => (
              <>
                <TableCell>{attempt.attemptId}</TableCell>
                <TableCell>#{attempt.attemptNumber}</TableCell>
                <TableCell>
                  <Badge variant="outline">{attempt.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{attempt.analysisStatus ?? 'NONE'}</Badge>
                </TableCell>
                <TableCell>{attempt.studentName}</TableCell>
                <TableCell>
                  {attempt.studentLastInitial}.{attempt.studentMiddleInitial}.
                </TableCell>
                <TableCell>{attempt.educationOrganization}</TableCell>
                <TableCell>{attempt.groupOrClass}</TableCell>
                <TableCell>{formatDateTime(attempt.startedAt)}</TableCell>
                <TableCell>{formatDateTime(attempt.finishedAt)}</TableCell>
                <TableCell>{formatDateTime(attempt.expiresAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
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
