import { Image as ImageIcon, MousePointerClick, Palette } from 'lucide-react';
import { useState } from 'react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

import { BuilderPanelDialog } from './public-link-branding-builder-panels';
import { BrandingPreview } from './public-link-branding-builder-preview';
import { ZoneButton } from './public-link-branding-builder-zone-button';
import {
  brandingPreviewStates,
  type BrandingPreviewState,
} from './public-link-branding-builder.fixtures';
import {
  createDefaultBrandingConfig,
  createDraftBrandingConfig,
  type DraftPublicBrandingConfig,
} from './public-link-branding-builder.helpers';

import type {
  BuilderPanel,
  PublicLinkBrandingBuilderProps,
} from './public-link-branding-builder.types';

const wideDialogClassName = [
  'left-4 right-4 top-4 max-h-[calc(100vh-2rem)] w-auto max-w-none',
  'translate-x-0 translate-y-0 overflow-y-auto p-4',
  'sm:left-[50%] sm:right-auto sm:w-[calc(100vw-2rem)] sm:max-w-[1180px]',
  'sm:translate-x-[-50%] sm:p-6',
  adminClassNames.dialog.content,
].join(' ');

export function PublicLinkBrandingBuilder({
  open,
  link,
  isSaving,
  onOpenChange,
  onSave,
}: PublicLinkBrandingBuilderProps) {
  const builderKey = open ? (link?.id ?? 'empty') : 'closed';

  return (
    <PublicLinkBrandingBuilderContent
      key={builderKey}
      open={open}
      link={link}
      isSaving={isSaving}
      onOpenChange={onOpenChange}
      onSave={onSave}
    />
  );
}

function PublicLinkBrandingBuilderContent({
  open,
  link,
  isSaving,
  onOpenChange,
  onSave,
}: PublicLinkBrandingBuilderProps) {
  const [draft, setDraft] = useState<DraftPublicBrandingConfig>(() =>
    createDraftBrandingConfig(link?.publicBranding),
  );
  const [previewState, setPreviewState] = useState<BrandingPreviewState>('start');
  const [activePanel, setActivePanel] = useState<BuilderPanel | null>(null);

  const handleReset = () => {
    setDraft(createDefaultBrandingConfig());
    if (link) {
      onSave(link.id, null);
    }
  };

  const handleSave = () => {
    if (link) {
      onSave(link.id, draft);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={wideDialogClassName}>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <ImageIcon className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <DialogTitle>Конструктор публичной страницы</DialogTitle>
                <DialogDescription>
                  {link
                    ? `STANDARD-шаблон для ссылки ${link.shortCode}. Нажмите на зону в превью, чтобы изменить ее оформление.`
                    : 'Выберите публичную ссылку для настройки.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {link ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {brandingPreviewStates.map((state) => (
                    <Button
                      key={state.id}
                      type="button"
                      size="sm"
                      variant={previewState === state.id ? 'default' : 'outline'}
                      onClick={() => setPreviewState(state.id)}
                    >
                      {state.label}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <ZoneButton
                    icon={Palette}
                    label="Акцент"
                    onClick={() => setActivePanel('accent')}
                  />
                  <ZoneButton
                    icon={MousePointerClick}
                    label="Кнопки"
                    onClick={() => setActivePanel('buttons')}
                  />
                </div>
              </div>

              <BrandingPreview
                draft={draft}
                link={link}
                previewState={previewState}
                onEditPanel={setActivePanel}
              />
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!link || isSaving}
            >
              Сбросить к стандарту
            </Button>
            <Button type="button" onClick={handleSave} disabled={!link || isSaving}>
              {isSaving ? 'Сохраняем...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BuilderPanelDialog
        panel={activePanel}
        draft={draft}
        onApply={setDraft}
        onClose={() => setActivePanel(null)}
      />
    </>
  );
}
