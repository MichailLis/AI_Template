# Frontend Component Reuse Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Уменьшить дублирование похожих React-компонентов во фронтенде без изменения поведения интерфейса.

**Architecture:** Рефакторинг идет от самых безопасных локальных дублей к более общим shared-компонентам. Логика, специфичная для `features/tests`, остается внутри `features/tests`; полностью переиспользуемые UI-примитивы выносятся в `shared/ui` с сохранением FSD-границ.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind, shadcn/ui-style primitives, FSD architecture.

---

## Scope and Rules

- Не трогать `client/src/shared/api/generated/**`.
- Не менять backend/API-контракты.
- Не менять визуальный результат намеренно; это DRY/refactor-only работа.
- После каждого task запускать минимум:
  ```powershell
  npm run verify:architecture
  npm run verify:maintainability
  npm run lint --prefix client
  npm run build --prefix client
  ```
- Перед стартом проверить рабочее дерево:
  ```powershell
  git status --short
  ```
  Если есть чужие изменения, не перезаписывать их и коммитить только файлы текущей задачи.

---

## File Map

### Existing files to modify

- `client/src/features/tests/ui/test-editor.tsx`  
  Убрать локальную DnD-логику переупорядочивания вопросов.

- `client/src/features/tests/ui/test-questions-only-view.tsx`  
  Использовать общий hook DnD-логики вопросов.

- `client/src/features/tests/ui/tests-create-modal.tsx`  
  Использовать общий набор полей создания/редактирования базовой информации теста.

- `client/src/features/tests/ui/tests-sidebar-create-form.tsx`  
  Использовать те же поля, что и modal.

- `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx`  
  Использовать общие поля настройки валидации группы/класса.

- `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx`  
  Использовать общие поля настройки валидации группы/класса.

- `client/src/features/tests/ui/tests-list-header.tsx`  
  Использовать общий admin list toolbar.

- `client/src/widgets/admin-public-links-workspace/ui/public-links-list-header.tsx`  
  Использовать общий admin list toolbar.

- `client/src/widgets/admin-prompts-workspace/ui/prompt-library-card.tsx`  
  Использовать shared confirm dialog вместо локального raw AlertDialog.

### New files to create

- `client/src/features/tests/ui/use-question-reorder-dnd.ts`  
  Локальный hook для drag/drop reorder вопросов.

- `client/src/features/tests/ui/tests-topic-base-fields.tsx`  
  Общие поля `title`, `slug`, `description` для создания теста.

- `client/src/widgets/admin-education-organizations-workspace/ui/education-organization-validation-fields.tsx`  
  Общие поля настройки RegExp-валидации группы/класса.

- `client/src/widgets/admin-page-layout/ui/admin-list-toolbar.tsx`  
  Переиспользуемый toolbar: title, description, actions, tabs, search.

- `client/src/shared/ui/confirm-action-dialog.tsx`  
  Generic confirm dialog для разных feature/widget областей.

---

## Task 1: Extract question reorder DnD hook

**Files:**

- Create: `client/src/features/tests/ui/use-question-reorder-dnd.ts`
- Modify: `client/src/features/tests/ui/test-editor.tsx`
- Modify: `client/src/features/tests/ui/test-questions-only-view.tsx`

- [ ] **Step 1: Create hook file**

Create `client/src/features/tests/ui/use-question-reorder-dnd.ts`:

