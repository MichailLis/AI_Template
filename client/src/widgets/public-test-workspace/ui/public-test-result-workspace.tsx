import { BrainCircuit, CheckCircle2, ClipboardList } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { useTestsPublicControllerGetSessionResult } from '@/shared/api/generated/tests-public/tests-public';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { PublicThemeLayout } from './public-theme-layout';

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
};

const getAnalysisStatusLabel = (status: string) => {
  switch (status) {
    case 'READY':
      return 'готов';
    case 'PENDING':
      return 'в обработке';
    case 'FAILED':
      return 'ошибка';
    default:
      return status;
  }
};

const getAnalysisStatusVariant = (status: string): 'outline' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'READY':
      return 'secondary';
    case 'FAILED':
      return 'destructive';
    default:
      return 'outline';
  }
};

export function PublicTestResultWorkspace() {
  const { sessionToken } = useParams<{ sessionToken: string }>();

  const resultQuery = useTestsPublicControllerGetSessionResult(sessionToken ?? '', {
    query: {
      enabled: Boolean(sessionToken),
      retry: false,
    },
  });

  if (!sessionToken) {
    return (
      <PublicThemeLayout containerClassName="max-w-3xl">
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 text-sm text-red-700">
          Некорректная ссылка результата теста.
        </div>
      </PublicThemeLayout>
    );
  }

  if (resultQuery.isLoading) {
    return (
      <PublicThemeLayout containerClassName="max-w-3xl">
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 text-sm text-muted-foreground">
          Загружаем результат...
        </div>
      </PublicThemeLayout>
    );
  }

  if (resultQuery.isError || !resultQuery.data) {
    return (
      <PublicThemeLayout containerClassName="max-w-3xl">
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 text-sm text-red-700">
          Результат недоступен. Возможно, тест еще не завершен.
        </div>
      </PublicThemeLayout>
    );
  }

  const result = resultQuery.data;

  return (
    <PublicThemeLayout containerClassName="max-w-3xl">
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Результат теста</CardTitle>
              <CardDescription>
                Итог прохождения и автоматический анализ профориентационного теста.
              </CardDescription>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-3 text-primary-foreground">
              <CheckCircle2 className="h-7 w-7" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getAnalysisStatusVariant(result.analysis.status)}>
              Анализ: {getAnalysisStatusLabel(result.analysis.status)}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Завершено</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {formatDateTime(result.finishedAt)}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Сгенерировано</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {formatDateTime(result.analysis.generatedAt)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {result.analysis.rawText ? (
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <BrainCircuit className="h-4 w-4 text-primary" />
                Краткий текст анализа
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {result.analysis.rawText}
              </p>
            </div>
          ) : null}

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <ClipboardList className="h-4 w-4 text-primary" />
              Структурированные данные анализа
            </p>
            <pre className="max-h-96 overflow-auto rounded-md bg-muted/45 p-3 text-xs text-foreground">
              {JSON.stringify(result.analysis.summary, null, 2)}
            </pre>
          </div>

          {result.analysis.errorMessage ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {result.analysis.errorMessage}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PublicThemeLayout>
  );
}
