import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';

import { AdminPromptsWorkspaceContent } from './admin-prompts-workspace-content';
import { useAdminPromptsWorkspaceState } from './use-admin-prompts-workspace-state';

function AdminPromptsLoadingState() {
  return (
    <div
      className={`flex min-h-[400px] items-center justify-center p-8 ${adminClassNames.panel.card}`}
    >
      <div className={`text-center text-sm ${adminClassNames.text.muted}`}>
        Загрузка каталога моделей...
      </div>
    </div>
  );
}

function AdminPromptsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className={`flex min-h-[400px] items-center justify-center p-8 ${adminClassNames.panel.errorCard}`}
    >
      <div className="space-y-4 text-center">
        <p className={`text-sm ${adminToneClassNames.danger.text}`}>
          Не удалось загрузить модели OpenRouter.
        </p>
        <Button
          type="button"
          variant="outline"
          className={adminToneClassNames.danger.active}
          onClick={onRetry}
        >
          Повторить
        </Button>
      </div>
    </div>
  );
}

export function AdminPromptsWorkspace() {
  const workspace = useAdminPromptsWorkspaceState();

  if (workspace.modelsQuery.isLoading) {
    return <AdminPromptsLoadingState />;
  }

  if (workspace.modelsQuery.isError || !workspace.modelsQuery.data) {
    return <AdminPromptsErrorState onRetry={() => workspace.modelsQuery.refetch()} />;
  }

  return <AdminPromptsWorkspaceContent workspace={workspace} />;
}