```ts
import { type DragEvent, useState } from 'react';

import type { TestDraftQuestion } from '../model/types';

export type DropPosition = 'before' | 'after';

export interface QuestionDropTarget {
  questionId: number;
  position: DropPosition;
}

const buildReorderedQuestionIds = (
  orderedQuestions: TestDraftQuestion[],
  draggingQuestionId: number,
  targetQuestionId: number,
  dropPosition: DropPosition,
) => {
  const sourceIndex = orderedQuestions.findIndex((question) => question.id === draggingQuestionId);
  const targetIndex = orderedQuestions.findIndex((question) => question.id === targetQuestionId);

  if (sourceIndex < 0 || targetIndex < 0) {
    return null;
  }

  let insertIndex = targetIndex + (dropPosition === 'after' ? 1 : 0);
  if (sourceIndex < insertIndex) {
    insertIndex -= 1;
  }

  if (insertIndex === sourceIndex) {
    return null;
  }

  const reorderedQuestions = [...orderedQuestions];
  const [movedQuestion] = reorderedQuestions.splice(sourceIndex, 1);
  reorderedQuestions.splice(insertIndex, 0, movedQuestion);

  return reorderedQuestions.map((question) => question.id);
};

export function useQuestionReorderDnd({
  questions,
  onReorderQuestions,
}: {
  questions: TestDraftQuestion[] | undefined;
  onReorderQuestions: (questionIds: number[]) => void;
}) {
  const [draggingQuestionId, setDraggingQuestionId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<QuestionDropTarget | null>(null);

  const resetDragState = () => {
    setDraggingQuestionId(null);
    setDropTarget(null);
  };

  const handleDragStart = (questionId: number) => {
    setDraggingQuestionId(questionId);
  };

  const handleDragOver = (questionId: number, event: DragEvent<HTMLDivElement>) => {
    if (draggingQuestionId === null || draggingQuestionId === questionId) {
      setDropTarget(null);
      return;
    }

    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerOffset = event.clientY - bounds.top;
    const position: DropPosition = pointerOffset < bounds.height / 2 ? 'before' : 'after';

    setDropTarget((previous) => {
      if (previous?.questionId === questionId && previous.position === position) {
        return previous;
      }

      return { questionId, position };
    });
  };

  const handleDrop = (targetQuestionId: number) => {
    if (!questions || draggingQuestionId === null || draggingQuestionId === targetQuestionId) {
      resetDragState();
      return;
    }

    const dropPosition: DropPosition =
      dropTarget?.questionId === targetQuestionId ? dropTarget.position : 'after';
    const reorderedQuestionIds = buildReorderedQuestionIds(
      questions,
      draggingQuestionId,
      targetQuestionId,
      dropPosition,
    );

    if (!reorderedQuestionIds) {
      resetDragState();
      return;
    }

    onReorderQuestions(reorderedQuestionIds);
    resetDragState();
  };

  return {
    draggingQuestionId,
    dropTarget,
    handleDragStart,
    handleDragOver,
    handleDragEnd: resetDragState,
    handleDrop,
  };
}
```

- [ ] **Step 2: Refactor `test-editor.tsx`**

Remove these local pieces:

- `type DragEvent` import
- `useState` import
- local `DropPosition`
- local `buildReorderedQuestionIds`
- local `draggingQuestionId`, `dropTarget`, `resetDragState`, `handleQuestionDragOver`, `handleDropQuestion`

Add:

```ts
import { useQuestionReorderDnd } from './use-question-reorder-dnd';
```

Inside `TestEditor`, before state branches:

```ts
const questionDnd = useQuestionReorderDnd({
  questions: detail?.draft.questions,
  onReorderQuestions,
});
```

Pass to `TestEditorQuestionsSection`:

```tsx
draggingQuestionId={questionDnd.draggingQuestionId}
dropTarget={questionDnd.dropTarget}
onDragStart={questionDnd.handleDragStart}
onDragOver={questionDnd.handleDragOver}
onDragEnd={questionDnd.handleDragEnd}
onDrop={questionDnd.handleDrop}
```

- [ ] **Step 3: Refactor `test-questions-only-view.tsx`**

Apply the same replacement as Step 2. Use:

```ts
const questionDnd = useQuestionReorderDnd({
  questions: detail?.draft.questions,
  onReorderQuestions,
});
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run verify:architecture
npm run verify:maintainability
npm run lint --prefix client
npm run build --prefix client
```

Expected: all commands exit `0`.

- [ ] **Step 5: Commit**

```powershell
git add client/src/features/tests/ui/use-question-reorder-dnd.ts client/src/features/tests/ui/test-editor.tsx client/src/features/tests/ui/test-questions-only-view.tsx
git commit -m "Refactor test question reorder drag state"
```

---

