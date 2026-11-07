import { toast } from 'sonner';

import {
  useTestsAdminPublicLinksControllerDeletePublicLink,
  useTestsAdminPublicLinksControllerMoveToActivePublishedVersion,
  useTestsAdminPublicLinksControllerRegeneratePublicLinkShortCode,
  useTestsAdminPublicLinksControllerRestorePublicLink,
  useTestsAdminPublicLinksControllerUpdatePublicLink,
} from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

import { useInvalidatePublicLinkLists } from './use-public-link-access-window';

import type { PublicBrandingConfig } from '@/entities/public-test';

const showError = (error: unknown) => {
  toast.error(parseApiError(error));
};

/**
 * Действия над существующей ссылкой. Каждое обновляет активный и архивный списки;
 * выбор, закрытие подтверждений и прочее состояние экрана остаются за вызывающим через колбэки.
 */
export function usePublicLinkActions() {
  const updatePublicLinkMutation = useTestsAdminPublicLinksControllerUpdatePublicLink();
  const regeneratePublicLinkShortCodeMutation =
    useTestsAdminPublicLinksControllerRegeneratePublicLinkShortCode();
  const deletePublicLinkMutation = useTestsAdminPublicLinksControllerDeletePublicLink();
  const restorePublicLinkMutation = useTestsAdminPublicLinksControllerRestorePublicLink();
  const moveToActivePublishedVersionMutation =
    useTestsAdminPublicLinksControllerMoveToActivePublishedVersion();
  const invalidatePublicLinks = useInvalidatePublicLinkLists();

  const togglePublicLink = (linkId: number, nextActive: boolean) => {
    updatePublicLinkMutation.mutate(
      { linkId, data: { isActive: nextActive } },
      {
        onSuccess: () => {
          toast.success(nextActive ? 'Ссылка активирована' : 'Ссылка деактивирована');
          invalidatePublicLinks();
        },
        onError: showError,
      },
    );
  };

  const updatePublicLinkBranding = (linkId: number, publicBranding: PublicBrandingConfig) => {
    updatePublicLinkMutation.mutate(
      { linkId, data: { publicBranding } },
      {
        onSuccess: () => {
          toast.success(publicBranding ? 'Брендинг сохранен' : 'Брендинг сброшен');
          invalidatePublicLinks();
        },
        onError: showError,
      },
    );
  };

  const regeneratePublicLinkShortCode = (
    linkId: number,
    onDone: (link: { id: number }) => void,
  ) => {
    regeneratePublicLinkShortCodeMutation.mutate(
      { linkId },
      {
        onSuccess: (link) => {
          toast.success('Короткий код обновлен');
          onDone(link);
          invalidatePublicLinks();
        },
        onError: showError,
      },
    );
  };

  const archivePublicLink = (linkId: number, onDone: () => void) => {
    deletePublicLinkMutation.mutate(
      { linkId },
      {
        onSuccess: () => {
          toast.success('Ссылка архивирована и скрыта из списка');
          onDone();
          invalidatePublicLinks();
        },
        onError: showError,
      },
    );
  };

  const restorePublicLink = (linkId: number, onDone: (link: { id: number }) => void) => {
    restorePublicLinkMutation.mutate(
      { linkId },
      {
        onSuccess: (link) => {
          toast.success('Ссылка восстановлена');
          onDone(link);
          invalidatePublicLinks();
        },
        onError: showError,
      },
    );
  };

  /**
   * Перевод ссылки на опубликованную версию теста. Ссылка сама за новой версией не следует
   * (решение ait-rcw.2), поэтому это явное действие, которое подтверждает вызывающий.
   */
  const moveToActivePublishedVersion = (linkId: number, onDone: () => void) => {
    moveToActivePublishedVersionMutation.mutate(
      { linkId },
      {
        onSuccess: () => {
          toast.success('Ссылка переведена на опубликованную версию теста');
          onDone();
          invalidatePublicLinks();
        },
        onError: showError,
      },
    );
  };

  return {
    togglePublicLink,
    updatePublicLinkBranding,
    regeneratePublicLinkShortCode,
    archivePublicLink,
    restorePublicLink,
    moveToActivePublishedVersion,
    isUpdatingPublicLink: updatePublicLinkMutation.isPending,
    isRegeneratingShortCode: regeneratePublicLinkShortCodeMutation.isPending,
    isArchivingPublicLink: deletePublicLinkMutation.isPending,
    isRestoringPublicLink: restorePublicLinkMutation.isPending,
    isMovingToActiveVersion: moveToActivePublishedVersionMutation.isPending,
  };
}
