import { Badge } from '@/shared/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import type { PublicTestSession } from './public-test-run.types';

interface PublicTestRunSummaryCardProps {
  session: PublicTestSession;
  totalQuestionsCount: number;
  answeredQuestionsCount: number;
}

export function PublicTestRunSummaryCard({
  session,
  totalQuestionsCount,
  answeredQuestionsCount,
}: PublicTestRunSummaryCardProps) {
  return (
    <Card className="mb-6 border-border/60 bg-card shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">Прохождение теста</CardTitle>
            <CardDescription>
              Сохраните ответы и завершите тест после заполнения всех вопросов.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Попытка #{session.attemptNumber}</Badge>
            {session.expiresAt ? (
              <Badge variant="outline">До {new Date(session.expiresAt).toLocaleTimeString()}</Badge>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
            <p className="text-xs text-muted-foreground">Вопросов</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{totalQuestionsCount}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
            <p className="text-xs text-muted-foreground">Заполнено</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{answeredQuestionsCount}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
            <p className="text-xs text-muted-foreground">Лимит времени</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {session.timeLimitMinutes ? `${session.timeLimitMinutes} мин` : 'Без лимита'}
            </p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
