import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  useTestsControllerGetAttemptDetail,
  useTestsControllerListArchivedPublicLinks,
  useTestsControllerListPublicLinkAttempts,
  useTestsControllerListPublicLinks,
} from '@/shared/api/generated/tests/tests';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

type PublicLinksTab = 'active' | 'archived';

export function AdminPublicLinksStatsWorkspace() {
  const listPublicLinksQuery = useTestsControllerListPublicLinks();
  const listArchivedPublicLinksQuery = useTestsControllerListArchivedPublicLinks();

  const [publicLinksTab, setPublicLinksTab] = useState<PublicLinksTab>('active');
  const [selectedPublicLinkId, setSelectedPublicLinkId] = useState<number | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);

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

  const effectivePublicLinkId = useMemo(() => {
    if (visiblePublicLinks.length === 0) {
      return null;
    }

    if (
      selectedPublicLinkId &&
      visiblePublicLinks.some((link) => link.id === selectedPublicLinkId)
    ) {
      return selectedPublicLinkId;
    }

    return visiblePublicLinks[0].id;
  }, [selectedPublicLinkId, visiblePublicLinks]);

  const publicAttemptsQuery = useTestsControllerListPublicLinkAttempts(effectivePublicLinkId ?? 0, {
    query: {
      enabled: Boolean(effectivePublicLinkId),
    },
  });

  const publicAttempts = useMemo(
    () => publicAttemptsQuery.data?.attempts ?? [],
    [publicAttemptsQuery.data?.attempts],
  );

  const effectiveAttemptId = useMemo(() => {
    if (publicAttempts.length === 0) {
      return null;
    }

    if (
      selectedAttemptId &&
      publicAttempts.some((attempt) => attempt.attemptId === selectedAttemptId)
    ) {
      return selectedAttemptId;
    }

    return publicAttempts[0].attemptId;
  }, [publicAttempts, selectedAttemptId]);

  const attemptDetailQuery = useTestsControllerGetAttemptDetail(effectiveAttemptId ?? 0, {
    query: {
      enabled: Boolean(effectiveAttemptId),
    },
  });

  const selectedPublicLink =
    visiblePublicLinks.find((link) => link.id === effectivePublicLinkId) ?? null;
  const selectedAttemptDetail = attemptDetailQuery.data ?? null;

  const handleSwitchTab = (tab: PublicLinksTab) => {
    setPublicLinksTab(tab);
    setSelectedPublicLinkId(null);
    setSelectedAttemptId(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Статистика публичных ссылок</CardTitle>
          <CardDescription>Просмотр попыток и аналитики ответов студентов.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild type="button" variant="outline" size="sm">
            <Link to="/admin/public-links">Назад к управлению ссылками</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Выбор ссылки</CardTitle>
            <CardDescription>
              {selectedPublicLink
                ? `Текущая: ${selectedPublicLink.shortCode}`
                : 'Выберите ссылку из списка'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={publicLinksTab === 'active' ? 'default' : 'outline'}
                onClick={() => handleSwitchTab('active')}
              >
                Активные
              </Button>
              <Button
                type="button"
                size="sm"
                variant={publicLinksTab === 'archived' ? 'default' : 'outline'}
                onClick={() => handleSwitchTab('archived')}
              >
                Архив
              </Button>
            </div>

            <div className="max-h-[calc(100vh-23rem)] space-y-2 overflow-y-auto pr-1">
              {visiblePublicLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className={`w-full rounded-md border p-3 text-left ${
                    link.id === effectivePublicLinkId
                      ? 'border-primary bg-slate-50'
                      : 'border-slate-200'
                  }`}
                  onClick={() => {
                    setSelectedPublicLinkId(link.id);
                    setSelectedAttemptId(null);
                  }}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-900">{link.shortCode}</span>
                    <span className="text-xs text-slate-600">{link.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {link.archivedAt ? 'В архиве' : link.isActive ? 'Активна' : 'Отключена'}
                  </p>
                </button>
              ))}

              {visiblePublicLinks.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {publicLinksTab === 'active'
                    ? 'Активных ссылок пока нет.'
                    : 'Архивных ссылок пока нет.'}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Попытки и детали</CardTitle>
            <CardDescription>
              {selectedPublicLink
                ? `Попытки по ссылке ${selectedPublicLink.shortCode}`
                : 'Сначала выберите ссылку'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-[calc(100vh-28rem)] space-y-2 overflow-y-auto pr-1">
              {publicAttempts.map((attempt) => (
                <button
                  key={attempt.attemptId}
                  type="button"
                  className={`w-full rounded-md border p-3 text-left ${
                    attempt.attemptId === effectiveAttemptId
                      ? 'border-primary bg-slate-50'
                      : 'border-slate-200'
                  }`}
                  onClick={() => setSelectedAttemptId(attempt.attemptId)}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{attempt.studentName}</span>
                    <span className="text-xs text-slate-500">#{attempt.attemptNumber}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {attempt.educationOrganization} • {attempt.groupOrClass}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Статус: {attempt.status} • Старт: {new Date(attempt.startedAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>

            {publicAttemptsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Загружаем попытки...</p>
            ) : null}

            {effectivePublicLinkId &&
            !publicAttemptsQuery.isLoading &&
            publicAttempts.length === 0 ? (
              <p className="text-sm text-slate-500">По этой ссылке пока нет попыток.</p>
            ) : null}

            {selectedAttemptDetail ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-800">
                  Детали попытки #{selectedAttemptDetail.attemptNumber}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Согласие: {selectedAttemptDetail.consentVersion}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Ответов: {selectedAttemptDetail.answers.length}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Анализ: {selectedAttemptDetail.analysis?.status ?? 'нет'}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