## Task 2: Extract reusable test topic base fields

**Files:**

- Create: `client/src/features/tests/ui/tests-topic-base-fields.tsx`
- Modify: `client/src/features/tests/ui/tests-create-modal.tsx`
- Modify: `client/src/features/tests/ui/tests-sidebar-create-form.tsx`

- [ ] **Step 1: Create shared fields component**

Create `client/src/features/tests/ui/tests-topic-base-fields.tsx`:

```tsx
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

interface TestsTopicBaseFieldsProps {
  title: string;
  slug: string;
  description: string;
  disabled?: boolean;
  titleLabel?: string;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function TestsTopicBaseFields({
  title,
  slug,
  description,
  disabled = false,
  titleLabel = 'Название теста',
  onTitleChange,
  onSlugChange,
  onDescriptionChange,
}: TestsTopicBaseFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="new-topic-title">{titleLabel}</Label>
        <Input
          id="new-topic-title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Карьерная ориентация"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-topic-slug">Slug (служебный, необязательно)</Label>
        <Input
          id="new-topic-slug"
          value={slug}
          onChange={(event) => onSlugChange(event.target.value)}
          placeholder="career-orientation"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-topic-description">Описание (необязательно)</Label>
        <Textarea
          id="new-topic-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={3}
          placeholder="Краткое описание для студентов..."
          disabled={disabled}
        />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Use it in modal**

In `tests-create-modal.tsx`, remove direct imports of `Input`, `Label`, `Textarea` and add:

```ts
import { TestsTopicBaseFields } from './tests-topic-base-fields';
```

Replace the three field blocks with:

```tsx
<TestsTopicBaseFields
  title={newTestTitle}
  slug={newTestSlug}
  description={newTestDescription}
  disabled={isCreating}
  titleLabel="Название теста *"
  onTitleChange={onNewTestTitleChange}
  onSlugChange={onNewTestSlugChange}
  onDescriptionChange={onNewTestDescriptionChange}
/>
```

- [ ] **Step 3: Use it in sidebar form**

In `tests-sidebar-create-form.tsx`, remove direct imports of `Input`, `Label`, `Textarea` and add:

```ts
import { TestsTopicBaseFields } from './tests-topic-base-fields';
```

Replace the three field blocks with:

```tsx
<TestsTopicBaseFields
  title={newTestTitle}
  slug={newTestSlug}
  description={newTestDescription}
  onTitleChange={onNewTestTitleChange}
  onSlugChange={onNewTestSlugChange}
  onDescriptionChange={onNewTestDescriptionChange}
/>
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run verify:architecture
npm run verify:maintainability
npm run lint --prefix client
npm run build --prefix client
```

Expected: all commands exit `0`.

- [ ] **Step 5: Commit**

```powershell
git add client/src/features/tests/ui/tests-topic-base-fields.tsx client/src/features/tests/ui/tests-create-modal.tsx client/src/features/tests/ui/tests-sidebar-create-form.tsx
git commit -m "Extract reusable test topic fields"
```

---

## Task 3: Extract education organization validation fields

**Files:**

- Create: `client/src/widgets/admin-education-organizations-workspace/ui/education-organization-validation-fields.tsx`
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx`
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx`

- [ ] **Step 1: Create reusable validation fields**

Create `client/src/widgets/admin-education-organizations-workspace/ui/education-organization-validation-fields.tsx`:

```tsx
import {
  GROUP_VALIDATION_MODE_OPTIONS,
  parseGroupValidationMode,
  type GroupValidationMode,
} from '@/shared/lib/group-validation';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

export type ValidationMode = GroupValidationMode;

interface EducationOrganizationValidationFieldsProps {
  idPrefix: string;
  validationMode: ValidationMode;
  validationPattern: string;
  validationExample: string;
  validationHint: string;
  disabled?: boolean;
  onValidationModeChange: (value: ValidationMode) => void;
  onValidationPatternChange: (value: string) => void;
  onValidationExampleChange: (value: string) => void;
  onValidationHintChange: (value: string) => void;
}

