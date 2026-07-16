import { useQueryClient } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  getAdminSettingsControllerGetPrivacyPolicySettingsQueryKey,
  getAdminSettingsControllerGetProfessionAtlasSettingsQueryKey,
  useAdminSettingsControllerGetPrivacyPolicySettings,
  useAdminSettingsControllerGetProfessionAtlasSettings,
  useAdminSettingsControllerGetOpenRouterSettings,
  useAdminSettingsControllerUpdatePrivacyPolicy,
  useAdminSettingsControllerUpdateProfessionAtlasUrl,
} from '@/shared/api/generated/admin/admin';
import { getApiErrorMessage as getSharedApiErrorMessage } from '@/shared/lib/api-error';
import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';

import {
  OpenRouterSettingsCard,
  PrivacyPolicySettingsCard,
  ProfessionAtlasSettingsCard,
} from './admin-settings-cards';

import type { FormEvent } from 'react';

const DEFAULT_ATLAS_PUBLIC_URL = 'https://atlas.rcs-center.ru';
const DEFAULT_ATLAS_API_URL = 'https://atlas.rcs-center.ru/api-backend';
const EMPTY_PRIVACY_POLICY_FORM = {
  content: '',
  isDirty: false,
  operatorFullName: '',
  publishedAt: '',
  version: '',
};

const getApiErrorMessage = (error: unknown) =>
  getSharedApiErrorMessage(error, { fallbackMessage: 'Запрос не выполнен' });

const toDateTimeLocalValue = (value: string | null | undefined) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (part: number) => part.toString().padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const toIsoFromDateTimeLocal = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

