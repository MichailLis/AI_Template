import { useQueryClient } from '@tanstack/react-query';
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
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminTabs } from '@/shared/ui/admin-tabs';
import { getAdminTabPanelProps } from '@/shared/ui/admin-tabs.model';

import {
  OpenRouterSettingsCard,
  PrivacyPolicySettingsCard,
  ProfessionAtlasSettingsCard,
} from './admin-settings-cards';
import {
  getOpenRouterHealthBadge,
  getProfessionAtlasHealthBadge,
} from './admin-settings-cards.model';
import { AdminSettingsHero } from './admin-settings-hero';
import { usePrivacyPolicyFormState } from './use-privacy-policy-form-state';

import type { FormEvent } from 'react';

type AdminSettingsTab = 'integrations' | 'atlas' | 'privacy';

const SETTINGS_PANEL_ID = 'admin-settings-panel';

const SETTINGS_TABS: Array<{ value: AdminSettingsTab; label: string }> = [
  { value: 'integrations', label: 'Интеграции' },
  { value: 'atlas', label: 'Атлас профессий' },
  { value: 'privacy', label: 'Политика данных' },
];

const DEFAULT_ATLAS_PUBLIC_URL = 'https://atlas.rcs-center.ru';
const DEFAULT_ATLAS_API_URL = 'https://atlas.rcs-center.ru/api-backend';
const getApiErrorMessage = (error: unknown) =>
  getSharedApiErrorMessage(error, { fallbackMessage: 'Запрос не выполнен' });

function PrivacyPolicySettingsWorkspaceCard() {
  const queryClient = useQueryClient();
  const privacyPolicyQuery = useAdminSettingsControllerGetPrivacyPolicySettings();
  const privacyPolicy = privacyPolicyQuery.data?.privacyPolicy;
  const form = usePrivacyPolicyFormState(privacyPolicy);

  const updatePrivacyPolicyMutation = useAdminSettingsControllerUpdatePrivacyPolicy({
    mutation: {
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
      onSuccess: async () => {
        form.resetForm();
        await queryClient.invalidateQueries({
          queryKey: getAdminSettingsControllerGetPrivacyPolicySettingsQueryKey(),
        });
        toast.success('Политика персональных данных сохранена');
      },
    },
  });

  const handlePrivacyPolicySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.isPublishedAtValid ||
      !form.normalizedVersion ||
      !form.normalizedContent ||
      !form.normalizedOperatorFullName ||
      !form.publishedAtIso ||
      updatePrivacyPolicyMutation.isPending
    ) {
      return;
    }

    updatePrivacyPolicyMutation.mutate({
      data: {
        version: form.normalizedVersion,
        publishedAt: form.publishedAtIso,
        content: form.normalizedContent,
        operatorFullName: form.normalizedOperatorFullName,
      },
    });
  };

  return (
    <PrivacyPolicySettingsCard
      canSubmit={
        Boolean(
          form.isPublishedAtValid &&
          form.normalizedVersion &&
          form.normalizedContent &&
          form.normalizedOperatorFullName &&
          form.publishedAtIso,
        ) && !updatePrivacyPolicyMutation.isPending
      }
      content={form.content}
      isError={privacyPolicyQuery.isError}
      isLoading={privacyPolicyQuery.isLoading}
      isOldDateWithNewContent={form.isOldDateWithNewContent}
      isSaving={updatePrivacyPolicyMutation.isPending}
      operatorFullName={form.operatorFullName}
      privacyPolicy={privacyPolicy}
      publishedAt={form.publishedAt}
      version={form.version}
      onRetry={() => {
        void privacyPolicyQuery.refetch();
      }}
      onSubmit={handlePrivacyPolicySubmit}
      onContentChange={form.onContentChange}
      onOperatorFullNameChange={form.onOperatorFullNameChange}
      onPublishedAtChange={form.onPublishedAtChange}
      onPublishedAtValidityChange={form.onPublishedAtValidityChange}
      onSetCurrentDate={form.onSetCurrentDate}
      onVersionChange={form.onVersionChange}
    />
  );
}

export function AdminSettingsWorkspace() {
  const queryClient = useQueryClient();
  const [settingsTab, setSettingsTab] = useState<AdminSettingsTab>('integrations');
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
    <div className={`mx-auto max-w-4xl ${adminClassNames.layout.page}`}>
      <AdminSettingsHero
        openRouterBadge={getOpenRouterHealthBadge(openRouter, { isError: settingsQuery.isError })}
        professionAtlasBadge={getProfessionAtlasHealthBadge(professionAtlas, {
          isError: professionAtlasQuery.isError,
        })}
      />

      <AdminTabs
        ariaLabel="Разделы настроек"
        tabs={SETTINGS_TABS}
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
        panelId={SETTINGS_PANEL_ID}
      />

      <div
        {...getAdminTabPanelProps(SETTINGS_PANEL_ID, settingsTab)}
        className={adminClassNames.layout.page}
      >
        {settingsTab === 'integrations' ? (
          <OpenRouterSettingsCard
            isError={settingsQuery.isError}
            isLoading={settingsQuery.isLoading}
            openRouter={openRouter}
            onRetry={() => {
              void settingsQuery.refetch();
            }}
          />
        ) : null}

        {settingsTab === 'atlas' ? (
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
        ) : null}

        {settingsTab === 'privacy' ? <PrivacyPolicySettingsWorkspaceCard /> : null}
      </div>
    </div>
  );
}