export function EducationOrganizationValidationFields({
  idPrefix,
  validationMode,
  validationPattern,
  validationExample,
  validationHint,
  disabled = false,
  onValidationModeChange,
  onValidationPatternChange,
  onValidationExampleChange,
  onValidationHintChange,
}: EducationOrganizationValidationFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-organization-mode`}>Режим проверки группы/класса</Label>
        <select
          id={`${idPrefix}-organization-mode`}
          value={validationMode}
          onChange={(event) => onValidationModeChange(parseGroupValidationMode(event.target.value))}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          disabled={disabled}
        >
          {GROUP_VALIDATION_MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {validationMode !== 'NONE' ? (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-organization-pattern`}>Шаблон (RegExp)</Label>
            <Input
              id={`${idPrefix}-organization-pattern`}
              value={validationPattern}
              onChange={(event) => onValidationPatternChange(event.target.value)}
              placeholder="Например: ^[А-ЯA-Z]{2,4}-?\\d{1,3}[А-ЯA-Z]?$"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-organization-example`}>Пример</Label>
            <Input
              id={`${idPrefix}-organization-example`}
              value={validationExample}
              onChange={(event) => onValidationExampleChange(event.target.value)}
              placeholder="Например: ИС-21"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-organization-hint`}>Подсказка для студента</Label>
            <Input
              id={`${idPrefix}-organization-hint`}
              value={validationHint}
              onChange={(event) => onValidationHintChange(event.target.value)}
              placeholder="Например: Укажите формат ИС-21"
              disabled={disabled}
            />
          </div>
        </>
      ) : null}
    </>
  );
}
```

- [ ] **Step 2: Use in create card**

In `education-organizations-create-card.tsx`:

- remove `GROUP_VALIDATION_MODE_OPTIONS`, `parseGroupValidationMode`, `GroupValidationMode` imports
- import:

```ts
import {
  EducationOrganizationValidationFields,
  type ValidationMode,
} from './education-organization-validation-fields';
```

Replace validation field JSX with:

```tsx
<EducationOrganizationValidationFields
  idPrefix="new"
  validationMode={newValidationMode}
  validationPattern={newValidationPattern}
  validationExample={newValidationExample}
  validationHint={newValidationHint}
  onValidationModeChange={onNewValidationModeChange}
  onValidationPatternChange={onNewValidationPatternChange}
  onValidationExampleChange={onNewValidationExampleChange}
  onValidationHintChange={onNewValidationHintChange}
/>
```

- [ ] **Step 3: Use in edit card**

In `education-organizations-edit-card.tsx`, import `EducationOrganizationValidationFields` and replace validation field JSX with:

```tsx
<EducationOrganizationValidationFields
  idPrefix="edit"
  validationMode={editValidationMode}
  validationPattern={editValidationPattern}
  validationExample={editValidationExample}
  validationHint={editValidationHint}
  disabled={!selectedOrganization}
  onValidationModeChange={onEditValidationModeChange}
  onValidationPatternChange={onEditValidationPatternChange}
  onValidationExampleChange={onEditValidationExampleChange}
  onValidationHintChange={onEditValidationHintChange}
/>
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run verify:architecture
npm run verify:maintainability
npm run lint --prefix client
npm run build --prefix client
```

Expected: all commands exit `0`.

- [ ] **Step 5: Commit**

```powershell
git add client/src/widgets/admin-education-organizations-workspace/ui/education-organization-validation-fields.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx
git commit -m "Extract organization validation fields"
```

---

## Task 4: Extract admin list toolbar

**Files:**

- Create: `client/src/widgets/admin-page-layout/ui/admin-list-toolbar.tsx`
- Modify: `client/src/features/tests/ui/tests-list-header.tsx`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/public-links-list-header.tsx`

- [ ] **Step 1: Create toolbar component**

Create `client/src/widgets/admin-page-layout/ui/admin-list-toolbar.tsx`:

