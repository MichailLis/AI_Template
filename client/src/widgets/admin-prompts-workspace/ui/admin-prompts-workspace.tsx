import { AdminPromptsWorkspaceContent } from './admin-prompts-workspace-content';
import { useAdminPromptsWorkspace } from './use-admin-prompts-workspace';
export type AdminPromptsWorkspaceState = ReturnType<typeof useAdminPromptsWorkspace>;

function AdminPromptsLoadingState() {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="text-center text-sm text-slate-500">Загрузка каталога моделей...</div>
    </div>
  );
}

function AdminPromptsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 shadow-sm">
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-700">Не удалось загрузить модели OpenRouter.</p>
        <button
          type="button"
          className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          onClick={onRetry}
        >
          Повторить
        </button>
      </div>
    </div>
  );
}

export function AdminPromptsWorkspace() {
  const workspace = useAdminPromptsWorkspace();

  if (workspace.modelsQuery.isLoading) {
    return <AdminPromptsLoadingState />;
  }

  if (workspace.modelsQuery.isError || !workspace.modelsQuery.data) {
    return <AdminPromptsErrorState onRetry={() => workspace.modelsQuery.refetch()} />;
  }

  return <AdminPromptsWorkspaceContent workspace={workspace} />;
}
