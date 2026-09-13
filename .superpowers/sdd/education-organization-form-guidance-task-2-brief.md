# Task 2: Реализовать маркировку и placeholders

## Global constraints

- Работать в текущей ветке `main`; новую ветку не создавать.
- Новые зависимости, CSS-токены, маршруты, Prisma-модели и backend API не добавлять.
- Только `Название` получает HTML-атрибут `required`.
- `Полное наименование`, `Сокращённое наименование` и `Политика обработки ПДн` получают видимую `*`, но не HTML-атрибут `required`.
- ИНН, ОГРН, юридический адрес, email, телефон, документ согласия и логотип получают пометку `— необязательно`.
- Коммиты и staging не выполнять: рабочее дерево содержит незакоммиченные пользовательские изменения.

## Files

- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx`
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx`
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx`
- Covering test: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx`
- Do not modify the covering test in this task unless a genuine implementation-independent defect is discovered; escalate first.

## Shared operator field configuration

Extend the existing interface exactly:

```tsx
interface OperatorFieldConfig {
  field: EducationOrganizationOperatorField;
  label: string;
  placeholder: string;
  operatorRequired?: boolean;
  type?: 'text' | 'url';
  autoComplete?: string;
  className?: string;
}
```

Populate the existing `FIELD_GROUPS` entries with these exact values while preserving group titles, field order, autocomplete, URL types and layout classes:

```tsx
{
  field: 'fullName',
  label: 'Полное наименование',
  placeholder:
    'Например: Муниципальное автономное общеобразовательное учреждение «Лицей № 42»',
  operatorRequired: true,
  autoComplete: 'organization',
  className: 'sm:col-span-2',
}
{
  field: 'shortName',
  label: 'Сокращённое наименование',
  placeholder: 'Например: МАОУ «Лицей № 42»',
  operatorRequired: true,
  autoComplete: 'organization',
}
{ field: 'inn', label: 'ИНН', placeholder: 'Например: 1234567890' }
{ field: 'ogrn', label: 'ОГРН', placeholder: 'Например: 1234567890123' }
{
  field: 'legalAddress',
  label: 'Юридический адрес',
  placeholder: 'Например: г. Казань, ул. Школьная, д. 1',
  autoComplete: 'street-address',
  className: 'sm:col-span-2',
}
{
  field: 'email',
  label: 'Email',
  placeholder: 'Например: office@school.example',
  autoComplete: 'email',
}
{
  field: 'phone',
  label: 'Телефон',
  placeholder: 'Например: +7 900 000-00-00',
  autoComplete: 'tel',
}
{
  field: 'privacyPolicyUrl',
  label: 'Политика обработки ПДн',
  placeholder: 'https://school.example/privacy',
  operatorRequired: true,
  type: 'url',
}
{
  field: 'consentDocumentUrl',
  label: 'Документ согласия',
  placeholder: 'https://school.example/consent',
  type: 'url',
}
{
  field: 'logoUrl',
  label: 'Логотип',
  placeholder: 'https://school.example/logo.svg',
  type: 'url',
  className: 'sm:col-span-2',
}
```

Replace the old helper text with the exact approved sentence:

```tsx
<p className="text-xs text-admin-muted">
  * — обязательно для обработки ПДн от имени организации. Неполную организацию можно сохранить и
  заполнить позже.
</p>
```

Inside `group.fields.map`, compute:

```tsx
const fieldLabel = fieldConfig.operatorRequired
  ? `${fieldConfig.label} *`
  : `${fieldConfig.label} — необязательно`;
```

Render `<Label htmlFor={inputId}>{fieldLabel}</Label>` and add only `placeholder={fieldConfig.placeholder}` to the existing shared `<Input>`. Do not add `required` to shared operator inputs. Preserve `id`, `name`, `type`, `autoComplete`, value, onChange, disabled, fieldsets and legends.

## Create and edit name fields

Create card:

```tsx
<Label htmlFor="new-organization-name">Название *</Label>
<Input
  id="new-organization-name"
  value={newOrganizationName}
  onChange={(event) => onNewOrganizationNameChange(event.target.value)}
  placeholder="Например: Лицей № 42"
  required
/>
```

Edit card:

```tsx
<Label htmlFor="edit-organization-name">Название *</Label>
<Input
  id="edit-organization-name"
  value={editName}
  onChange={(event) => onEditNameChange(event.target.value)}
  placeholder="Например: Лицей № 42"
  required
  disabled={!selectedOrganization}
/>
```

Do not change event handlers, disabled logic, buttons, readiness badges or validation fields.

## Verification

Run:

```powershell
npm run test:run --prefix client -- src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx
```

Expected GREEN: 1 file passed, 2 tests passed, no warnings/errors.

Run Prettier only on the three production files changed by this task:

```powershell
npx prettier --write client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx
```

Then rerun the focused test and confirm it stays GREEN.

## Report

Write the full report to `.superpowers/sdd/education-organization-form-guidance-task-2-report.md` including files changed, exact GREEN commands/output, confirmation no operator input is HTML-required, and self-review. Return status `DONE`, no commit, one-line test summary, concerns, and report path.
