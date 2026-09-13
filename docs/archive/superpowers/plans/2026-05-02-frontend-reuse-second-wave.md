# Frontend Reuse Second Wave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Закрыть оставшиеся безопасные возможности переиспользования UI-паттернов после первой волны frontend component reuse без изменения поведения интерфейса.

**Architecture:** План идет от самого маленького cleanup к общим shared-примитивам и только затем к локальным разбиениям крупных admin-файлов. Общие компоненты кладем в `client/src/shared/ui`, если они не завязаны на домен. Доменные секции остаются рядом с соответствующим widget/feature, чтобы не ломать FSD и не создавать абстракции ради абстракций.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind, shadcn/ui primitives, FSD architecture.

---

## Scope and Rules

- Не трогать `client/src/shared/api/generated/**`.
- Не менять backend/API-контракты.
- Не менять визуальный результат намеренно; это reuse/maintainability-only работа.
- Не коммитить локальные артефакты: `.omx/`, `.playwright-mcp/`, `.serena/`, `CLAUDE.md`, папку `Промт инжиниринг/`, случайные lockfile-изменения.
- Перед каждым task проверить рабочее дерево:
  ```powershell
  git status --short
  ```
- После каждого task минимум:
  ```powershell
  npm run lint --prefix client
  npm run build --prefix client
  ```
- После финального task:
  ```powershell
  npm run verify:architecture
  npm run verify:maintainability
  npm run lint --prefix client
  npm run build --prefix client
  ```

---

## File Map

### Existing files to modify

- `client/src/features/tests/index.ts`  
  Убрать доменный re-export generic `ConfirmActionDialog`, если после прямых импортов он больше не нужен.

- `client/src/features/tests/ui/confirm-action-dialog.tsx`  
  Удалить compatibility wrapper, если больше нет импортов.

- `client/src/widgets/admin-public-links-workspace/ui/admin-public-links-workspace.tsx`  
  Импортировать `ConfirmActionDialog` напрямую из `shared/ui`.

- `client/src/widgets/admin-tests-workspace/ui/admin-tests-confirm-dialogs.tsx`  
  Импортировать `ConfirmActionDialog` напрямую из `shared/ui`, а `TestTopicListItem` оставить из `features/tests`.

- `client/src/features/tests/ui/tests-list-card.tsx`  
  Использовать общий state block для loading/error/empty.

- `client/src/widgets/admin-public-links-workspace/ui/public-links-list-card.tsx`  
  Использовать общий state block для loading/error/empty.

- `client/src/widgets/admin-users-workspace/ui/admin-users-workspace.tsx`  
  Использовать общий state block/page state для loading/error.

- `client/src/widgets/admin-page-layout/ui/admin-page-layout.tsx`  
  Использовать общий state block/page state для loading/error.

- `client/src/widgets/admin-tests-workspace/ui/admin-tests-settings-card.tsx`  
  Вынести повторяющийся shell секций настроек в локальный компонент и при необходимости разделить файл.

- `client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-workspace.ts`  
  Разделить hook на focused hooks/actions, чтобы закрыть maintainability gate.

### New files to create

- `client/src/shared/ui/admin-state-block.tsx`  
  Маленький общий UI-блок для loading/error/empty внутри admin cards.

- `client/src/widgets/admin-tests-workspace/ui/admin-tests-settings-panel.tsx`  
  Локальный shell для повторяющихся секций в настройках теста.

- `client/src/widgets/admin-tests-workspace/ui/admin-tests-metadata-settings-section.tsx`  
  Метаданные теста, вынесенные из `admin-tests-settings-card.tsx`.

- `client/src/widgets/admin-tests-workspace/ui/admin-tests-analysis-prompt-settings-section.tsx`  
  Секция выбора промпта анализа, вынесенная из `admin-tests-settings-card.tsx`.

- `client/src/widgets/admin-tests-workspace/ui/admin-tests-publication-settings-section.tsx`  
  Опубликованный срез, публикация и активность теста.

- `client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-editor-state.ts`  
  Состояние editor/model/variables для prompt workspace.

- `client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-actions.ts`  
  Actions: create/select/delete/save prompt.

- `client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-simulation.ts`  
  Actions/state для simulation runs.

---

## Task 1: Fix ConfirmActionDialog ownership leak

