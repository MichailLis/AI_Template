import type { BrandingPreviewState } from './public-link-branding-builder.fixtures';
import type { DraftPublicBrandingConfig } from './public-link-branding-builder.helpers';
import type { PublicLinkListItem } from './public-links-list-card.helpers';
import type { PublicBrandingConfig } from '@/features/tests';

export type BuilderPanel = 'background' | 'header' | 'buttons' | 'surfaces' | 'accent';

export interface PublicLinkBrandingBuilderProps {
  open: boolean;
  link: PublicLinkListItem | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (linkId: number, branding: PublicBrandingConfig) => void;
}

export interface BrandingPreviewProps {
  draft: DraftPublicBrandingConfig;
  link: PublicLinkListItem;
  previewState: BrandingPreviewState;
  onEditPanel: (panel: BuilderPanel) => void;
}

export interface BrandingBuilderPanelProps {
  draft: DraftPublicBrandingConfig;
  onApply: (nextDraft: DraftPublicBrandingConfig) => void;
  onClose: () => void;
}
