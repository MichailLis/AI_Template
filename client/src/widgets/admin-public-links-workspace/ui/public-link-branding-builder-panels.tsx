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
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { updateBrandingSection } from './public-link-branding-builder.helpers';
import { PublicLinkBrandingColorField } from './public-link-branding-color-field';

import type { DraftPublicBrandingConfig } from './public-link-branding-builder.helpers';
import type { BrandingBuilderPanelProps, BuilderPanel } from './public-link-branding-builder.types';

const normalizeOptionalValue = (value: string) => value.trim() || undefined;

function BackgroundPanel({ draft, onApply, onClose }: BrandingBuilderPanelProps) {
  const [mode, setMode] = useState(draft.background?.mode ?? 'default');
  const [color, setColor] = useState(draft.background?.color ?? '#f2f7fb');
  const [imageUrl, setImageUrl] = useState(draft.background?.imageUrl ?? '');
  const [overlay, setOverlay] = useState(String(draft.background?.overlay ?? 0.25));

  const apply = () => {
    const parsedOverlay = Number.parseFloat(overlay);
    const effectiveMode = mode === 'default' && normalizeOptionalValue(color) ? 'solid' : mode;

    onApply(
      updateBrandingSection(draft, 'background', {
        mode: effectiveMode,
        color: normalizeOptionalValue(color),
        imageUrl: normalizeOptionalValue(imageUrl),
        overlay: Number.isFinite(parsedOverlay) ? Math.min(Math.max(parsedOverlay, 0), 0.85) : 0,
      }),
    );
    onClose();
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="branding-background-mode">Тип фона</Label>
        <select
          id="branding-background-mode"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={mode}
          onChange={(event) => setMode(event.target.value as 'default' | 'solid' | 'image')}
        >
          <option value="default">Стандартный</option>
          <option value="solid">Сплошной цвет</option>
          <option value="image">Картинка</option>
        </select>
      </div>
      <PublicLinkBrandingColorField
        id="branding-background-color"
        label="Цвет фона"
        value={color}
        onChange={setColor}
      />
      <div className="grid gap-2">
        <Label htmlFor="branding-background-image">URL картинки</Label>
        <Input
          id="branding-background-image"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://example.com/background.jpg"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="branding-background-overlay">Затемнение картинки</Label>
        <Input
          id="branding-background-overlay"
          inputMode="decimal"
          value={overlay}
          onChange={(event) => setOverlay(event.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button type="button" onClick={apply}>
          Применить
        </Button>
      </DialogFooter>
    </div>
  );
}

function HeaderPanel({ draft, onApply, onClose }: BrandingBuilderPanelProps) {
  const firstLogo = draft.header?.logos?.[0];
  const [url, setUrl] = useState(firstLogo?.url ?? '');
  const [alt, setAlt] = useState(firstLogo?.alt ?? 'Логотип');
  const [size, setSize] = useState(firstLogo?.size ?? 'md');

  const apply = () => {
    const logoUrl = normalizeOptionalValue(url);

    onApply(
      updateBrandingSection(draft, 'header', {
        logos: logoUrl ? [{ url: logoUrl, alt: alt.trim() || 'Логотип', size }] : [],
      }),
    );
    onClose();
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="branding-logo-url">URL логотипа</Label>
        <Input
          id="branding-logo-url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/logo.svg"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="branding-logo-alt">Alt логотипа</Label>
        <Input
          id="branding-logo-alt"
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="branding-logo-size">Размер</Label>
        <select
          id="branding-logo-size"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={size}
          onChange={(event) => setSize(event.target.value as 'sm' | 'md' | 'lg')}
        >
          <option value="sm">Малый</option>
          <option value="md">Средний</option>
          <option value="lg">Крупный</option>
        </select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button type="button" onClick={apply}>
          Применить
        </Button>
      </DialogFooter>
    </div>
  );
}

function ButtonPanel({ draft, onApply, onClose }: BrandingBuilderPanelProps) {
  const [primaryColor, setPrimaryColor] = useState(draft.buttons?.primaryColor ?? '#0066cc');
  const [textColor, setTextColor] = useState(draft.buttons?.textColor ?? '#ffffff');

  const apply = () => {
    onApply(
      updateBrandingSection(draft, 'buttons', {
        primaryColor: normalizeOptionalValue(primaryColor),
        textColor: normalizeOptionalValue(textColor),
      }),
    );
    onClose();
  };

  return (
    <div className="grid gap-4">
      <PublicLinkBrandingColorField
        id="branding-button-primary"
        label="Цвет кнопки"
        value={primaryColor}
        onChange={setPrimaryColor}
      />
      <PublicLinkBrandingColorField
        id="branding-button-text"
        label="Цвет текста кнопки"
        value={textColor}
        onChange={setTextColor}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button type="button" onClick={apply}>
          Применить
        </Button>
      </DialogFooter>
    </div>
  );
}

function SurfacePanel({ draft, onApply, onClose }: BrandingBuilderPanelProps) {
  const [cardColor, setCardColor] = useState(draft.surfaces?.cardColor ?? '#ffffff');
  const [borderColor, setBorderColor] = useState(draft.surfaces?.borderColor ?? '#d4dee8');

  const apply = () => {
    onApply(
      updateBrandingSection(draft, 'surfaces', {
        cardColor: normalizeOptionalValue(cardColor),
        borderColor: normalizeOptionalValue(borderColor),
      }),
    );
    onClose();
  };

  return (
    <div className="grid gap-4">
      <PublicLinkBrandingColorField
        id="branding-card-color"
        label="Фон карточек"
        value={cardColor}
        onChange={setCardColor}
      />
      <PublicLinkBrandingColorField
        id="branding-card-border"
        label="Цвет рамки"
        value={borderColor}
        onChange={setBorderColor}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button type="button" onClick={apply}>
          Применить
        </Button>
      </DialogFooter>
    </div>
  );
}

function AccentPanel({ draft, onApply, onClose }: BrandingBuilderPanelProps) {
  const [accentColor, setAccentColor] = useState(draft.accents?.accentColor ?? '#00a889');

  const apply = () => {
    onApply(
      updateBrandingSection(draft, 'accents', {
        accentColor: normalizeOptionalValue(accentColor),
      }),
    );
    onClose();
  };

  return (
    <div className="grid gap-4">
      <PublicLinkBrandingColorField
        id="branding-accent-color"
        label="Акцентный цвет"
        value={accentColor}
        onChange={setAccentColor}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button type="button" onClick={apply}>
          Применить
        </Button>
      </DialogFooter>
    </div>
  );
}

export function BuilderPanelDialog({
  panel,
  draft,
  onApply,
  onClose,
}: {
  panel: BuilderPanel | null;
  draft: DraftPublicBrandingConfig;
  onApply: (nextDraft: DraftPublicBrandingConfig) => void;
  onClose: () => void;
}) {
  const titleByPanel: Record<BuilderPanel, string> = {
    background: 'Фон страницы',
    header: 'Логотипы в шапке',
    buttons: 'Кнопки',
    surfaces: 'Карточки',
    accent: 'Акцентные элементы',
  };

  return (
    <Dialog open={Boolean(panel)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`sm:max-w-md ${adminClassNames.dialog.content}`}>
        {panel ? (
          <>
            <DialogHeader>
              <DialogTitle>{titleByPanel[panel]}</DialogTitle>
              <DialogDescription>
                Изменения применяются к превью сразу после подтверждения.
              </DialogDescription>
            </DialogHeader>

            {panel === 'background' ? (
              <BackgroundPanel draft={draft} onApply={onApply} onClose={onClose} />
            ) : null}
            {panel === 'header' ? (
              <HeaderPanel draft={draft} onApply={onApply} onClose={onClose} />
            ) : null}
            {panel === 'buttons' ? (
              <ButtonPanel draft={draft} onApply={onApply} onClose={onClose} />
            ) : null}
            {panel === 'surfaces' ? (
              <SurfacePanel draft={draft} onApply={onApply} onClose={onClose} />
            ) : null}
            {panel === 'accent' ? (
              <AccentPanel draft={draft} onApply={onApply} onClose={onClose} />
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