**Goal:** generic dialog должен импортироваться из `shared/ui`, а не через `features/tests`.

**Files:**

- Modify: `client/src/widgets/admin-public-links-workspace/ui/admin-public-links-workspace.tsx`
- Modify: `client/src/widgets/admin-tests-workspace/ui/admin-tests-confirm-dialogs.tsx`
- Modify: `client/src/features/tests/index.ts`
- Delete: `client/src/features/tests/ui/confirm-action-dialog.tsx`

- [ ] **Step 1: Confirm current references**

Run:

```powershell
rg "ConfirmActionDialog" client/src -n
```

Expected before change: references include `features/tests/index.ts`, `features/tests/ui/confirm-action-dialog.tsx`, `admin-public-links-workspace.tsx`, `admin-tests-confirm-dialogs.tsx`, and `prompt-library-card.tsx`.

- [ ] **Step 2: Change public links import**

In `client/src/widgets/admin-public-links-workspace/ui/admin-public-links-workspace.tsx`, replace:

```ts
import { ConfirmActionDialog } from '@/features/tests';
```

with:

```ts
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';
```

- [ ] **Step 3: Change admin tests import**

In `client/src/widgets/admin-tests-workspace/ui/admin-tests-confirm-dialogs.tsx`, replace:

```ts
import { ConfirmActionDialog, type TestTopicListItem } from '@/features/tests';
```

with:

```ts
import { type TestTopicListItem } from '@/features/tests';
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';
```

- [ ] **Step 4: Remove stale feature re-export**

In `client/src/features/tests/index.ts`, delete this line:

```ts
export { ConfirmActionDialog } from './ui/confirm-action-dialog';
```

Then delete file:

```powershell
Remove-Item -LiteralPath client\src\features\tests\ui\confirm-action-dialog.tsx
```

- [ ] **Step 5: Verify imports**

Run:

```powershell
rg "features/tests.*ConfirmActionDialog|ui/confirm-action-dialog" client/src -n
npm run lint --prefix client
npm run build --prefix client
```

Expected:

- `rg` has no references to `features/tests` ownership for `ConfirmActionDialog`.
- lint exits `0` with existing warnings only.
- build exits `0`.

- [ ] **Step 6: Commit**

```powershell
git add client/src/widgets/admin-public-links-workspace/ui/admin-public-links-workspace.tsx client/src/widgets/admin-tests-workspace/ui/admin-tests-confirm-dialogs.tsx client/src/features/tests/index.ts
git add -u client/src/features/tests/ui/confirm-action-dialog.tsx
git commit -m "Fix confirm dialog shared imports"
```

---

## Task 2: Add shared AdminStateBlock and reuse it in list cards

**Goal:** убрать повторяющийся loading/error/empty JSX в admin list cards без изменения layout.

**Files:**

- Create: `client/src/shared/ui/admin-state-block.tsx`
- Modify: `client/src/features/tests/ui/tests-list-card.tsx`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/public-links-list-card.tsx`

- [ ] **Step 1: Create shared state block**

Create `client/src/shared/ui/admin-state-block.tsx`:

```tsx
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

interface AdminStateBlockProps {
  children: ReactNode;
  action?: ReactNode;
  tone?: 'muted' | 'danger';
  className?: string;
}

const toneClassName = {
  muted: 'text-slate-500',
  danger: 'text-red-700',
} as const;