```tsx
import { type ReactNode } from 'react';

import { Button } from '@/shared/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

interface AdminListToolbarTab<T extends string> {
  value: T;
  label: string;
}

interface AdminListToolbarProps<T extends string> {
  title: string;
  description: string;
  searchId: string;
  searchValue: string;
  searchPlaceholder: string;
  activeTab: T;
  tabs: AdminListToolbarTab<T>[];
  actions?: ReactNode;
  onTabChange: (tab: T) => void;
  onSearchChange: (value: string) => void;
}

export function AdminListToolbar<T extends string>({
  title,
  description,
  searchId,
  searchValue,
  searchPlaceholder,
  activeTab,
  tabs,
  actions,
  onTabChange,
  onSearchChange,
}: AdminListToolbarProps<T>) {
  return (
    <CardHeader className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-md border border-slate-200 bg-white p-1">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              size="sm"
              variant={activeTab === tab.value ? 'secondary' : 'ghost'}
              onClick={() => onTabChange(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="w-full max-w-md">
          <Input
            id={searchId}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      </div>
    </CardHeader>
  );
}
```

- [ ] **Step 2: Use in tests list header**

In `tests-list-header.tsx`, replace body with `AdminListToolbar`:

```tsx
<AdminListToolbar
  title="Тесты"
  description="Создание и управление тестами"
  searchId="tests-search"
  searchValue={searchValue}
  searchPlaceholder="Поиск по названию теста"
  activeTab={listMode}
  tabs={[
    { value: 'active', label: 'Активные' },
    { value: 'archived', label: 'Архив' },
  ]}
  actions={
    <>
      <Button type="button" variant="outline" onClick={onOpenAiGenerator}>
        Сгенерировать с ИИ
      </Button>
      <Button type="button" onClick={onOpenCreateModal}>
        Создать
      </Button>
    </>
  }
  onTabChange={onListModeChange}
  onSearchChange={onSearchChange}
/>
```

- [ ] **Step 3: Use in public links list header**

In `public-links-list-header.tsx`, replace body with `AdminListToolbar`:

```tsx
<AdminListToolbar
  title="Публичные ссылки"
  description="Публикация тестов и управление доступом"
  searchId="public-links-search"
  searchValue={searchValue}
  searchPlaceholder="Поиск по коду, тесту или заведению"
  activeTab={publicLinksTab}
  tabs={[
    { value: 'active', label: 'Активные' },
    { value: 'archived', label: 'Архив' },
  ]}
  actions={
    <>
      <Button asChild type="button" variant="outline">
        <Link to="/admin/public-links/organizations">Учебные заведения</Link>
      </Button>
      <Button asChild type="button" variant="outline">
        <Link to="/admin/public-links/stats">Статистика</Link>
      </Button>
      <Button type="button" onClick={onOpenCreateDialog}>
        Создать
      </Button>
    </>
  }
  onTabChange={onSwitchPublicLinksTab}
  onSearchChange={onSearchChange}
/>
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run verify:architecture
npm run verify:maintainability
npm run lint --prefix client
npm run build --prefix client
```

Expected: all commands exit `0`.

- [ ] **Step 5: Commit**

```powershell
git add client/src/widgets/admin-page-layout/ui/admin-list-toolbar.tsx client/src/features/tests/ui/tests-list-header.tsx client/src/widgets/admin-public-links-workspace/ui/public-links-list-header.tsx
git commit -m "Extract admin list toolbar"
```

---

## Task 5: Move confirm dialog to shared UI and reuse it

**Files:**

- Create: `client/src/shared/ui/confirm-action-dialog.tsx`
- Modify: `client/src/features/tests/ui/confirm-action-dialog.tsx`
- Modify: `client/src/widgets/admin-tests-workspace/ui/admin-tests-confirm-dialogs.tsx`
- Modify: `client/src/widgets/admin-prompts-workspace/ui/prompt-library-card.tsx`
- Modify if needed: `client/src/features/tests/index.ts`

- [ ] **Step 1: Create shared confirm dialog**

Create `client/src/shared/ui/confirm-action-dialog.tsx` using the current implementation from `features/tests/ui/confirm-action-dialog.tsx`:

