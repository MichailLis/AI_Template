import { useParams } from 'react-router-dom';

import { useTestsPublicControllerGetSessionResult } from '@/shared/api/generated/tests-public/tests-public';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

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
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10 text-sm text-red-700">
        Некорректная ссылка результата теста.
      </main>
    );
  }

  if (resultQuery.isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10 text-sm text-slate-600">
        Загружаем результат...
      </main>
    );
  }

  if (resultQuery.isError || !resultQuery.data) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10 text-sm text-red-700">
        Результат недоступен. Возможно, тест еще не завершен.
      </main>
    );
  }

  const result = resultQuery.data;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Результат теста</CardTitle>
          <CardDescription>
            Статус: {result.status}
            {result.finishedAt
              ? ` | Завершен: ${new Date(result.finishedAt).toLocaleString()}`
              : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-700">
              Режим анализа: {result.analysis.providerMode}
            </p>
            <p className="mt-1 text-sm text-slate-600">Статус анализа: {result.analysis.status}</p>
          </div>

          {result.analysis.rawText ? (
            <div className="rounded-md border p-3">
              <p className="mb-2 text-sm font-medium text-slate-700">Текст анализа</p>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {result.analysis.rawText}
              </p>
            </div>
          ) : null}

          <div className="rounded-md border p-3">
            <p className="mb-2 text-sm font-medium text-slate-700">
              Структурированные данные анализа
            </p>
            <pre className="max-h-96 overflow-auto text-xs text-slate-700">
              {JSON.stringify(result.analysis.summary, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
