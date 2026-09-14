# Public Test Branding Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zonal visual branding constructor for the `STANDARD` public test template, with live preview and persisted branding per public link.

**Architecture:** Branding is stored as nullable `publicBranding` JSON on `TestPublicLink`, validated at DTO boundaries, and returned by admin and public endpoints. The frontend uses one adapter to convert the config into scoped public-theme CSS variables for both the real `/t/*` pages and the admin preview builder. The builder edits fixed zones of the existing STANDARD layout; it does not provide free drag-and-drop or affect POLUS.

**Tech Stack:** NestJS, Prisma 7, Zod DTOs, Orval generated API, React 19, Vite, TanStack Query, Tailwind, shadcn/ui, Vitest/Jest.

---

## File Structure

Backend:

- Modify `server/prisma/schema.prisma`: add `publicBranding Json?` to `TestPublicLink`.
- Create `server/prisma/migrations/20260526000000_add_public_link_branding/migration.sql`: add JSONB column.
- Modify `server/src/tests/dto/tests-public.dto.ts`: define and export `PublicBrandingConfigSchema`; include `publicBranding` in public access/session/result schemas.
- Modify `server/src/tests/dto/tests-links.dto.ts`: accept `publicBranding` in create/update DTOs and return it in admin link DTO.
- Modify `server/src/tests/tests-public-link.service.ts`: persist/update/return branding.
- Modify `server/src/tests/tests-public-link.mapper.ts`: include branding in admin link mapping.
- Modify `server/src/tests/tests-attempt.mapper.ts`: include branding in session state mapping.
- Modify `server/src/tests/tests-public-session.service.ts`: include branding in result response.
- Modify related server specs for DTO/service/read paths/schema migration expectations.

Frontend shared public branding:

- Create `client/src/features/tests/public-branding.ts`: generated-compatible branding types, defaults, color helpers, CSS variable adapter.
- Modify `client/src/widgets/public-test-workspace/ui/public-theme-layout.tsx`: accept `branding` and optional `builderHeaderSlot`; apply style variables/background/header logos.
- Modify STANDARD branches in public entry/run/result/processing components to pass branding from API payload.
- Modify `client/src/features/tests/ui/public-theme.css`: add scoped classes for custom background, brand header, and builder overlays.

Admin builder:

- Create `client/src/widgets/admin-public-links-workspace/ui/public-link-branding-builder.tsx`: modal/dialog workspace with preview canvas, state tabs, zone wrappers, edit modals, save/reset actions.
- Create `client/src/widgets/admin-public-links-workspace/ui/public-link-branding-builder.fixtures.ts`: fixture payloads for start/question/result preview states.
- Create `client/src/widgets/admin-public-links-workspace/ui/public-link-branding-builder.helpers.ts`: immutable config update helpers.
- Modify `client/src/widgets/admin-public-links-workspace/ui/public-links-list-card.row.tsx`: add action menu item for active STANDARD links.
- Modify `client/src/widgets/admin-public-links-workspace/ui/admin-public-links-workspace.tsx`: manage selected builder link and render builder.
- Modify `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-actions.ts` and `.types.ts`: expose `handleUpdatePublicLinkBranding`.
- Add/modify client tests for adapter, builder interactions, row action, and public layout branding.

Generated:

- Run `npm run gen:api` after backend DTO changes.
- Do not hand-edit generated API files except through generation.

## Task 1: Backend Branding Schema And DTOs

**Files:**

- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/20260526000000_add_public_link_branding/migration.sql`
- Modify: `server/src/tests/dto/tests-public.dto.ts`
- Modify: `server/src/tests/dto/tests-links.dto.ts`
- Test: `server/src/tests/dto/tests-public.dto.spec.ts`
- Test: `server/src/tests/dto/tests-links.dto.spec.ts`
- Test: `server/src/tests/tests-prisma-schema.spec.ts`

- [ ] **Step 1: Add failing DTO tests**

Add tests that parse a valid branding config and reject invalid color/URL/count values:

```ts
const branding = {
  version: 1,
  background: {
    mode: 'image',
    color: '#f2f7fb',
    imageUrl: 'https://cdn.example.com/background.png',
    overlay: 0.32,
  },
  header: {
    logos: [{ url: 'https://cdn.example.com/logo.svg', alt: 'Client logo', size: 'md' }],
  },
  buttons: { primaryColor: '#0066cc', textColor: '#ffffff' },
  surfaces: { cardColor: '#ffffff', borderColor: '#d4dee8' },
  accents: { accentColor: '#00a889' },
};