export function AdminStateBlock({
  children,
  action,
  tone = 'muted',
  className,
}: AdminStateBlockProps) {
  return (
    <div className={cn('p-8 text-center text-sm', toneClassName[tone], className)}>
      <div>{children}</div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 2: Refactor tests list states**

In `client/src/features/tests/ui/tests-list-card.tsx`, import:

```ts
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
```

Replace loading block with:

```tsx
<AdminStateBlock>Загрузка тестов... Пожалуйста, подождите.</AdminStateBlock>
```

Replace error block with:

```tsx
<AdminStateBlock
  tone="danger"
  action={
    <Button type="button" variant="outline" size="sm" onClick={onRetryTopics}>
      Повторить
    </Button>
  }
>
  {topicsErrorMessage ?? 'Не удалось загрузить тесты. Проверьте подключение и повторите попытку.'}
</AdminStateBlock>
```

Replace empty block with:

```tsx
<AdminStateBlock>
  {searchValue ? 'По текущему поиску тестов не найдено.' : 'Пока нет тестов. Создайте первый тест.'}
</AdminStateBlock>
```

- [ ] **Step 3: Refactor public links list states**

In `client/src/widgets/admin-public-links-workspace/ui/public-links-list-card.tsx`, import:

```ts
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
```

Replace loading block with:

```tsx
<AdminStateBlock>Загрузка публичных ссылок... Пожалуйста, подождите.</AdminStateBlock>
```

Replace error block with:

```tsx
<AdminStateBlock
  tone="danger"
  action={
    <Button type="button" variant="outline" size="sm" onClick={onRetryPublicLinks}>
      Повторить
    </Button>
  }
>
  Не удалось загрузить публичные ссылки. Проверьте подключение и повторите попытку.
</AdminStateBlock>
```

Replace empty block with:

```tsx
<AdminStateBlock>
  {searchValue
    ? 'По текущему поиску публичных ссылок не найдено.'
    : 'Пока нет публичных ссылок. Создайте первую ссылку.'}
</AdminStateBlock>
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run lint --prefix client
npm run build --prefix client
```

Expected: both exit `0`; lint may keep existing max-lines warnings.

- [ ] **Step 5: Commit**

```powershell
git add client/src/shared/ui/admin-state-block.tsx client/src/features/tests/ui/tests-list-card.tsx client/src/widgets/admin-public-links-workspace/ui/public-links-list-card.tsx
git commit -m "Extract admin state block"
```

---

## Task 3: Reuse AdminStateBlock in page-level admin states

**Goal:** использовать тот же state block для admin page loading/error screens, не меняя поведение.

**Files:**

- Modify: `client/src/widgets/admin-page-layout/ui/admin-page-layout.tsx`
- Modify: `client/src/widgets/admin-users-workspace/ui/admin-users-workspace.tsx`

- [ ] **Step 1: Refactor admin page layout states**

In `client/src/widgets/admin-page-layout/ui/admin-page-layout.tsx`, add:

```ts
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
```

For loading branch, keep the existing `Card` shell but replace inner text content with:

```tsx
<CardContent>
  <AdminStateBlock className="p-0">Загрузка админ-панели... Пожалуйста, подождите</AdminStateBlock>
</CardContent>
```

For error branch, keep existing `Card` shell and replace inner content with:

```tsx
<CardContent>
  <AdminStateBlock
    tone="danger"
    className="p-0"
    action={
      <Button type="button" variant="outline" onClick={() => void adminQuery.refetch()}>
        Повторить загрузку
      </Button>
    }
  >
    Не удалось загрузить данные админ-панели. Проверьте подключение и повторите попытку.
  </AdminStateBlock>
</CardContent>
```

- [ ] **Step 2: Refactor users workspace states**

In `client/src/widgets/admin-users-workspace/ui/admin-users-workspace.tsx`, add:

```ts
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
```

For loading branch, use:

```tsx
<CardContent>
  <AdminStateBlock className="p-0">
    Загрузка пользователей... Пожалуйста, подождите.
  </AdminStateBlock>
</CardContent>
```

For error branch, use:

```tsx
<CardContent>
  <AdminStateBlock
    tone="danger"
    className="p-0"
    action={
      <Button type="button" variant="outline" onClick={() => void usersQuery.refetch()}>
        Повторить
      </Button>
    }
  >
    Не удалось загрузить пользователей. Проверьте подключение и повторите попытку.
  </AdminStateBlock>
</CardContent>
```

- [ ] **Step 3: Verify**

Run:

```powershell
npm run lint --prefix client
npm run build --prefix client
```

Expected: both exit `0`.

- [ ] **Step 4: Commit**

```powershell
git add client/src/widgets/admin-page-layout/ui/admin-page-layout.tsx client/src/widgets/admin-users-workspace/ui/admin-users-workspace.tsx
git commit -m "Reuse admin state block in page states"
```

---

## Task 4: Split admin tests settings card into reusable local panels

**Goal:** убрать повторяющийся section shell в `admin-tests-settings-card.tsx` и снизить размер файла.

**Files:**

- Create: `client/src/widgets/admin-tests-workspace/ui/admin-tests-settings-panel.tsx`
- Create: `client/src/widgets/admin-tests-workspace/ui/admin-tests-metadata-settings-section.tsx`
- Create: `client/src/widgets/admin-tests-workspace/ui/admin-tests-analysis-prompt-settings-section.tsx`
- Create: `client/src/widgets/admin-tests-workspace/ui/admin-tests-publication-settings-section.tsx`
- Modify: `client/src/widgets/admin-tests-workspace/ui/admin-tests-settings-card.tsx`

- [ ] **Step 1: Create local panel shell**

Create `client/src/widgets/admin-tests-workspace/ui/admin-tests-settings-panel.tsx`:

```tsx
import type { ReactNode } from 'react';

interface AdminTestsSettingsPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AdminTestsSettingsPanel({
  title,
  description,
  children,
}: AdminTestsSettingsPanelProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Move metadata section**

Create `client/src/widgets/admin-tests-workspace/ui/admin-tests-metadata-settings-section.tsx` with the existing metadata logic from `admin-tests-settings-card.tsx`, using `AdminTestsSettingsPanel`:

```tsx
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import { AdminTestsSettingsPanel } from './admin-tests-settings-panel';

export interface AdminTestsDraftForm {
  title: string;
  description: string;
  analysisPromptVersionId: number | null;
}

interface AdminTestsMetadataSettingsSectionProps {
  draftForm: AdminTestsDraftForm;
  isDraftDirty: boolean;
  isSelectedTopicArchived: boolean;
  isSavingDraft: boolean;
  autoSaveError?: string | null;
  autosaveHint?: string | null;
  onDraftTitleChange: (value: string) => void;
  onDraftDescriptionChange: (value: string) => void;
  onSaveDraft: () => void;
}

function getDraftStatusText(isSelectedTopicArchived: boolean, isDraftDirty: boolean) {
  if (isSelectedTopicArchived) {
    return 'Редактирование отключено: тест в архиве';
  }
  if (isDraftDirty) {
    return 'Есть несохраненные изменения';
  }
  return 'Изменения сохранены';
}

export function AdminTestsMetadataSettingsSection({
  draftForm,
  isDraftDirty,
  isSelectedTopicArchived,
  isSavingDraft,
  autoSaveError,
  autosaveHint,
  onDraftTitleChange,
  onDraftDescriptionChange,
  onSaveDraft,
}: AdminTestsMetadataSettingsSectionProps) {
  const draftStatusText = getDraftStatusText(isSelectedTopicArchived, isDraftDirty);

  return (
    <AdminTestsSettingsPanel
      title="Метаданные теста"
      description="Редактирование названия и описания версии в работе."
    >
      <div className="mt-3 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="settings-draft-title">Название теста</Label>
          <Input
            id="settings-draft-title"
            value={draftForm.title}
            disabled={isSelectedTopicArchived}
            onChange={(event) => onDraftTitleChange(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-draft-description">Описание теста</Label>
          <Textarea
            id="settings-draft-description"
            rows={3}
            value={draftForm.description}
            disabled={isSelectedTopicArchived}
            onChange={(event) => onDraftDescriptionChange(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={onSaveDraft}
            disabled={isSelectedTopicArchived || !isDraftDirty || isSavingDraft}
          >
            {isSavingDraft ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
          <p className="text-xs text-slate-500">{draftStatusText}</p>
        </div>
        {autosaveHint ? <p className="text-xs text-slate-500">{autosaveHint}</p> : null}
        {autoSaveError ? (
          <p className="text-xs text-red-700">Автосохранение не удалось: {autoSaveError}</p>
        ) : null}
      </div>
    </AdminTestsSettingsPanel>
  );
}
```

- [ ] **Step 3: Move analysis prompt section**

Create `client/src/widgets/admin-tests-workspace/ui/admin-tests-analysis-prompt-settings-section.tsx` by moving the existing `AnalysisPromptSettingsSection` logic. Export this type for reuse by the settings card:

```ts
export interface AnalysisPromptVersionSummary {
  id: number;
  promptId: number;
  promptTitle: string;
  versionNumber: number;
  model: string;
}
```

The JSX must remain equivalent, but wrap content in:

```tsx
<AdminTestsSettingsPanel
  title="Промпт анализа"
  description="Для версии теста можно подключить одну опубликованную версию промпта."
>
  {/* existing select block */}
</AdminTestsSettingsPanel>
```

- [ ] **Step 4: Move publication/activity sections**

Create `client/src/widgets/admin-tests-workspace/ui/admin-tests-publication-settings-section.tsx`. Move:

- `PublishedSnapshotSection`
- `PublishSection`
- `ActivitySwitchSection`
- `getPublishButtonLabel`
- `getPublishHintText`

Use `AdminTestsSettingsPanel` for each section. Export:

```ts
export interface PublishedVersion {
  versionNumber: number;
  title: string;
  analysisPromptVersion: AnalysisPromptVersionSummary | null;
}
```

Import `AnalysisPromptVersionSummary` from `./admin-tests-analysis-prompt-settings-section`.

- [ ] **Step 5: Simplify settings card**

In `client/src/widgets/admin-tests-workspace/ui/admin-tests-settings-card.tsx`, keep only:

- imports
- `AdminTestsSettingsCardProps`
- `AdminTestsSettingsCard` component

Replace inline sections with:

```tsx
<AdminTestsMetadataSettingsSection ... />
<AdminTestsAnalysisPromptSettingsSection ... />
<AdminTestsPublishedSnapshotSection published={published} />
<AdminTestsPublishSection ... />
<AdminTestsActivitySwitchSection ... />
```

- [ ] **Step 6: Verify file sizes and build**

Run:

```powershell
(Get-Content client\src\widgets\admin-tests-workspace\ui\admin-tests-settings-card.tsx).Count
npm run lint --prefix client
npm run build --prefix client
```

Expected:

- settings card is clearly below 350 lines.
- lint exits `0` with existing warnings reduced or unchanged.
- build exits `0`.

- [ ] **Step 7: Commit**

```powershell
git add client/src/widgets/admin-tests-workspace/ui/admin-tests-settings-card.tsx client/src/widgets/admin-tests-workspace/ui/admin-tests-settings-panel.tsx client/src/widgets/admin-tests-workspace/ui/admin-tests-metadata-settings-section.tsx client/src/widgets/admin-tests-workspace/ui/admin-tests-analysis-prompt-settings-section.tsx client/src/widgets/admin-tests-workspace/ui/admin-tests-publication-settings-section.tsx
git commit -m "Split admin tests settings sections"
```

---

## Task 5: Split prompt workspace hook to close maintainability gate

**Goal:** закрыть `verify:maintainability` для `use-admin-prompts-workspace.ts` без изменения UI/behavior.

**Files:**

- Create: `client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-editor-state.ts`
- Create: `client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-simulation.ts`
- Create: `client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-actions.ts`
- Modify: `client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-workspace.ts`

- [ ] **Step 1: Extract editor state hook**

Create `client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-editor-state.ts` and move these state values from `use-admin-prompts-workspace.ts`:

```ts
(selectedPromptId,
  promptTitle,
  model,
  temperature,
  responseFormat,
  modelSearch,
  modelFilter,
  systemRole,
  maxTokens,
  promptTemplate,
  promptEditorScrollTop,
  variables,
  showMetrics,
  diffView,
  selectedTestId);
```

The hook must return both values and setters. Keep constants:

```ts
export const DEFAULT_PROMPT_TITLE = 'Карьерный анализ по тесту';
export const DEFAULT_PROMPT_DESCRIPTION = 'Промпт анализа студенческих ответов';
```

- [ ] **Step 2: Extract simulation hook**

Create `client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-simulation.ts` and move:

- `runs` state
- `copyRunJson`
- `handleGenerate`

The hook receives dependencies as params:

```ts
interface UseAdminPromptsSimulationParams {
  selectedModel: string;
  selectedModelItem: { supportsStructuredOutputs?: boolean } | null;
  duplicateVariableData: ReturnType<typeof getDuplicateVariableData>;
  temperature: string;
  renderedPrompt: string;
  selectedTest: { questions: Array<{ id: number }> } | null;
  selectedQuestionIds: number[];
  responseFormat: ResponseFormat;
  simulateMutation: ReturnType<typeof useAnalysisPromptsControllerSimulatePrompt>;
}
```

Return:

```ts
{
  runs,
  setRuns,
  copyRunJson,
  handleGenerate,
}
```

- [ ] **Step 3: Extract prompt actions hook**

Create `client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-actions.ts` and move:

- `getDefaultModel`
- `resetPromptEditor`
- `handleCreateNewPrompt`
- `handleSelectPrompt`
- `publishDraftPromptVersion`
- `handleDeletePrompt`
- `handleSavePromptVersion`
- variable actions: `updateVariable`, `addVariable`, `removeVariable`

Pass all required state/setters/mutations as params. Keep the behavior exactly as-is, including toast messages.

- [ ] **Step 4: Recompose workspace hook**

In `client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-workspace.ts`:

- keep query/mutation initialization;
- keep memoized catalog/selection values;
- call the three extracted hooks;
- return the same public object keys that `admin-prompts-workspace.tsx` already consumes.

Before editing, capture current returned keys:

```powershell
rg "return \{" client\src\widgets\admin-prompts-workspace\ui\use-admin-prompts-workspace.ts -n
```

After editing, verify the returned object still contains the keys used by:

```powershell
rg "workspace\." client\src\widgets\admin-prompts-workspace -n
```

- [ ] **Step 5: Verify maintainability**

Run:

```powershell
(Get-Content client\src\widgets\admin-prompts-workspace\ui\use-admin-prompts-workspace.ts).Count
npm run verify:maintainability
npm run lint --prefix client
npm run build --prefix client
```

Expected:

- `use-admin-prompts-workspace.ts` is below 420 lines.
- `npm run verify:maintainability` exits `0`.
- lint exits `0` with warnings only if thresholds are warnings.
- build exits `0`.

- [ ] **Step 6: Commit**

```powershell
git add client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-workspace.ts client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-editor-state.ts client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-simulation.ts client/src/widgets/admin-prompts-workspace/ui/use-admin-prompts-actions.ts
git commit -m "Split admin prompts workspace hook"
```

---

## Task 6: Final verification and browser smoke

**Goal:** доказать, что вторая волна reuse не сломала интерфейс.

**Files:**

- No intended source changes unless smoke finds a bug.

- [ ] **Step 1: Run final gates**

Run:

```powershell
npm run verify:architecture
npm run verify:maintainability
npm run lint --prefix client
npm run build --prefix client
```

Expected: all commands exit `0`. If `lint` keeps max-lines warnings but exits `0`, record warning count in the final report.

- [ ] **Step 2: Start/rebuild normal Docker stack**

Use root compose only:

```powershell
docker compose up -d --build
docker compose ps
```

Expected containers:

- `ai_template_frontend`
- `ai_template_backend`
- `ai_template_postgres` healthy
- `ai_template_adminer`

- [ ] **Step 3: Browser smoke checklist**

Use browser automation or Playwright against `http://localhost:5173`:

1. `/login` renders.
2. Login works with `manager@example.com / password123`.
3. `/admin/tests` renders.
4. Tests search works.
5. Tests active/archive tabs work.
6. Create test modal opens and shows title/slug/description fields.
7. `/admin/public-links` renders.
8. Public links search works.
9. Public links active/archive tabs work.
10. `/admin/public-links/organizations` renders.
11. Organization validation mode can switch to strict and shows pattern/example/hint fields.
12. `/admin/prompts` renders.
13. Prompt delete confirmation opens and cancels.
14. `/t/DEMO2026` renders public test page.

- [ ] **Step 4: Commit smoke fixes only if needed**

If browser smoke caused source fixes:

```powershell
git add client/src
git commit -m "Fix frontend reuse smoke issues"
```

If no fixes were needed, do not create an empty commit unless the user explicitly asks for a marker commit.

---

## Acceptance Criteria

- `ConfirmActionDialog` is owned by `shared/ui`; widgets do not import it through `features/tests`.
- Repeated admin loading/error/empty blocks use `AdminStateBlock` where it reduces duplication without hiding domain text.
- `admin-tests-settings-card.tsx` is split into focused sections and no longer carries repeated panel shell JSX.
- `use-admin-prompts-workspace.ts` is below the maintainability hard limit.
- `npm run verify:architecture` passes.
- `npm run verify:maintainability` passes.
- `npm run lint --prefix client` exits `0`.
- `npm run build --prefix client` exits `0`.
- Browser smoke passes for admin tests, public links, organizations, prompts, and public test route.