```tsx
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Отмена',
  isConfirming = false,
  variant = 'default',
  onConfirm,
  onClose,
}: ConfirmActionDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md border-slate-200">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>{cancelLabel}</AlertDialogCancel>
          <Button type="button" variant={variant} onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Выполнение...' : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 2: Turn old tests component into re-export**

Replace `client/src/features/tests/ui/confirm-action-dialog.tsx` with:

```ts
export { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';
```

This keeps existing imports from `@/features/tests` working while moving ownership to `shared`.

- [ ] **Step 3: Refactor prompt delete dialog state**

In `prompt-library-card.tsx`:

- remove raw `AlertDialog*` imports
- add `useState` import if not already present
- import:

```ts
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';
```

Inside `PromptLibraryItem`, add:

```ts
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
```

Replace the raw `AlertDialog` block with:

```tsx
<Button
  type="button"
  size="sm"
  variant="ghost"
  disabled={isDeleting}
  aria-label={`Удалить промпт ${prompt.title}`}
  className="shrink-0 text-slate-500 hover:text-red-700"
  onClick={() => setIsDeleteDialogOpen(true)}
>
  <Trash2 className="h-4 w-4" />
</Button>

<ConfirmActionDialog
  open={isDeleteDialogOpen}
  title="Удалить промпт?"
  description="Промпт будет скрыт из конструктора. Уже созданные результаты анализа и версии останутся в истории."
  confirmLabel="Удалить"
  isConfirming={isDeleting}
  variant="destructive"
  onConfirm={() => {
    onDeletePrompt(prompt.id);
    setIsDeleteDialogOpen(false);
  }}
  onClose={() => setIsDeleteDialogOpen(false)}
/>
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run verify:architecture
npm run verify:maintainability
npm run lint --prefix client
npm run build --prefix client
```

Expected: all commands exit `0`.

- [ ] **Step 5: Commit**

```powershell
git add client/src/shared/ui/confirm-action-dialog.tsx client/src/features/tests/ui/confirm-action-dialog.tsx client/src/widgets/admin-prompts-workspace/ui/prompt-library-card.tsx client/src/widgets/admin-tests-workspace/ui/admin-tests-confirm-dialogs.tsx client/src/features/tests/index.ts
git commit -m "Move confirm dialog to shared UI"
```

---

## Task 6: Final verification and manual smoke check

**Files:**

- No intended source changes.

- [ ] **Step 1: Run full local frontend/backend-safe gates**

```powershell
npm run verify:architecture
npm run verify:maintainability
npm run verify:api-mutator
npm run lint
npm run build --prefix client
npm run build --prefix server
```

Expected: all commands exit `0`.

- [ ] **Step 2: Start normal Docker stack if needed**

Use only root compose:

```powershell
docker compose up -d
```

Expected containers:

- `ai_template_frontend`
- `ai_template_backend`
- `ai_template_postgres`
- `ai_template_adminer`

- [ ] **Step 3: Manual browser smoke checklist**

Open `http://localhost:5173` and verify:

1. Login page still renders.
2. Admin tests list renders.
3. Search + active/archive tabs still work in tests list.
4. Public links list renders.
5. Search + active/archive tabs still work in public links list.
6. Create test modal still shows title/slug/description fields.
7. Sidebar create form still shows title/slug/description fields if reachable.
8. Education organization create/edit forms still show validation mode/pattern/example/hint fields.
9. Drag/drop question reorder still works in both editor views.
10. Prompt delete confirmation dialog still opens and cancels.

- [ ] **Step 4: Final commit if manual smoke caused fixes**

If fixes were needed:

```powershell
git add client/src
git commit -m "Fix frontend reuse refactor smoke issues"
```

If no fixes were needed, do not create an empty commit.

---

## Acceptance Criteria

- Duplicate DnD reorder logic no longer exists in both `test-editor.tsx` and `test-questions-only-view.tsx`.
- Test creation title/slug/description fields are defined once.
- Education organization validation fields are defined once.
- Tests and public links list headers use one toolbar component.
- Generic confirm dialog lives in `shared/ui`, not in `features/tests` ownership.
- FSD architecture verification passes.
- Client lint/build pass.
- No generated API files are touched.
