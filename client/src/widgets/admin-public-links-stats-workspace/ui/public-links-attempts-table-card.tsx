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
  { id: 'student', header: 'Профиль', className: 'min-w-56' },
  { id: 'profileDetails', header: 'Детали профиля', className: 'min-w-64' },
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

const educationLevelLabels = {
  BASIC_GENERAL: 'Основное общее',
  SECONDARY_GENERAL: 'Среднее общее',
  SECONDARY_SPECIAL: 'Среднее специальное',
  INCOMPLETE_HIGHER_FROM_YEAR_3: 'Неоконченное высшее',
  HIGHER: 'Высшее',
} as const;

const genderLabels = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
} as const;

const getAttemptProfilePrimary = (attempt: PublicAttemptRow) => {
  if (attempt.entryProfileMode === 'DEMOGRAPHIC') {
    return [
      attempt.studentGender ? genderLabels[attempt.studentGender] : null,
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
      attempt.studentEducationLevel ? educationLevelLabels[attempt.studentEducationLevel] : null,
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
      attempt.studentGender ? genderLabels[attempt.studentGender] : null,
      attempt.studentResidence,
      attempt.studentEducationLevel ? educationLevelLabels[attempt.studentEducationLevel] : null,
    );
  }

  return educationDetails.filter(Boolean).join(' • ');
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
                <TableCell className="min-w-56 max-w-72 truncate">
                  {getAttemptProfilePrimary(attempt) || '—'}
                </TableCell>
                <TableCell className="min-w-64 max-w-96 truncate">
                  {getAttemptProfileSecondary(attempt) || '—'}
                </TableCell>
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