expect(PublicBrandingConfigSchema.parse(branding)).toEqual(branding);
expect(() =>
  PublicBrandingConfigSchema.parse({
    version: 1,
    buttons: { primaryColor: 'blue' },
  }),
).toThrow();
```

- [ ] **Step 2: Run DTO tests and confirm failure**

Run:

```powershell
npm run test --prefix server -- tests-public.dto.spec.ts tests-links.dto.spec.ts --runInBand
```

Expected: tests fail because `PublicBrandingConfigSchema` and `publicBranding` fields do not exist yet.

- [ ] **Step 3: Add Prisma column and migration**

In `TestPublicLink`, add:

```prisma
publicBranding Json?
```

Create migration SQL:

```sql
ALTER TABLE "test_public_links" ADD COLUMN "publicBranding" JSONB;
```

- [ ] **Step 4: Add Zod branding schema**

In `tests-public.dto.ts`, add reusable schemas:

```ts
const HexColorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
const PublicBrandingHttpsUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((value) => value.startsWith('https://'), { message: 'URL must use https' });

export const PublicBrandingConfigSchema = z
  .object({
    version: z.literal(1),
    background: z
      .object({
        mode: z.enum(['default', 'solid', 'image']).default('default'),
        color: HexColorSchema.optional(),
        imageUrl: PublicBrandingHttpsUrlSchema.optional(),
        overlay: z.number().min(0).max(0.85).optional(),
      })
      .optional(),
    header: z
      .object({
        logos: z
          .array(
            z.object({
              url: PublicBrandingHttpsUrlSchema,
              alt: z.string().trim().min(1).max(120),
              size: z.enum(['sm', 'md', 'lg']).optional(),
            }),
          )
          .max(2)
          .optional(),
      })
      .optional(),
    buttons: z
      .object({
        primaryColor: HexColorSchema.optional(),
        textColor: HexColorSchema.optional(),
      })
      .optional(),
    surfaces: z
      .object({
        cardColor: HexColorSchema.optional(),
        borderColor: HexColorSchema.optional(),
      })
      .optional(),
    accents: z
      .object({
        accentColor: HexColorSchema.optional(),
      })
      .optional(),
  })
  .strict();
```

Add `publicBranding: PublicBrandingConfigSchema.nullable()` to public access, session state, and result schemas.

- [ ] **Step 5: Add admin DTO fields**

In `tests-links.dto.ts`, import `PublicBrandingConfigSchema` and add:

```ts
publicBranding: PublicBrandingConfigSchema.nullable().optional(),
```

to create and update schemas. Add:

```ts
publicBranding: PublicBrandingConfigSchema.nullable(),
```

to `AdminPublicLinkSchema`.

- [ ] **Step 6: Run focused backend DTO/schema tests**

Run:

```powershell
npm run test --prefix server -- tests-public.dto.spec.ts tests-links.dto.spec.ts tests-prisma-schema.spec.ts --runInBand
```

Expected: PASS.

## Task 2: Backend Services And Public Responses

**Files:**

- Modify: `server/src/tests/tests-public-link.service.ts`
- Modify: `server/src/tests/tests-public-link.mapper.ts`
- Modify: `server/src/tests/tests-attempt.mapper.ts`
- Modify: `server/src/tests/tests-public-session.service.ts`
- Test: `server/src/tests/tests-public-link.service.spec.ts`
- Test: `server/src/tests/tests-public-session-read.service.spec.ts`

- [ ] **Step 1: Add failing service/read tests**

Add assertions that branding is persisted and returned:

```ts
const publicBranding = {
  version: 1,
  buttons: { primaryColor: '#0066cc', textColor: '#ffffff' },
  accents: { accentColor: '#00a889' },
};

