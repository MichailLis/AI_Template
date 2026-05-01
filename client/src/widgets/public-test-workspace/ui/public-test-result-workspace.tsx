import { CheckCircle2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { TestAnalysisResultView } from '@/features/tests';
import { useTestsPublicControllerGetSessionResult } from '@/shared/api/generated/tests-public/tests-public';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { PublicThemeLayout } from './public-theme-layout';

import type { PublicSessionResultResponseDto } from '@/shared/api/model';

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
};

export function PublicTestResultWorkspace() {
  const { sessionToken } = useParams<{ sessionToken: string }>();

  const resultQuery = useTestsPublicControllerGetSessionResult(sessionToken ?? '', {
    query: {
      enabled: Boolean(sessionToken),
      retry: false,
      refetchInterval: (query) => {
        const data = query.state.data as PublicSessionResultResponseDto | undefined;
        return data?.analysis.status === 'PENDING' ? 3000 : false;
      },
    },
  });

  if (!sessionToken) {
    return (
      <PublicThemeLayout containerClassName="max-w-3xl">
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 text-sm text-red-700">
          Ссылка недействительна. Проверьте, что вы перешли по верной ссылке.
        </div>
      </PublicThemeLayout>
    );
  }

  if (resultQuery.isLoading) {
    return (
      <PublicThemeLayout containerClassName="max-w-3xl">
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 text-sm text-muted-foreground">
          Анализируется ваш результат. Это займет несколько секунд.
        </div>
      </PublicThemeLayout>
    );
  }

  if (resultQuery.isError || !resultQuery.data) {
    return (
      <PublicThemeLayout containerClassName="max-w-3xl">
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 text-sm text-red-700">
          Анализируется ваш результат. Это займет несколько секунд.
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

        <CardContent>
          <TestAnalysisResultView
            analysis={result.analysis}
            generatedAtLabel={`Сгенерировано: ${formatDateTime(result.analysis.generatedAt)}`}
          />
        </CardContent>
      </Card>
    </PublicThemeLayout>
  );
}
