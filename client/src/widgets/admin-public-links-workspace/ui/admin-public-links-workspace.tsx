import { useMemo, useState } from 'react';
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

import { PublicLinkCreateCard } from './public-link-create-card';
import { PublicLinksListCard } from './public-links-list-card';

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

  const openShortLinkQr = (shortCode: string) => {
    window.open(
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        getShortLinkUrl(shortCode),
      )}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <>
      <div className="grid min-h-[calc(100vh-11rem)] gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <PublicLinkCreateCard
          topics={topics}
          effectiveSelectedTopicId={effectiveSelectedTopicId}
          onSelectTopic={setSelectedTopicId}
          newPublicShortCode={newPublicShortCode}
          onShortCodeChange={setNewPublicShortCode}
          newPublicMaxAttempts={newPublicMaxAttempts}
          onMaxAttemptsChange={setNewPublicMaxAttempts}
          newPublicTimeLimit={newPublicTimeLimit}
          onTimeLimitChange={setNewPublicTimeLimit}
          newPublicConsentVersion={newPublicConsentVersion}
          onConsentVersionChange={setNewPublicConsentVersion}
          newPublicConsentText={newPublicConsentText}
          onConsentTextChange={setNewPublicConsentText}
          newPublicAllowResume={newPublicAllowResume}
          onAllowResumeChange={setNewPublicAllowResume}
          onCreatePublicLink={handleCreatePublicLink}
          isCreatingPublicLink={createPublicLinkMutation.isPending}
          hasPublishedVersion={Boolean(detailQuery.data?.published?.id)}
        />

        <PublicLinksListCard
          publicLinksTab={publicLinksTab}
          onSwitchPublicLinksTab={handleSwitchPublicLinksTab}
          visiblePublicLinks={visiblePublicLinks}
          effectivePublicLinkId={effectivePublicLinkId}
          onSelectPublicLink={setSelectedPublicLinkId}
          onCopyShortLink={copyShortLink}
          onOpenQr={openShortLinkQr}
          onTogglePublicLink={handleTogglePublicLink}
          onRegenerateShortCode={handleRegeneratePublicLinkShortCode}
          onArchivePublicLink={setPendingDeletePublicLinkId}
          onRestorePublicLink={handleRestorePublicLink}
          isUpdatingPublicLink={updatePublicLinkMutation.isPending}
          isRegeneratingShortCode={regeneratePublicLinkShortCodeMutation.isPending}
          isArchivingPublicLink={deletePublicLinkMutation.isPending}
          isRestoringPublicLink={restorePublicLinkMutation.isPending}
        />
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