expect(createCall?.data.publicBranding).toEqual(publicBranding);
expect(result.publicBranding).toEqual(publicBranding);
```

For session read paths, include `publicBranding` under `attempt.publicLink` and assert:

```ts
expect(result.session.publicBranding).toEqual(publicBranding);
expect(result.publicBranding).toEqual(publicBranding);
```

- [ ] **Step 2: Run focused service tests and confirm failure**

Run:

```powershell
npm run test --prefix server -- tests-public-link.service.spec.ts tests-public-session-read.service.spec.ts --runInBand
```

Expected: FAIL because mappings do not yet include branding.

- [ ] **Step 3: Persist branding on create/update**

In `createPublicLink`, add to Prisma `data`:

```ts
publicBranding: dto.publicBranding ?? null,
```

In `updatePublicLink`, add:

```ts
...(dto.publicBranding !== undefined ? { publicBranding: dto.publicBranding } : {}),
```

- [ ] **Step 4: Return branding in all mappers**

Add `publicBranding: link.publicBranding ?? null` to admin mapping and public access response.

Add `publicBranding: attempt.publicLink.publicBranding ?? null` to `mapSessionState` and `getSessionResult`.

- [ ] **Step 5: Run focused service tests**

Run:

```powershell
npm run test --prefix server -- tests-public-link.service.spec.ts tests-public-session-read.service.spec.ts --runInBand
```

Expected: PASS.

## Task 3: Generate API And Shared Frontend Branding Adapter

**Files:**

- Generated by command: `client/src/shared/api/generated/**`
- Generated by command: `client/src/shared/api/model/**`
- Create: `client/src/features/tests/public-branding.ts`
- Test: `client/src/features/tests/public-branding.test.ts`

- [ ] **Step 1: Regenerate Prisma and API client**

Run:

```powershell
npm run prisma:generate
npm run gen:api
```

Expected: generated DTOs include `publicBranding`.

- [ ] **Step 2: Add failing adapter tests**

Create tests:

```ts
expect(resolvePublicBrandingTheme(null)).toEqual({
  className: '',
  style: {},
  logos: [],
  backgroundMode: 'default',
});

expect(
  resolvePublicBrandingTheme({
    version: 1,
    buttons: { primaryColor: '#0066cc', textColor: '#ffffff' },
    accents: { accentColor: '#00a889' },
  }),
).toMatchObject({
  style: {
    '--primary': '210 100% 40%',
    '--primary-foreground': '0 0% 100%',
    '--accent': '169 100% 33%',
  },
});
```

- [ ] **Step 3: Implement adapter**

Create `public-branding.ts` with:

- exported `PublicBrandingConfig` type compatible with generated API;
- `hexToHslToken(hex: string): string`;
- `resolvePublicBrandingTheme(config)` returning CSS variables, logos, background mode, image URL, and overlay.

The function must ignore malformed optional fields defensively and return defaults for `null`.

- [ ] **Step 4: Run adapter tests**

Run:

```powershell
npm run test:run --prefix client -- public-branding.test.ts
```

Expected: PASS.

## Task 4: Public STANDARD Pages Consume Branding

**Files:**

- Modify: `client/src/widgets/public-test-workspace/ui/public-theme-layout.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry-workspace.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-run-workspace.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-result-workspace.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-analysis-processing-screen.tsx`
- Modify: `client/src/features/tests/ui/public-theme.css`
- Test: existing public workspace tests plus a new layout branding test if needed

- [ ] **Step 1: Add failing layout/public tests**

Assert that a STANDARD layout with branding renders a logo and CSS variables:

```tsx
render(
  <PublicThemeLayout
    branding={{
      version: 1,
      header: { logos: [{ url: 'https://cdn.example.com/logo.svg', alt: 'Logo' }] },
      buttons: { primaryColor: '#0066cc' },
    }}
  >
    <button>Start</button>
  </PublicThemeLayout>,
);

expect(screen.getByAltText('Logo')).toBeInTheDocument();
expect(screen.getByRole('main')).toHaveStyle({ '--primary': '210 100% 40%' });
```

- [ ] **Step 2: Implement layout branding props**

Extend `PublicThemeLayoutProps`:

```ts
branding?: PublicBrandingConfig | null;
builderHeaderSlot?: ReactNode;
```

Resolve branding through the adapter and apply the returned style to `<main>`. Render a scoped header area above `children` when logos or `builderHeaderSlot` exist.

- [ ] **Step 3: Pass branding through public STANDARD branches**

Use these sources:

- entry: `link.publicBranding`
- run: `session.publicBranding`
- result: `result.publicBranding`
- standard processing state: `result.publicBranding`

Keep POLUS branches unchanged.

- [ ] **Step 4: Run public frontend tests**

Run:

```powershell
npm run test:run --prefix client -- public-test-entry-workspace public-test-run-workspace public-test-result-workspace public-theme-layout
```

Expected: PASS.

## Task 5: Admin Zonal Builder UI

**Files:**

- Create: `client/src/widgets/admin-public-links-workspace/ui/public-link-branding-builder.helpers.ts`
- Create: `client/src/widgets/admin-public-links-workspace/ui/public-link-branding-builder.fixtures.ts`
- Create: `client/src/widgets/admin-public-links-workspace/ui/public-link-branding-builder.tsx`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/public-links-list-card.row.tsx`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/public-links-list-card.tsx`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/admin-public-links-workspace.tsx`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-actions.ts`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-actions.types.ts`
- Test: `client/src/widgets/admin-public-links-workspace/ui/public-link-branding-builder.test.tsx`
- Test: `client/src/widgets/admin-public-links-workspace/ui/public-links-list-card.test.tsx`

- [ ] **Step 1: Add failing builder interaction tests**

Cover the critical behavior:

```tsx
render(
  <PublicLinkBrandingBuilder open link={standardLink} onOpenChange={vi.fn()} onSave={onSave} />,
);

await user.click(screen.getByRole('button', { name: /фон/i }));
await user.clear(screen.getByLabelText(/цвет фона/i));
await user.type(screen.getByLabelText(/цвет фона/i), '#f2f7fb');
await user.click(screen.getByRole('button', { name: /применить/i }));
await user.click(screen.getByRole('button', { name: /сохранить/i }));

expect(onSave).toHaveBeenCalledWith(
  standardLink.id,
  expect.objectContaining({
    version: 1,
    background: expect.objectContaining({ mode: 'solid', color: '#f2f7fb' }),
  }),
);
```

- [ ] **Step 2: Add row action**

Add a menu item with `Palette` icon:

```tsx
<Button type="button" variant="ghost" size="sm" onClick={() => onOpenBrandingBuilder(link)}>
  <Palette className="mr-2 h-3.5 w-3.5" />
  Конструктор
</Button>
```

Only show it for active, non-archived, `STANDARD` links.

- [ ] **Step 3: Implement builder helpers**

Add immutable update helpers:

```ts
export const createDefaultBrandingConfig = (): PublicBrandingConfig => ({ version: 1 });

export const updateBrandingSection = <K extends keyof PublicBrandingConfig>(
  config: PublicBrandingConfig | null,
  key: K,
  value: PublicBrandingConfig[K],
): PublicBrandingConfig => ({
  ...(config ?? createDefaultBrandingConfig()),
  [key]: value,
});
```

- [ ] **Step 4: Implement builder UI**

Use a wide dialog with:

- left/top state switcher: Start, Question, Result;
- central preview rendered through `PublicThemeLayout`;
- edit buttons over fixed zones;
- modals for background, header logo, buttons, surfaces, accent;
- footer buttons: Reset to standard, Cancel, Save.

- [ ] **Step 5: Wire save/reset**

Add `handleUpdatePublicLinkBranding(linkId, publicBranding)`:

```ts
updatePublicLinkMutation.mutate(
  { linkId, data: { publicBranding } },
  {
    onSuccess: () => {
      toast.success(publicBranding ? 'Брендинг сохранен' : 'Брендинг сброшен');
      refetchPublicLinks();
    },
    onError: (error) => toast.error(parseApiError(error)),
  },
);
```

- [ ] **Step 6: Run admin builder tests**

Run:

```powershell
npm run test:run --prefix client -- public-link-branding-builder public-links-list-card use-admin-public-links-actions
```

Expected: PASS.

## Task 6: Verification And Container Rebuild

**Files:** no intended code edits.

- [ ] **Step 1: Rebuild frontend container before frontend verification**

Run:

```powershell
docker compose up -d --build --force-recreate frontend
```

Expected: frontend container recreated successfully.

- [ ] **Step 2: Run architecture and focused test gates**

Run:

```powershell
npm run verify:architecture
npm run test --prefix server -- tests-public.dto.spec.ts tests-links.dto.spec.ts tests-public-link.service.spec.ts tests-public-session-read.service.spec.ts tests-prisma-schema.spec.ts --runInBand
npm run test:run --prefix client -- public-branding public-theme-layout public-link-branding-builder public-links-list-card use-admin-public-links-actions
```

Expected: PASS.

- [ ] **Step 3: Run builds**

Run:

```powershell
npm run build --prefix server
npm run build --prefix client
```

Expected: PASS.

- [ ] **Step 4: Manual smoke**

Open admin public links, launch constructor for a STANDARD link, change background/logo/button color, save, open `/t/<shortCode>`, and verify the real public page matches the preview.

## Self-Review

- Spec coverage: storage, API responses, real public pages, zonal builder, preview states, reset, STANDARD-only scope, no upload, and POLUS isolation are covered.
- Placeholder scan: no `TBD`, `TODO`, or deferred implementation steps remain.
- Type consistency: the plan consistently uses `publicBranding` and `PublicBrandingConfig` with `version: 1`.
