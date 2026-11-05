import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getTestsAdminPublicLinksControllerListArchivedPublicLinksQueryKey,
  getTestsAdminPublicLinksControllerListPublicLinksQueryKey,
  useTestsAdminPublicLinksControllerUpdatePublicLink,
} from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

import { buildAccessWindowPayload } from '../lib/access-window';

import type { AccessWindowRange, AccessWindowValues } from '../lib/access-window';

/** Активные и архивные списки меняются вместе: ссылка переходит между ними при архивации и восстановлении. */
export function useInvalidatePublicLinkLists() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({
      queryKey: getTestsAdminPublicLinksControllerListPublicLinksQueryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: getTestsAdminPublicLinksControllerListArchivedPublicLinksQueryKey(),
    });
  };
}

/** Правка окна доступа. Пустое поле снимает ограничение: уходит `null`. */
export function useSavePublicLinkAccessWindow() {
  const updatePublicLinkMutation = useTestsAdminPublicLinksControllerUpdatePublicLink();
  const invalidatePublicLinks = useInvalidatePublicLinkLists();

  const savePublicLinkAccessWindow = (
    linkId: number,
    values: AccessWindowValues,
    original: AccessWindowRange,
    onSaved: () => void,
  ) => {
    updatePublicLinkMutation.mutate(
      { linkId, data: buildAccessWindowPayload(values, original) },
      {
        onSuccess: () => {
          toast.success('Окно доступа сохранено');
          invalidatePublicLinks();
          onSaved();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  return { savePublicLinkAccessWindow, isSavingAccessWindow: updatePublicLinkMutation.isPending };
}
