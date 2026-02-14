import { useQueries } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  getTestsControllerListPublicLinkAttemptsQueryOptions,
  useTestsControllerGetAttemptDetail,
  useTestsControllerListArchivedPublicLinks,
  useTestsControllerListPublicLinkAttempts,
  useTestsControllerListPublicLinks,
} from '@/shared/api/generated/tests/tests';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

type PublicLinksTab = 'active' | 'archived';
type AttemptDetailView = 'analysis' | 'answers';

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
};

const toPrettyJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export function AdminPublicLinksStatsWorkspace() {
  const listPublicLinksQuery = useTestsControllerListPublicLinks();
  const listArchivedPublicLinksQuery = useTestsControllerListArchivedPublicLinks();

  const [publicLinksTab, setPublicLinksTab] = useState<PublicLinksTab>('active');
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedPublicLinkId, setSelectedPublicLinkId] = useState<number | null>(null);
  const [detailAttemptId, setDetailAttemptId] = useState<number | null>(null);
  const [detailView, setDetailView] = useState<AttemptDetailView | null>(null);

  const activePublicLinks = useMemo(
    () => listPublicLinksQuery.data?.links ?? [],
    [listPublicLinksQuery.data?.links],
  );
  const archivedPublicLinks = useMemo(
    () => listArchivedPublicLinksQuery.data?.links ?? [],
    [listArchivedPublicLinksQuery.data?.links],
  );

  const visiblePublicLinks = useMemo(
    () => (publicLinksTab === 'active' ? activePublicLinks : archivedPublicLinks),
    [activePublicLinks, archivedPublicLinks, publicLinksTab],
  );

  const topicOptions = useMemo(() => {
    const options = new Map<number, string>();

    for (const link of visiblePublicLinks) {
      if (!options.has(link.topicId)) {
        options.set(link.topicId, link.title);
      }
    }

    return Array.from(options.entries()).map(([id, title]) => ({
      id,
      title,
    }));
  }, [visiblePublicLinks]);

  const effectiveTopicId = useMemo(() => {
    if (topicOptions.length === 0) {
      return null;
    }

    if (selectedTopicId && topicOptions.some((topic) => topic.id === selectedTopicId)) {
      return selectedTopicId;
    }

    return topicOptions[0].id;
  }, [selectedTopicId, topicOptions]);

  const linksForTopic = useMemo(() => {
    if (!effectiveTopicId) {
      return [];
    }

    return visiblePublicLinks.filter((link) => link.topicId === effectiveTopicId);
  }, [effectiveTopicId, visiblePublicLinks]);

  const linkAttemptsCountQueries = useQueries({
    queries: linksForTopic.map((link) => ({
      ...getTestsControllerListPublicLinkAttemptsQueryOptions(link.id),
      staleTime: 30_000,
      select: (data: { attempts: unknown[] }) => data.attempts.length,
    })),
  });

  const linkAttemptsCountById = useMemo(() => {
    const result = new Map<number, number>();

    linksForTopic.forEach((link, index) => {
      result.set(link.id, linkAttemptsCountQueries[index]?.data ?? 0);
    });

    return result;
  }, [linkAttemptsCountQueries, linksForTopic]);

  const effectivePublicLinkId = useMemo(() => {
    if (linksForTopic.length === 0) {
      return null;
    }

    if (selectedPublicLinkId && linksForTopic.some((link) => link.id === selectedPublicLinkId)) {
      return selectedPublicLinkId;
    }

    return linksForTopic[0].id;
  }, [linksForTopic, selectedPublicLinkId]);

  const selectedPublicLink =
    linksForTopic.find((link) => link.id === effectivePublicLinkId) ?? null;

  const publicAttemptsQuery = useTestsControllerListPublicLinkAttempts(effectivePublicLinkId ?? 0, {
    query: {
      enabled: Boolean(effectivePublicLinkId),
    },
  });

  const publicAttempts = useMemo(
    () => publicAttemptsQuery.data?.attempts ?? [],
    [publicAttemptsQuery.data?.attempts],
  );

  const attemptDetailQuery = useTestsControllerGetAttemptDetail(detailAttemptId ?? 0, {
    query: {
      enabled: Boolean(detailAttemptId),
    },
  });

  const isDetailDialogOpen = detailView !== null;

  const openAttemptDetails = (attemptId: number, view: AttemptDetailView) => {
    setDetailAttemptId(attemptId);
    setDetailView(view);
  };

  const closeAttemptDetails = () => {
    setDetailView(null);
    setDetailAttemptId(null);
  };

  const detailAttempt = attemptDetailQuery.data;

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-40 space-y-2">
              <Label htmlFor="public-link-scope">Ссылки</Label>
              <select
                id="public-link-scope"
                value={publicLinksTab}
                onChange={(event) => {
                  setPublicLinksTab(event.target.value as PublicLinksTab);
                  setSelectedTopicId(null);
                  setSelectedPublicLinkId(null);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="active">Активные</option>
                <option value="archived">Архив</option>
              </select>
            </div>

            <div className="min-w-64 space-y-2">
              <Label htmlFor="stats-topic-select">Тест</Label>
              <select
                id="stats-topic-select"
                value={effectiveTopicId ? String(effectiveTopicId) : ''}
                onChange={(event) => {
                  setSelectedTopicId(Number.parseInt(event.target.value, 10));
                  setSelectedPublicLinkId(null);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={topicOptions.length === 0}
              >
                {topicOptions.length === 0 ? <option value="">Нет доступных тестов</option> : null}
                {topicOptions.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-64 space-y-2">
              <Label htmlFor="stats-link-select">Публичная ссылка (тестов пройдено)</Label>
              <select
                id="stats-link-select"
                value={effectivePublicLinkId ? String(effectivePublicLinkId) : ''}
                onChange={(event) => {
                  setSelectedPublicLinkId(Number.parseInt(event.target.value, 10));
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={linksForTopic.length === 0}
              >
                {linksForTopic.length === 0 ? <option value="">Нет доступных ссылок</option> : null}
                {linksForTopic.map((link) => {
                  const attemptsCount = linkAttemptsCountById.get(link.id) ?? 0;

                  return (
                    <option key={link.id} value={link.id}>
                      {`${link.shortCode} (${attemptsCount})`}
                    </option>
                  );
                })}
              </select>
            </div>

            <Button asChild type="button" variant="outline" size="sm" className="md:ml-auto">
              <Link to="/admin/public-links">К управлению ссылками</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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
          {publicAttemptsQuery.isLoading ? (
            <p className="text-sm text-slate-500">Загружаем прохождения...</p>
          ) : null}

          {!publicAttemptsQuery.isLoading && publicAttempts.length === 0 ? (
            <p className="text-sm text-slate-500">По выбранной ссылке пока нет прохождений.</p>
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
                    <TableHead>Начало</TableHead>
                    <TableHead>Завершение</TableHead>
                    <TableHead>Истекает</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
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
                            onClick={() => openAttemptDetails(attempt.attemptId, 'analysis')}
                          >
                            Анализ
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openAttemptDetails(attempt.attemptId, 'answers')}
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

      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => !open && closeAttemptDetails()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {detailView === 'analysis' ? 'Анализ студента' : 'Ответы студента'}
            </DialogTitle>
            <DialogDescription>
              {detailAttempt
                ? `${detailAttempt.studentName} • прохождение #${detailAttempt.attemptNumber}`
                : 'Загружаем данные прохождения...'}
            </DialogDescription>
          </DialogHeader>

          {attemptDetailQuery.isLoading ? (
            <p className="text-sm text-slate-500">Загрузка...</p>
          ) : null}

          {!attemptDetailQuery.isLoading && !detailAttempt ? (
            <p className="text-sm text-red-600">Не удалось получить детали прохождения.</p>
          ) : null}

          {!attemptDetailQuery.isLoading && detailAttempt && detailView === 'analysis' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{detailAttempt.status}</Badge>
                <Badge variant="secondary">{detailAttempt.analysis?.status ?? 'NONE'}</Badge>
                <Badge variant="outline">{detailAttempt.analysis?.providerMode ?? 'NONE'}</Badge>
              </div>

              <p className="text-sm text-slate-600">
                Сгенерировано: {formatDateTime(detailAttempt.analysis?.generatedAt ?? null)}
              </p>

              <div>
                <p className="mb-1 text-sm font-medium text-slate-800">Summary</p>
                <pre className="max-h-60 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                  {toPrettyJson(detailAttempt.analysis?.summary ?? null)}
                </pre>
              </div>

              <div>
                <p className="mb-1 text-sm font-medium text-slate-800">Raw text</p>
                <pre className="max-h-60 overflow-auto rounded-md bg-slate-100 p-3 text-xs text-slate-900">
                  {detailAttempt.analysis?.rawText ?? '—'}
                </pre>
              </div>

              {detailAttempt.analysis?.errorMessage ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {detailAttempt.analysis.errorMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          {!attemptDetailQuery.isLoading && detailAttempt && detailView === 'answers' ? (
            <div className="space-y-3">
              {detailAttempt.answers.length === 0 ? (
                <p className="text-sm text-slate-500">Ответы не найдены.</p>
              ) : (
                detailAttempt.answers.map((answer) => (
                  <div
                    key={`${answer.questionId}-${answer.updatedAt}`}
                    className="rounded-md border p-3"
                  >
                    <p className="text-sm font-medium text-slate-900">{answer.questionTitle}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      #{answer.questionId} • {answer.questionType} •{' '}
                      {formatDateTime(answer.updatedAt)}
                    </p>
                    <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                      {toPrettyJson(answer.answerPayload)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