function AdminSettingsHero({
  isOpenRouterConfigured,
  isProfessionAtlasConfigured,
}: {
  isOpenRouterConfigured: boolean;
  isProfessionAtlasConfigured: boolean;
}) {
  return (
    <div className={`${adminClassNames.panel.hero} rounded-xl p-5`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div
            className={`grid size-11 shrink-0 place-items-center rounded-xl ${adminToneClassNames.accent.icon}`}
          >
            <SlidersHorizontal className="size-5" />
          </div>
          <div className="min-w-0">
            <h1
              className={`text-2xl font-semibold tracking-normal ${adminClassNames.text.heading}`}
            >
              Настройки
            </h1>
            <p className={`mt-1 text-sm ${adminClassNames.text.body}`}>
              OpenRouter используется для анализа ответов. Атлас профессий показывается на публичной
              странице результата.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Badge
            variant="outline"
            className={
              isOpenRouterConfigured ? adminBadgeClassNames.success : adminBadgeClassNames.warning
            }
          >
            {isOpenRouterConfigured ? 'OpenRouter готов' : 'OpenRouter требует ключ'}
          </Badge>
          <Badge
            variant="outline"
            className={
              isProfessionAtlasConfigured ? adminBadgeClassNames.info : adminBadgeClassNames.neutral
            }
          >
            {isProfessionAtlasConfigured ? 'Атлас подключен' : 'Атлас не задан'}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function PrivacyPolicySettingsWorkspaceCard() {
  const queryClient = useQueryClient();
  const [privacyPolicyForm, setPrivacyPolicyForm] = useState(EMPTY_PRIVACY_POLICY_FORM);
  const privacyPolicyQuery = useAdminSettingsControllerGetPrivacyPolicySettings();
  const updatePrivacyPolicyMutation = useAdminSettingsControllerUpdatePrivacyPolicy({
    mutation: {
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
      onSuccess: async () => {
        setPrivacyPolicyForm(EMPTY_PRIVACY_POLICY_FORM);
        await queryClient.invalidateQueries({
          queryKey: getAdminSettingsControllerGetPrivacyPolicySettingsQueryKey(),
        });
        toast.success('Политика персональных данных сохранена');
      },
    },
  });

  const privacyPolicy = privacyPolicyQuery.data?.privacyPolicy;
  const privacyPolicyVersion = privacyPolicyForm.isDirty
    ? privacyPolicyForm.version
    : (privacyPolicy?.version ?? '');
  const privacyPolicyPublishedAt = privacyPolicyForm.isDirty
    ? privacyPolicyForm.publishedAt
    : toDateTimeLocalValue(privacyPolicy?.publishedAt);
  const privacyPolicyContent = privacyPolicyForm.isDirty
    ? privacyPolicyForm.content
    : (privacyPolicy?.content ?? '');
  const privacyPolicyOperatorFullName = privacyPolicyForm.isDirty
    ? privacyPolicyForm.operatorFullName
    : (privacyPolicy?.operatorFullName ?? '');
  const normalizedPrivacyPolicyVersion = privacyPolicyVersion.trim();
  const normalizedPrivacyPolicyContent = privacyPolicyContent.trim();
  const normalizedPrivacyPolicyOperatorFullName = privacyPolicyOperatorFullName.trim();
  const privacyPolicyPublishedAtIso = toIsoFromDateTimeLocal(privacyPolicyPublishedAt);
  const getPrivacyPolicyDraft = (current: typeof privacyPolicyForm) => ({
    content: current.isDirty ? current.content : (privacyPolicy?.content ?? ''),
    operatorFullName: current.isDirty
      ? current.operatorFullName
      : (privacyPolicy?.operatorFullName ?? ''),
    publishedAt: current.isDirty
      ? current.publishedAt
      : toDateTimeLocalValue(privacyPolicy?.publishedAt),
    version: current.isDirty ? current.version : (privacyPolicy?.version ?? ''),
  });

  const handlePrivacyPolicySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !normalizedPrivacyPolicyVersion ||
      !normalizedPrivacyPolicyContent ||
      !normalizedPrivacyPolicyOperatorFullName ||
      !privacyPolicyPublishedAtIso ||
      updatePrivacyPolicyMutation.isPending
    ) {
      return;
    }

    updatePrivacyPolicyMutation.mutate({
      data: {
        version: normalizedPrivacyPolicyVersion,
        publishedAt: privacyPolicyPublishedAtIso,
        content: normalizedPrivacyPolicyContent,
        operatorFullName: normalizedPrivacyPolicyOperatorFullName,
      },
    });
  };

  return (
    <PrivacyPolicySettingsCard
      canSubmit={
        Boolean(
          normalizedPrivacyPolicyVersion &&
          normalizedPrivacyPolicyContent &&
          normalizedPrivacyPolicyOperatorFullName &&
          privacyPolicyPublishedAtIso,
        ) && !updatePrivacyPolicyMutation.isPending
      }
      content={privacyPolicyContent}
      isError={privacyPolicyQuery.isError}
      isLoading={privacyPolicyQuery.isLoading}
      isSaving={updatePrivacyPolicyMutation.isPending}
      operatorFullName={privacyPolicyOperatorFullName}
      privacyPolicy={privacyPolicy}
      publishedAt={privacyPolicyPublishedAt}
      version={privacyPolicyVersion}
      onRetry={() => {
        void privacyPolicyQuery.refetch();
      }}
      onSubmit={handlePrivacyPolicySubmit}
      onContentChange={(value) =>
        setPrivacyPolicyForm((current) => ({
          ...getPrivacyPolicyDraft(current),
          isDirty: true,
          content: value,
        }))
      }
      onOperatorFullNameChange={(value) =>
        setPrivacyPolicyForm((current) => ({
          ...getPrivacyPolicyDraft(current),
          isDirty: true,
          operatorFullName: value,
        }))
      }
      onPublishedAtChange={(value) =>
        setPrivacyPolicyForm((current) => ({
          ...getPrivacyPolicyDraft(current),
          isDirty: true,
          publishedAt: value,
        }))
      }
      onVersionChange={(value) =>
        setPrivacyPolicyForm((current) => ({
          ...getPrivacyPolicyDraft(current),
          isDirty: true,
          version: value,
        }))
      }
    />
  );
}

export function AdminSettingsWorkspace() {
  const queryClient = useQueryClient();
  const [professionAtlasForm, setProfessionAtlasForm] = useState({
    apiUrl: '',
    isDirty: false,
    publicUrl: '',
  });

  const settingsQuery = useAdminSettingsControllerGetOpenRouterSettings();
  const professionAtlasQuery = useAdminSettingsControllerGetProfessionAtlasSettings();
  const updateProfessionAtlasUrlMutation = useAdminSettingsControllerUpdateProfessionAtlasUrl({
    mutation: {
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
      onSuccess: async () => {
        setProfessionAtlasForm({ apiUrl: '', isDirty: false, publicUrl: '' });
        await queryClient.invalidateQueries({
          queryKey: getAdminSettingsControllerGetProfessionAtlasSettingsQueryKey(),
        });
        toast.success('Настройки Атласа профессий сохранены');
      },
    },
  });

  const openRouter = settingsQuery.data?.openRouter;
  const professionAtlas = professionAtlasQuery.data?.professionAtlas;
  const professionAtlasPublicUrl = professionAtlasForm.isDirty
    ? professionAtlasForm.publicUrl
    : (professionAtlas?.publicUrl ?? professionAtlas?.url ?? DEFAULT_ATLAS_PUBLIC_URL);
  const professionAtlasApiUrl = professionAtlasForm.isDirty
    ? professionAtlasForm.apiUrl
    : (professionAtlas?.apiUrl ?? DEFAULT_ATLAS_API_URL);
  const normalizedProfessionAtlasPublicUrl = professionAtlasPublicUrl.trim();
  const normalizedProfessionAtlasApiUrl = professionAtlasApiUrl.trim();

  const handleProfessionAtlasSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !normalizedProfessionAtlasPublicUrl ||
      !normalizedProfessionAtlasApiUrl ||
      updateProfessionAtlasUrlMutation.isPending
    ) {
      return;
    }

    updateProfessionAtlasUrlMutation.mutate({
      data: {
        publicUrl: normalizedProfessionAtlasPublicUrl,
        apiUrl: normalizedProfessionAtlasApiUrl,
      },
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <AdminSettingsHero
        isOpenRouterConfigured={Boolean(openRouter?.isConfigured)}
        isProfessionAtlasConfigured={Boolean(
          (professionAtlas?.publicUrl ?? professionAtlas?.url) && professionAtlas?.apiUrl,
        )}
      />

      <OpenRouterSettingsCard
        isError={settingsQuery.isError}
        isLoading={settingsQuery.isLoading}
        openRouter={openRouter}
        onRetry={() => {
          void settingsQuery.refetch();
        }}
      />

      <ProfessionAtlasSettingsCard
        apiUrl={professionAtlasApiUrl}
        publicUrl={professionAtlasPublicUrl}
        canSubmit={
          Boolean(normalizedProfessionAtlasPublicUrl && normalizedProfessionAtlasApiUrl) &&
          !updateProfessionAtlasUrlMutation.isPending
        }
        isError={professionAtlasQuery.isError}
        isLoading={professionAtlasQuery.isLoading}
        isSaving={updateProfessionAtlasUrlMutation.isPending}
        professionAtlas={professionAtlas}
        onRetry={() => {
          void professionAtlasQuery.refetch();
        }}
        onSubmit={handleProfessionAtlasSubmit}
        onApiUrlChange={(value) =>
          setProfessionAtlasForm((current) => ({
            apiUrl: value,
            isDirty: true,
            publicUrl: current.isDirty ? current.publicUrl : professionAtlasPublicUrl,
          }))
        }
        onPublicUrlChange={(value) =>
          setProfessionAtlasForm((current) => ({
            apiUrl: current.isDirty ? current.apiUrl : professionAtlasApiUrl,
            isDirty: true,
            publicUrl: value,
          }))
        }
      />

      <PrivacyPolicySettingsWorkspaceCard />
    </div>
  );
}
