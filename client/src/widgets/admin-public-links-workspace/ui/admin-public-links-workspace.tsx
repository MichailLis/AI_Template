import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { ConfirmActionDialog, parseApiError } from '@/features/tests';
import {
  useTestsControllerCreatePublicLink,
  useTestsControllerDeletePublicLink,
  useTestsControllerGetTopicDraft,
  useTestsControllerListArchivedPublicLinks,
  useTestsControllerListPublicLinks,
  useTestsControllerListTopics,
  useTestsControllerRegeneratePublicLinkShortCode,
  useTestsControllerRestorePublicLink,
  useTestsControllerUpdatePublicLink,
} from '@/shared/api/generated/tests/tests';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

type PublicLinksTab = 'active' | 'archived';

export function AdminPublicLinksWorkspace() {
  const topicsQuery = useTestsControllerListTopics();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const topics = useMemo(() => topicsQuery.data?.topics ?? [], [topicsQuery.data?.topics]);
  const effectiveSelectedTopicId = useMemo(() => {
    if (topics.length === 0) {
      return 0;
    }

    if (selectedTopicId && topics.some((topic) => topic.id === selectedTopicId)) {
      return selectedTopicId;
    }

    return topics[0].id;
  }, [selectedTopicId, topics]);

  const detailQuery = useTestsControllerGetTopicDraft(effectiveSelectedTopicId, {
    query: {
      enabled: effectiveSelectedTopicId > 0,
    },
  });

  const listPublicLinksQuery = useTestsControllerListPublicLinks();
  const listArchivedPublicLinksQuery = useTestsControllerListArchivedPublicLinks();
  const createPublicLinkMutation = useTestsControllerCreatePublicLink();
  const deletePublicLinkMutation = useTestsControllerDeletePublicLink();
  const updatePublicLinkMutation = useTestsControllerUpdatePublicLink();
  const regeneratePublicLinkShortCodeMutation = useTestsControllerRegeneratePublicLinkShortCode();
  const restorePublicLinkMutation = useTestsControllerRestorePublicLink();

  const [newPublicShortCode, setNewPublicShortCode] = useState('');
  const [newPublicMaxAttempts, setNewPublicMaxAttempts] = useState('3');
  const [newPublicTimeLimit, setNewPublicTimeLimit] = useState('30');
  const [newPublicAllowResume, setNewPublicAllowResume] = useState(true);
  const [newPublicConsentVersion, setNewPublicConsentVersion] = useState('v1');
  const [newPublicConsentText, setNewPublicConsentText] = useState(
    'Я даю согласие на обработку персональных данных для прохождения тестирования и формирования аналитики.',
  );
  const [selectedPublicLinkId, setSelectedPublicLinkId] = useState<number | null>(null);
  const [pendingDeletePublicLinkId, setPendingDeletePublicLinkId] = useState<number | null>(null);
  const [publicLinksTab, setPublicLinksTab] = useState<PublicLinksTab>('active');

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
  }, [visiblePublicLinks, selectedPublicLinkId]);

  const getShortLinkUrl = (shortCode: string) => {
    if (typeof window === 'undefined') {
      return `/t/${shortCode}`;
    }

    return `${window.location.origin}/t/${shortCode}`;
  };

  const refetchPublicLinks = () => {
    void Promise.all([listPublicLinksQuery.refetch(), listArchivedPublicLinksQuery.refetch()]);
  };

  const handleCreatePublicLink = () => {
    const publishedVersionId = detailQuery.data?.published?.id;

    if (!publishedVersionId) {
      toast.error('Сначала опубликуйте версию теста, затем создайте публичную ссылку');
      return;
    }

    const parsedMaxAttempts = Number.parseInt(newPublicMaxAttempts, 10);
    if (!Number.isInteger(parsedMaxAttempts) || parsedMaxAttempts < 1) {
      toast.error('Лимит попыток должен быть целым числом больше 0');
      return;
    }

    const parsedTimeLimit = newPublicTimeLimit.trim()
      ? Number.parseInt(newPublicTimeLimit.trim(), 10)
      : null;

    if (newPublicTimeLimit.trim() && (!parsedTimeLimit || parsedTimeLimit < 1)) {
      toast.error('Ограничение времени должно быть целым числом минут больше 0');
      return;
    }

    createPublicLinkMutation.mutate(
      {
        data: {
          publishedVersionId,
          shortCode: newPublicShortCode.trim() || undefined,
          maxAttemptsPerStudent: parsedMaxAttempts,
          timeLimitMinutes: parsedTimeLimit,
          allowResume: newPublicAllowResume,
          consentVersion: newPublicConsentVersion.trim() || 'v1',
          consentText: newPublicConsentText.trim(),
        },
      },
      {
        onSuccess: (link) => {
          toast.success('Публичная ссылка создана');
          setPublicLinksTab('active');
          setSelectedPublicLinkId(link.id);
          setNewPublicShortCode('');
          refetchPublicLinks();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleTogglePublicLink = (linkId: number, nextActive: boolean) => {
    updatePublicLinkMutation.mutate(
      {
        linkId,
        data: {
          isActive: nextActive,
        },
      },
      {
        onSuccess: () => {
          toast.success(nextActive ? 'Ссылка активирована' : 'Ссылка деактивирована');
          refetchPublicLinks();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleRegeneratePublicLinkShortCode = (linkId: number) => {
    regeneratePublicLinkShortCodeMutation.mutate(
      {
        linkId,
      },
      {
        onSuccess: (link) => {
          toast.success('Короткий код обновлен');
          setSelectedPublicLinkId(link.id);
          refetchPublicLinks();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleDeletePublicLink = () => {
    if (!pendingDeletePublicLinkId) {
      return;
    }

    const deletingId = pendingDeletePublicLinkId;

    deletePublicLinkMutation.mutate(
      {
        linkId: deletingId,
      },
      {
        onSuccess: () => {
          toast.success('Ссылка архивирована и скрыта из списка');
          setPendingDeletePublicLinkId(null);

          if (selectedPublicLinkId === deletingId) {
            setSelectedPublicLinkId(null);
          }

          refetchPublicLinks();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleRestorePublicLink = (linkId: number) => {
    restorePublicLinkMutation.mutate(
      {
        linkId,
      },
      {
        onSuccess: (link) => {
          toast.success('Ссылка восстановлена');
          setPublicLinksTab('active');
          setSelectedPublicLinkId(link.id);
          refetchPublicLinks();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleSwitchPublicLinksTab = (tab: PublicLinksTab) => {
    setPublicLinksTab(tab);
    setSelectedPublicLinkId(null);
  };

  const copyShortLink = async (shortCode: string) => {
    try {
      await navigator.clipboard.writeText(getShortLinkUrl(shortCode));
      toast.success('Короткая ссылка скопирована');
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  return (
    <>
      <div className="grid min-h-[calc(100vh-11rem)] gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="h-full border-slate-200">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Параметры новой ссылки</CardTitle>
            <CardDescription>Выберите тест и настройте доступ для студентов.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="public-topic">Тест</Label>
              <select
                id="public-topic"
                value={effectiveSelectedTopicId > 0 ? String(effectiveSelectedTopicId) : ''}
                onChange={(event) => {
                  setSelectedTopicId(Number.parseInt(event.target.value, 10));
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={topics.length === 0}
              >
                {topics.length === 0 ? <option value="">Нет доступных тестов</option> : null}
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.draftTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="public-short-code">Короткий код (опционально)</Label>
                <Input
                  id="public-short-code"
                  value={newPublicShortCode}
                  onChange={(event) => setNewPublicShortCode(event.target.value.toUpperCase())}
                  placeholder="Например: TEST2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="public-max-attempts">Лимит попыток</Label>
                  <Input
                    id="public-max-attempts"
                    type="number"
                    min={1}
                    value={newPublicMaxAttempts}
                    onChange={(event) => setNewPublicMaxAttempts(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="public-time-limit">Лимит времени</Label>
                  <Input
                    id="public-time-limit"
                    type="number"
                    min={1}
                    value={newPublicTimeLimit}
                    onChange={(event) => setNewPublicTimeLimit(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="public-consent-version">Версия согласия</Label>
                <Input
                  id="public-consent-version"
                  value={newPublicConsentVersion}
                  onChange={(event) => setNewPublicConsentVersion(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="public-consent-text">Текст согласия</Label>
                <Textarea
                  id="public-consent-text"
                  value={newPublicConsentText}
                  onChange={(event) => setNewPublicConsentText(event.target.value)}
                  className="min-h-20"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={newPublicAllowResume}
                onChange={(event) => setNewPublicAllowResume(event.target.checked)}
              />
              Разрешить возобновление
            </label>

            <Button
              type="button"
              onClick={handleCreatePublicLink}
              disabled={createPublicLinkMutation.isPending || !detailQuery.data?.published?.id}
              className="w-full"
            >
              {createPublicLinkMutation.isPending ? 'Создаем...' : 'Создать ссылку'}
            </Button>

            <Button asChild type="button" variant="outline" className="w-full">
              <Link to="/admin/public-links/stats">Открыть статистику</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full border-slate-200">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Ссылки и архив</CardTitle>
            <CardDescription>Операции со ссылками без перехода между экранами.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[calc(100%-6.5rem)] flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={publicLinksTab === 'active' ? 'default' : 'outline'}
                onClick={() => handleSwitchPublicLinksTab('active')}
              >
                Активные
              </Button>
              <Button
                type="button"
                size="sm"
                variant={publicLinksTab === 'archived' ? 'default' : 'outline'}
                onClick={() => handleSwitchPublicLinksTab('archived')}
              >
                Архив
              </Button>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {visiblePublicLinks.map((link) => (
                <div
                  key={link.id}
                  className={`rounded-md border p-3 ${
                    link.id === effectivePublicLinkId
                      ? 'border-primary bg-slate-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="text-left text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
                      onClick={() => setSelectedPublicLinkId(link.id)}
                    >
                      {link.shortCode}
                    </button>
                    <span className="text-xs text-slate-600">{link.title}</span>
                    <span className="ml-auto text-xs text-slate-500">
                      {link.archivedAt ? 'В архиве' : link.isActive ? 'Активна' : 'Отключена'}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {publicLinksTab === 'active' ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void copyShortLink(link.shortCode)}
                        >
                          Копировать
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(
                              `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                                getShortLinkUrl(link.shortCode),
                              )}`,
                              '_blank',
                              'noopener,noreferrer',
                            )
                          }
                        >
                          QR
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleTogglePublicLink(link.id, !link.isActive)}
                          disabled={updatePublicLinkMutation.isPending}
                        >
                          {link.isActive ? 'Деактивировать' : 'Активировать'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleRegeneratePublicLinkShortCode(link.id)}
                          disabled={regeneratePublicLinkShortCodeMutation.isPending}
                        >
                          Новый код
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => setPendingDeletePublicLinkId(link.id)}
                          disabled={deletePublicLinkMutation.isPending}
                        >
                          Архивировать
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestorePublicLink(link.id)}
                        disabled={restorePublicLinkMutation.isPending}
                      >
                        Восстановить
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {visiblePublicLinks.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {publicLinksTab === 'active'
                    ? 'Публичные ссылки еще не созданы.'
                    : 'Архив пуст. Здесь появятся архивные ссылки.'}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmActionDialog
        open={Boolean(pendingDeletePublicLinkId)}
        title="Архивировать публичную ссылку?"
        description="Ссылка станет недоступной и исчезнет из списка. Данные попыток сохранятся."
        confirmLabel="Архивировать"
        variant="destructive"
        isConfirming={deletePublicLinkMutation.isPending}
        onConfirm={handleDeletePublicLink}
        onClose={() => setPendingDeletePublicLinkId(null)}
      />
    </>
  );
}
