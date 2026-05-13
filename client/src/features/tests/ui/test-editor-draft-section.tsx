import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

interface TestEditorDraftSectionProps {
  slug: string;
  draftVersionNumber: number;
  publishedVersionNumber: number | null;
  draftDirty: boolean;
  canPublish: boolean;
  isSavingDraft: boolean;
  isPublishing: boolean;
  autosaveHint: string | null;
  autosaveError: string | null;
  draftTitle: string;
  draftDescription: string;
  publishButtonLabel: string;
  onSaveDraft: () => void;
  onRequestPublish: () => void;
  onDraftTitleChange: (value: string) => void;
  onDraftDescriptionChange: (value: string) => void;
}

export function TestEditorDraftSection({
  slug,
  draftVersionNumber,
  publishedVersionNumber,
  draftDirty,
  canPublish,
  isSavingDraft,
  isPublishing,
  autosaveHint,
  autosaveError,
  draftTitle,
  draftDescription,
  publishButtonLabel,
  onSaveDraft,
  onRequestPublish,
  onDraftTitleChange,
  onDraftDescriptionChange,
}: TestEditorDraftSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Slug: {slug}</Badge>
        <Badge variant="outline">В работе v{draftVersionNumber}</Badge>
        <Badge variant="outline">
          {publishedVersionNumber !== null
            ? `Статус: опубликован (v${publishedVersionNumber})`
            : 'Статус: не опубликован'}
        </Badge>
      </div>

      <div className={adminClassNames.panel.infoInline}>
        Вы редактируете версию в работе. Пользователи видят только опубликованную версию.
      </div>

      <div className={`sticky top-2 z-10 p-3 backdrop-blur ${adminClassNames.panel.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>Действия</p>
            <p className={adminClassNames.form.fieldHint}>
              {draftDirty
                ? 'Есть несохраненные изменения'
                : 'Изменения сохранены, можно публиковать'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onSaveDraft} disabled={!draftDirty || isSavingDraft}>
              {isSavingDraft ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
            <Button
              variant="secondary"
              onClick={onRequestPublish}
              disabled={!canPublish || isPublishing}
            >
              {publishButtonLabel}
            </Button>
          </div>
        </div>
        {!canPublish ? (
          <p className={`mt-2 text-xs ${adminToneClassNames.warning.text}`}>
            Для публикации сохраните изменения и добавьте хотя бы один вопрос.
          </p>
        ) : null}

        {autosaveHint ? (
          <p className={`mt-2 ${adminClassNames.form.fieldHint}`}>{autosaveHint}</p>
        ) : null}
        {autosaveError ? (
          <p className={`mt-2 text-xs ${adminToneClassNames.danger.text}`}>
            Автосохранение не удалось: {autosaveError}
          </p>
        ) : null}
      </div>

      <Label htmlFor="draft-title">Название теста</Label>
      <Input
        id="draft-title"
        value={draftTitle}
        onChange={(event) => onDraftTitleChange(event.target.value)}
      />

      <Label htmlFor="draft-description">Описание теста</Label>
      <Textarea
        id="draft-description"
        rows={3}
        value={draftDescription}
        onChange={(event) => onDraftDescriptionChange(event.target.value)}
      />
    </div>
  );
}
