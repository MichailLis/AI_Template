import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSkeletonRows } from '@/shared/ui/admin-skeleton';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

import { AdminPromptsWorkspaceContent } from './admin-prompts-workspace-content';
import { useAdminPromptsWorkspaceState } from './use-admin-prompts-workspace-state';

/**
 * Каталог моделей OpenRouter нужен одному выпадающему списку в редакторе, а библиотека промптов и
 * их версии лежат в собственной базе. Раньше недоступный каталог гасил весь раздел целиком, и
 * админ не мог даже прочитать сохраненный промпт; теперь ошибка каталога — это полоса
 * предупреждения над рабочей областью.
 */
function AdminPromptsModelsWarning({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${adminClassNames.panel.warningInline}`}
    >
      <p>
        Каталог моделей OpenRouter недоступен. Промпты и версии открыты для чтения и правки, выбор
        модели временно недоступен.
      </p>
      <Button type="button" size="sm" variant="outline" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}

export function AdminPromptsWorkspace() {
  const workspace = useAdminPromptsWorkspaceState();

  if (workspace.modelsQuery.isLoading) {
    return (
      <Card className={adminClassNames.panel.card}>
        <CardContent className="p-4">
          <AdminSkeletonRows rows={6} columns={3} label="Загружаем промпты" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={adminClassNames.layout.page}>
      {workspace.modelsQuery.isError ? (
        <AdminPromptsModelsWarning
          onRetry={() => {
            void workspace.modelsQuery.refetch();
          }}
        />
      ) : null}

      <AdminPromptsWorkspaceContent workspace={workspace} />
    </div>
  );
}
