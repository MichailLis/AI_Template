# Education Organization Form Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать обязательность и формат заполнения полей учебного заведения понятными в формах создания и редактирования, не меняя серверные правила поэтапного заполнения.

**Architecture:** Общая конфигурация операторских полей остаётся в `EducationOrganizationOperatorFields` и получает текст метки, вид обязательности и placeholder. Две карточки независимо маркируют действительно обязательное поле `Название`, а существующие Vitest-тесты фиксируют одинаковое поведение create/edit; backend, DTO и формула `personalDataReady` не меняются.

**Tech Stack:** React 19, TypeScript, Testing Library, Vitest, Tailwind CSS, Docker Compose, in-app browser.

## Global Constraints

- Работать в текущей ветке `main`; новую ветку не создавать.
- Новые зависимости, CSS-токены, маршруты, Prisma-модели и backend API не добавлять.
- Только `Название` получает HTML-атрибут `required`.
- `Полное наименование`, `Сокращённое наименование` и `Политика обработки ПДн` получают видимую `*`, но не HTML-атрибут `required`.
- ИНН, ОГРН, юридический адрес, email, телефон, документ согласия и логотип получают пометку `— необязательно`.
- После изменения `client/` обязательно выполнить `docker compose up -d --build --force-recreate frontend` до браузерной проверки.
- Коммиты и staging не выполнять: рабочее дерево содержит незакоммиченные пользовательские изменения.

## File Structure

- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx` — регрессионные проверки меток, required-семантики, пояснения и placeholders обеих карточек.
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx` — единая конфигурация операторских полей и их доступный рендеринг.
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx` — обязательная метка, `required` и единый пример для названия при создании.
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx` — та же семантика названия при редактировании.
- Verify only: `docker-compose.yml` — запуск штатного четырёхконтейнерного стека без изменений.

---

### Task 1: Зафиксировать UX-контракт формы тестами

**Files:**

- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx`
- Test: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx`

**Interfaces:**

- Consumes: существующие `EducationOrganizationsCreateCard`, `EducationOrganizationsEditCard` и Testing Library queries.
- Produces: проверяемый контракт accessible names, `required`, helper-copy и placeholder для обеих карточек.

- [ ] **Step 1: Расширить create-тест ожидаемыми метками и examples**

Добавить после проверки трёх fieldset:

```tsx
const nameInput = screen.getByLabelText('Название *');
expect(nameInput).toBeRequired();
expect(nameInput).toHaveAttribute('placeholder', 'Например: Лицей № 42');

for (const label of [
  'Полное наименование *',
  'Сокращённое наименование *',
  'Политика обработки ПДн *',
]) {
  expect(screen.getByLabelText(label)).not.toBeRequired();
}

for (const label of [
  'ИНН — необязательно',
  'ОГРН — необязательно',
  'Юридический адрес — необязательно',
  'Email — необязательно',
  'Телефон — необязательно',
  'Документ согласия — необязательно',
  'Логотип — необязательно',
]) {
  expect(screen.getByLabelText(label)).not.toBeRequired();
}

expect(
  screen.getByText(
    '* — обязательно для обработки ПДн от имени организации. Неполную организацию можно сохранить и заполнить позже.',
  ),
).toBeInTheDocument();
expect(screen.getByLabelText('Полное наименование *')).toHaveAttribute(
  'placeholder',
  'Например: Муниципальное автономное общеобразовательное учреждение «Лицей № 42»',
);
expect(screen.getByLabelText('ИНН — необязательно')).toHaveAttribute(
  'placeholder',
  'Например: 1234567890',
);
expect(screen.getByLabelText('Политика обработки ПДн *')).toHaveAttribute(
  'placeholder',
  'https://school.example/privacy',
);
```

Заменить прежние queries без маркеров на новые accessible names. Удалить проверку старого текста `Неполную или неактивную организацию нельзя использовать...`, потому что утверждённая спецификация заменяет его новым точным пояснением.

- [ ] **Step 2: Расширить edit-тест одинаковым контрактом**

Добавить в edit-тест:

```tsx
const editNameInput = screen.getByLabelText('Название *');
expect(editNameInput).toBeRequired();
expect(editNameInput).toHaveAttribute('placeholder', 'Например: Лицей № 42');
expect(screen.getByLabelText('Полное наименование *')).toHaveValue('Полное имя');
expect(screen.getByLabelText('Полное наименование *')).toHaveAttribute(
  'placeholder',
  'Например: Муниципальное автономное общеобразовательное учреждение «Лицей № 42»',
);
expect(screen.getByLabelText('Политика обработки ПДн *')).not.toBeRequired();
expect(screen.getByLabelText('Логотип — необязательно')).toHaveAttribute(
  'placeholder',
  'https://school.example/logo.svg',
);
```

- [ ] **Step 3: Запустить тест и подтвердить ожидаемое падение**

Run:

```powershell
cd client
npx vitest run src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx
```

Expected: FAIL, потому что текущие labels не содержат `*` / `— необязательно`, `Название` ещё не `required`, а операторские placeholders отсутствуют.

---

### Task 2: Реализовать маркировку и placeholders

**Files:**

- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx:26`
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx:68`
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx:112`
- Test: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx`

**Interfaces:**

- Consumes: `EducationOrganizationOperatorField`, `EducationOrganizationOperatorValues`, общий `Input` и `Label`.
- Produces: `OperatorFieldConfig` с обязательным `placeholder: string` и `operatorRequired?: boolean`; accessible label вычисляется внутри общего компонента.

- [ ] **Step 1: Расширить конфигурацию операторских полей**

