import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

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
  formatDateTime: (value: string | null) => string;
  onOpenAttemptDetails: (attemptId: number, view: AttemptDetailView) => void;
}

export function PublicLinksAttemptsTableCard({
  selectedPublicLink,
  publicAttempts,
  isLoading,
  formatDateTime,
  onOpenAttemptDetails,
}: PublicLinksAttemptsTableCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Прохождения студентов</CardTitle>
        <CardDescription>
          {selectedPublicLink
            ? `Тестов пройдено: ${publicAttempts.length}`
            : 'Сначала выберите ссылку'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-slate-500">Загружаем данные прохождений...</p>
        ) : null}

        {!isLoading && publicAttempts.length === 0 ? (
          <p className="text-sm text-slate-500">
            По выбранной ссылке пока нет прохождений.
            {selectedPublicLink ? ' Студенты могут начать тестирование по ссылке.' : ''}
          </p>
        ) : null}

        {publicAttempts.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>№</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Анализ</TableHead>
                  <TableHead>Студент</TableHead>
                  <TableHead>Инициалы</TableHead>
                  <TableHead>Учреждение</TableHead>
                  <TableHead>Группа/класс</TableHead>
                  <TableHead>Начало работы</TableHead>
                  <TableHead>Завершение работы</TableHead>
                  <TableHead>Истекает через</TableHead>
                  <TableHead className="text-right">Просмотр</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publicAttempts.map((attempt) => (
                  <TableRow key={attempt.attemptId}>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
