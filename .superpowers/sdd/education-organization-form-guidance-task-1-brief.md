# Task 1: Зафиксировать UX-контракт формы тестами

## Global constraints

- Работать в текущей ветке `main`; новую ветку не создавать.
- Новые зависимости, CSS-токены, маршруты, Prisma-модели и backend API не добавлять.
- Только `Название` получает HTML-атрибут `required`.
- `Полное наименование`, `Сокращённое наименование` и `Политика обработки ПДн` получают видимую `*`, но не HTML-атрибут `required`.
- ИНН, ОГРН, юридический адрес, email, телефон, документ согласия и логотип получают пометку `— необязательно`.
- Коммиты и staging не выполнять: рабочее дерево содержит незакоммиченные пользовательские изменения.

## Files

- Modify and test: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx`
- Do not modify production files in this task.

## Required test changes

Extend the create-card test to assert:

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

Retain the three existing fieldset checks and the `type="url"` assertion using the new accessible name. Remove the assertion for the old `Неполную или неактивную организацию нельзя использовать...` copy because the approved exact helper sentence replaces it.

Extend the edit-card test to assert:

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

Retain the server-readiness badge assertion.

## Verification

Run exactly:

```powershell
npm run test:run --prefix client -- src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx
```

Expected RED: both tests fail because the accessible labels, required semantics and configured placeholders do not exist yet. Confirm failures are assertions about missing feature behavior, not syntax/setup errors.

## Report

Write full report to `.superpowers/sdd/education-organization-form-guidance-task-1-report.md` with changed file, exact RED command, relevant expected failures, and self-review. Return status `DONE`, no commit, one-line test summary, concerns, and report path.