Изменить интерфейс:

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

Заполнить конфигурацию точными значениями:

```tsx
{ field: 'fullName', label: 'Полное наименование', placeholder: 'Например: Муниципальное автономное общеобразовательное учреждение «Лицей № 42»', operatorRequired: true, autoComplete: 'organization', className: 'sm:col-span-2' }
{ field: 'shortName', label: 'Сокращённое наименование', placeholder: 'Например: МАОУ «Лицей № 42»', operatorRequired: true, autoComplete: 'organization' }
{ field: 'inn', label: 'ИНН', placeholder: 'Например: 1234567890' }
{ field: 'ogrn', label: 'ОГРН', placeholder: 'Например: 1234567890123' }
{ field: 'legalAddress', label: 'Юридический адрес', placeholder: 'Например: г. Казань, ул. Школьная, д. 1', autoComplete: 'street-address', className: 'sm:col-span-2' }
{ field: 'email', label: 'Email', placeholder: 'Например: office@school.example', autoComplete: 'email' }
{ field: 'phone', label: 'Телефон', placeholder: 'Например: +7 900 000-00-00', autoComplete: 'tel' }
{ field: 'privacyPolicyUrl', label: 'Политика обработки ПДн', placeholder: 'https://school.example/privacy', operatorRequired: true, type: 'url' }
{ field: 'consentDocumentUrl', label: 'Документ согласия', placeholder: 'https://school.example/consent', type: 'url' }
{ field: 'logoUrl', label: 'Логотип', placeholder: 'https://school.example/logo.svg', type: 'url', className: 'sm:col-span-2' }
```

- [ ] **Step 2: Обновить пояснение и рендеринг общего поля**

Заменить пояснение на:

```tsx
<p className="text-xs text-admin-muted">
  * — обязательно для обработки ПДн от имени организации. Неполную организацию можно сохранить и
  заполнить позже.
</p>
```

В map вычислить и отрендерить label без добавления `required`:

```tsx
const fieldLabel = fieldConfig.operatorRequired
  ? `${fieldConfig.label} *`
  : `${fieldConfig.label} — необязательно`;

<Label htmlFor={inputId}>{fieldLabel}</Label>
<Input
  id={inputId}
  name={fieldConfig.field}
  type={fieldConfig.type ?? 'text'}
  autoComplete={fieldConfig.autoComplete ?? 'off'}
  placeholder={fieldConfig.placeholder}
  value={values[fieldConfig.field]}
  onChange={(event) => onChange(fieldConfig.field, event.target.value)}
  disabled={disabled}
/>
```

- [ ] **Step 3: Обновить обязательное название в обеих карточках**

В create и edit использовать одинаковые label и свойства input:

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

- [ ] **Step 4: Запустить целевой тест и подтвердить прохождение**

Run:

```powershell
cd client
npx vitest run src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx
```

Expected: 1 file passed, 2 tests passed.

---

### Task 3: Статическая, контейнерная и браузерная проверка

**Files:**

- Verify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx`
- Verify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx`
- Verify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx`
- Verify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx`

**Interfaces:**

- Consumes: собранный frontend на `http://localhost:5173`, существующий backend и тестовая учётная запись проекта.
- Produces: свежие доказательства корректности unit/UI, сборки, форматирования, контейнерного запуска и рабочего сценария ПДн.

- [ ] **Step 1: Запустить форматирование только изменённых клиентских файлов**

Run:

```powershell
cd client
npx prettier --write src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx
```

Expected: четыре файла отформатированы без ошибок.

- [ ] **Step 2: Запустить целевые тесты, lint и build**

Run:

```powershell
cd client
npx vitest run src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx
npm run lint
npm run build
```

Expected: целевой тест, ESLint и TypeScript/Vite build завершаются с exit code 0; допустимы только уже известные baseline warnings.

- [ ] **Step 3: Проверить diff**

Run:

```powershell
git diff --check
git diff -- client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx
```

Expected: `git diff --check` не сообщает новых whitespace errors; diff ограничен согласованным UX.

- [ ] **Step 4: Пересобрать frontend-контейнер и проверить topology**

Run:

```powershell
docker compose up -d --build --force-recreate frontend
docker compose ps
```

Expected: `ai_template_frontend`, `ai_template_backend`, `ai_template_postgres`, `ai_template_adminer` имеют состояние running/healthy согласно compose healthchecks.

- [ ] **Step 5: Провести браузерный smoke-тест формы**

Во встроенном браузере открыть `http://localhost:5173/login`, войти тестовой учётной записью из локальной конфигурации и перейти в администрирование учебных заведений. Проверить:

```text
- create/edit: видны "Название *" и пример "Например: Лицей № 42";
- три поля operator-ready имеют "*", остальные семь — "— необязательно";
- пояснение говорит о возможности сохранить неполную организацию;
- URL-поля сохраняют type=url и предметные placeholders;
- существующие fieldset/legend и readiness badges отображаются;
- неполную организацию можно сохранить, но она остаётся "Данные ПДн не готовы";
- после заполнения полного и сокращённого наименования и URL политики активная организация становится готовой к работе с ПДн;
- доступный пользовательский сценарий обработки ПДн от имени выбранной организации выполняется без UI/API ошибок.
```

Expected: все пункты проходят; консоль не содержит новых ошибок, связанные API-запросы завершаются успешно.

- [ ] **Step 6: Зафиксировать результаты без staging/commit**

Run:

```powershell
git status --short
```

Expected: изменённые файлы остаются незастейдженными; пользовательские посторонние изменения сохранены.
