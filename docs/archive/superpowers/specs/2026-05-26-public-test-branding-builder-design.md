# Public Test Branding Builder Design

Date: 2026-05-26

Status as of 2026-05-27: implemented for `STANDARD` public links. The current
runtime stores `TestPublicLink.publicBranding`, exposes it through admin/public
DTOs, applies it through `PublicThemeLayout` for `STANDARD`, and leaves `POLUS`
unchanged.

## Context

The public test flow already supports multiple public templates through `TestPublicLink.publicTemplate`.
The existing public templates are:

- `STANDARD`: the original public test UI.
- `POLUS`: a separate branded template with its own scoped assets and styles.

This design adds a visual branding constructor for the `STANDARD` public test template. The goal is to let an admin customize the public test page and immediately see how the page will look before saving.

## Change Classification

- Change classification: `existing-feature-change`
- Owning feature/module: `tests`
- Prisma owner/model: `TestPublicLink`
- Route root: admin public links and public test routes, including `/admin/tests/public-links`, `/tests/public/*`, and frontend `/t/*`
- Manifest impact: update the tests feature inventory if new files are added to tracked feature surfaces
- Generator decision: do not scaffold a new Nest module; extend the existing tests module and run API generation after DTO changes
- Verification gates: Prisma generation/migration checks, API generation, targeted server tests, targeted client tests, architecture verification, and frontend container rebuild before frontend verification

## Goals

1. Add a visual constructor for branding the `STANDARD` public test template.
2. Let the admin edit page zones directly from a live preview, similar to a site builder.
3. Support color scheme, page background, and header logos.
4. Reuse the real public page layout for preview, so the constructor reflects the actual `/t/*` experience.
5. Keep `POLUS` behavior unchanged.

## Non-Goals

1. No free drag-and-drop layout editing in the first version.
2. No arbitrary block creation, deletion, or page structure editing.
3. No file upload/storage subsystem in the first version.
4. No branding changes for the `POLUS` template.
5. No separate public route for previews.

## Assumptions

1. Branding belongs to a public link, not to the test topic itself.
2. Updating branding on a public link changes how that link renders going forward.
3. Logo and background image values are HTTPS URLs in the first version.
4. The constructor uses controlled edit zones over the existing `STANDARD` template.
5. If branding is empty, the current `STANDARD` page remains visually unchanged.

## User Experience

The admin opens a public link and chooses "Constructor" or "Branding". The screen shows a real preview of the public test page. Editable zones are highlighted on hover and have a compact edit button.

Editable zones for the first version:

- Page background: default background, solid color, background image URL, optional image overlay.
- Header logos: add, replace, remove, set alt text, choose basic size.
- Primary buttons: primary color, text color, accent/hover behavior derived from the primary color.
- Cards and surfaces: card background and border color.
- Accent color: secondary highlights and selected states.

The preview supports screen states:

- Start page.
- Question page.
- Result or processing page.

Changing settings in a modal updates the preview immediately in local state. Nothing is persisted until the admin clicks "Save". The constructor also provides "Reset to standard" to clear the stored branding config.

## Data Model

Add a nullable JSON field named `publicBranding` to `TestPublicLink`:

```ts
type PublicBrandingConfig = {
  version: 1;
  background?: {
    mode: 'default' | 'solid' | 'image';
    color?: string;
    imageUrl?: string;
    overlay?: number;
  };
  header?: {
    logos?: Array<{
      url: string;
      alt: string;
      size?: 'sm' | 'md' | 'lg';
    }>;
  };
  buttons?: {
    primaryColor?: string;
    textColor?: string;
  };
  surfaces?: {
    cardColor?: string;
    borderColor?: string;
  };
  accents?: {
    accentColor?: string;
  };
};
```

The backend validates this shape with Zod at DTO boundaries. Colors use hex format. URLs are validated and limited in length. The backend stores only the config and does not fetch or transform remote images.

## API Flow

Admin endpoints:

1. Create public link accepts optional branding config.
2. Update public link accepts optional branding config or `null` to reset branding.
3. Admin public link response includes branding config.

Public endpoints:

1. Public link access response includes branding config.
2. Public session response includes branding config, so direct session URLs render correctly.
3. Public result response includes branding config, so direct result URLs render correctly.

After DTO changes, regenerate the client API types.

## Frontend Architecture

Add a small branding adapter that converts `PublicBrandingConfig` into CSS variables and layout props. This adapter is used by both:

- the real public `STANDARD` pages;
- the admin constructor preview.

`PublicThemeLayout` receives optional branding props and applies CSS variables at the root of the public theme container. Existing default CSS variables remain the fallback.

The constructor has three main parts:

1. Builder page/workspace in the admin public links area.
2. Preview canvas that renders the actual `STANDARD` public components in builder mode with fixture data for start, question, and result states.
3. Zone modals that edit a scoped part of the branding config.

Builder mode should add edit affordances only inside the admin constructor. The real public page must not render edit controls.

## Validation And Safety

1. Hex colors are validated on the client and server.
2. Image and logo URLs must be HTTPS in production-like environments.
3. Text contrast should be auto-derived when possible, with a warning or fallback when contrast is poor.
4. Missing images must not break the public page; the layout falls back to color/default background.
5. Excessively large logo sets are rejected. First version supports up to two header logos.

## Testing

Server tests:

- DTO validation for branding config.
- Public link create/update with branding.
- Public access/session/result responses include branding.
- Empty branding preserves existing default behavior.

Client tests:

- Branding adapter maps config to CSS variables.
- `PublicThemeLayout` applies branding only when provided.
- Builder zone interactions open the correct modal and update preview state.
- Save sends the expected update payload.
- `POLUS` rendering remains unchanged.

Manual or browser verification:

- Desktop and mobile preview for start, question, and result states.
- Real `/t/*` public page after saving branding.
- Reset to standard returns the page to the current default look.

Because this touches `client/`, frontend container verification must be preceded by:

```powershell
docker compose up -d --build --force-recreate frontend
```

## Rollout

1. Implement storage and API shape behind the existing tests module.
2. Add the branding adapter and no-op branding support to public `STANDARD` pages.
3. Add the admin constructor UI.
4. Connect save/reset flows.
5. Run targeted verification and a browser smoke check.

This order keeps the public page stable first, then layers the constructor on top.
