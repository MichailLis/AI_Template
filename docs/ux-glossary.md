# UX Terminology Glossary

Canonical Russian terminology for admin and public student UI surfaces. This glossary prevents terminology drift and ensures consistency across all user-facing copy.

## Canonical Terms

### попытка (attempt)

**Definition:** Single student interaction with a test, from start to submission or abandonment.

**Use when:**

- Referencing individual test runs in admin statistics
- Showing attempt-level actions (view analysis, view answers)
- Displaying attempt metadata (ID, number, timestamps)

**Forbidden alternates:**

- `attempts` (English)
- `запуск` (incorrect context)
- `проход` (ambiguous - use "попытка" or "прохождение")
- `тестирование` (too broad)

**Examples:**

- ✅ "Прохождения студентов" (card title for attempts list)
- ✅ "попытка #1" (attempt identifier)
- ✅ "ID попытки" (table column)
- ❌ "Attempts" (English)
- ❌ "Запуски тестов" (incorrect)

**Mapped UI surfaces:**

- `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempts-table-card.tsx` - Card title "Прохождения студентов", table columns "ID", "№"
- `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempt-detail-dialog.tsx` - Dialog subtitle shows attempt number: "прохождение #1"

---

### прохождение (completion/passage)

**Definition:** A successfully completed attempt that has reached a terminal state (finished, expired, or abandoned).

**Use when:**

- Referring to completed test runs in aggregate
- Describing statistics or summary counts
- Using in business copy for non-technical audiences

**Forbidden alternates:**

- `completion` (English)
- `passage` (English)
- `проход` (too casual)
- `завершение` (ambiguous - process vs. result)

**Examples:**

- ✅ "Тестов пройдено: 5" (business copy in link selector)
- ✅ "По выбранной ссылке пока нет прохождений." (empty state)
- ❌ "Completions: 5" (English)
- ❌ "Завершенные тесты" (ambiguous)

**Mapped UI surfaces:**

- `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempts-table-card.tsx` - Card description "Тестов пройдено: {count}"

---

### сессия (session)

**Definition:** Active test run state that persists across page navigations for a student.

**Use when:**

- Referencing active in-progress state
- Displaying session tokens or identifiers
- Showing session-level metadata

**Forbidden alternates:**

- `session` (English - only for internal identifiers)
- `сеанс` (unnecessary synonym)
- `визит` (incorrect context)

**Examples:**

- ✅ `/t/:code/session/:sessionToken` (route for active test run)
- ✅ "Сессия активна" (status indicator)
- ❌ "Session active" (English)
- ❌ "Визит" (incorrect)

**Mapped UI surfaces:**

- `client/src/app/App.tsx` - Route definition: `path="/t/:code/session/:sessionToken"`
- `client/src/widgets/public-test-workspace/` - Runtime session state management

---

### публичная ссылка (public link)

**Definition:** Shareable URL that provides student access to tests without authentication.

**Use when:**

- Referring to the link object in admin UI
- Describing link lifecycle actions (create, archive, restore)
- Displaying link metadata

**Forbidden alternates:**

- `public link` (English)
- `открытая ссылка` (unnecessary synonym)
- `общая ссылка` (too vague)
- `ссылка доступа` (wordy)

**Examples:**

- ✅ "Публичные ссылки" (nav menu item)
- ✅ "Сначала выберите ссылку" (empty state hint)
- ✅ "Архивировать ссылку" (action button)
- ❌ "Public links" (English)
- ❌ "Открытые ссылки" (unnecessary)

**Mapped UI surfaces:**

- `client/src/features/admin/ui/admin-shell.tsx` - Nav item: "Публичные ссылки" (id: 'public-links')
- `client/src/pages/admin/admin-public-links-page.tsx` - Links lifecycle workspace
- `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempts-table-card.tsx` - Empty state: "Сначала выберите ссылку"

---

### анализ (analysis)

**Definition:** AI-generated insights and evaluation of a completed test attempt.

**Use when:**

- Referring to analysis content or status
- Displaying analysis generation actions
- Showing analysis metadata (status, timestamp)

**Forbidden alternates:**

- `analysis` (English)
- `аналитика` (too broad - use for aggregate metrics, not individual insights)
- `оценка` (too narrow - analysis includes more than scoring)
- `разбор` (too informal)

**Examples:**

- ✅ "Анализ" (action button)
- ✅ "Анализ готов" (status badge)
- ✅ "Сводка" (summary section header - alternative for brief analysis view)
- ❌ "Analysis" (English)
- ❌ "Аналитика" (use only for aggregate stats pages, not individual results)

**Mapped UI surfaces:**

- `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempt-detail-dialog.tsx` - Tab button: "Анализ", section headers: "Сводка", "Исходный текст"
- `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempts-table-card.tsx` - Action button: "Анализ"
- `client/src/features/admin/ui/admin-shell.tsx` - Nav item: "Аналитика" (id: 'analytics' - for aggregate metrics)

---

### автосохранение (autosave)

**Definition:** Automatic background save of student answers during a public test session.

**Use when:**

- Showing save state in `/t/:code/session/:sessionToken`
- Explaining that answers are preserved before final submission
- Displaying retry/error copy when saving answers fails

**Forbidden alternates:**

- `autosave` (English)
- `автосейв` (slang)
- `синхронизация` (too broad)
- raw technical states such as `pending`, `saving`, `saved`, `error`

**Examples:**

- ✅ "Сохраняем ответы..."
- ✅ "Ответы сохранены"
- ✅ "Не удалось сохранить ответы. Попробуйте ещё раз."
- ❌ "Autosave error"
- ❌ "saving"

**Mapped UI surfaces:**

- `client/src/widgets/public-test-workspace/ui/use-public-test-run-autosave.ts` - Student-facing autosave state
- `client/src/widgets/public-test-workspace/ui/polus/polus-public-run.tsx` - Polus run autosave status

---

### конструктор брендинга (branding builder)

**Definition:** Admin tool for configuring the visual theme of a `STANDARD` public link.

**Use when:**

- Describing the public-link action that opens the branding editor
- Explaining background, logo, color, card, and accent settings
- Referring to reset-to-standard behavior

**Forbidden alternates:**

- `branding builder` (English)
- `кастомайзер` (informal)
- `редактор сайта` (overpromises layout editing)
- `конструктор Polus` (incorrect; Polus does not use this config)

**Examples:**

- ✅ "Конструктор брендинга"
- ✅ "Сбросить к стандартному оформлению"
- ✅ "Настройка применяется только к стандартному публичному шаблону"
- ❌ "Branding builder"
- ❌ "Редактор Polus"

**Mapped UI surfaces:**

- `client/src/widgets/admin-public-links-workspace/ui/public-link-branding-builder.tsx` - Admin constructor
- `client/src/widgets/admin-public-links-workspace/ui/public-links-list-card.row.tsx` - Public link row action
- `client/src/features/tests/public-branding.ts` - Branding-to-theme adapter

---

## Mapping Table: Term → UI Surfaces

| Term                  | File/Location                                                                                     | Context                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| попытка               | `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempts-table-card.tsx`   | Card title "Прохождения студентов", table columns "ID", "№", attempt detail dialog subtitle "прохождение #1" |
| прохождение           | `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempts-table-card.tsx`   | Card description "Тестов пройдено: {count}", empty state "По выбранной ссылке пока нет прохождений."         |
| сессия                | `client/src/app/App.tsx`                                                                          | Route `/t/:code/session/:sessionToken`                                                                       |
| публичная ссылка      | `client/src/features/admin/ui/admin-shell.tsx`                                                    | Nav item "Публичные ссылки" (id: 'public-links')                                                             |
| публичная ссылка      | `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempts-table-card.tsx`   | Empty state "Сначала выберите ссылку"                                                                        |
| анализ                | `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempt-detail-dialog.tsx` | Tab button "Анализ", sections "Сводка", "Исходный текст"                                                     |
| анализ                | `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempts-table-card.tsx`   | Action button "Анализ"                                                                                       |
| аналитика             | `client/src/features/admin/ui/admin-shell.tsx`                                                    | Nav item "Аналитика" (id: 'analytics' - aggregate metrics only)                                              |
| автосохранение        | `client/src/widgets/public-test-workspace/ui/use-public-test-run-autosave.ts`                     | Student-facing status for background answer saves                                                            |
| конструктор брендинга | `client/src/widgets/admin-public-links-workspace/ui/public-link-branding-builder.tsx`             | Admin editor for STANDARD public link appearance                                                             |

---

## State-Copy Tone Rules

### Loading States

**Tone:** Concise, neutral, action-oriented. Explain what is happening without drama.

**Pattern:** `{verb present tense} {noun}...` or `Загружаем {noun}...`

**Examples:**

- ✅ "Загружаем прохождения..." (loading attempts)
- ✅ "Загружаем страницу..." (loading route)
- ✅ "Загрузка каталога моделей..." (loading models)
- ✅ "Подключаемся к API..." (initializing connection)

**Anti-patterns:**

- ❌ "Please wait while we load..." (too wordy, apologetic)
- ❌ "Loading..." (English)
- ❌ "Загрузка данных. Подождите." (passive, generic)

---

### Empty States

**Tone:** Helpful, guidance-oriented. Explain why empty and what to do next.

**Pattern:** `{condition explaining why empty}. {optional action hint}.`

**Examples:**

- ✅ "По выбранной ссылке пока нет прохождений." (clear why, no action needed - wait for user to select link)
- ✅ "Нет тестовых переменных. Добавьте одну, чтобы проверить подстановку." (why empty + action hint)
- ✅ "Сначала выберите ссылку" (action hint when no selection)

**Anti-patterns:**

- ❌ "No data found." (English)
- ❌ "Ничего не найдено." (too brief, no guidance)
- ❌ "Здесь пока ничего нет." (vague)

---

### Error States

**Tone:** Direct, actionable. Explain what failed and provide explicit retry path.

**Pattern:** `{what failed}. {optional context}. {retry instruction with action button}.`

**Examples:**

- ✅ "Не удалось загрузить модели OpenRouter." (what failed) + "Повторить" button (retry action)
- ✅ "Неверные данные." (what failed - credential error) - implies retry with correct input
- ✅ "Ошибка загрузки. Попробуйте перезагрузить страницу." (what failed + retry path)

**Anti-patterns:**

- ❌ "An error occurred. Please try again." (English, generic)
- ❌ "Что-то пошло не так." (vague, unhelpful)
- ❌ "Ошибка." (too brief)

---

## Historical Context

### Fixed EN Remnants (Wave 1)

The following English terms were identified and fixed during Wave 1 copy normalization:

- "Summary" → "Сводка" (attempt analysis dialog)
- "Raw text" → "Исходный текст" (attempt analysis dialog)
- "Prompt Editor" → "Редактор промптов"
- "Search models" → "Поиск моделей"
- "All" / "Free" / "Paid" → "Все" / "Бесплатные" / "Платные"

These are documented as forbidden alternates to prevent regression.

---

## Glossary Maintenance

**Update triggers:**

- New terminology introduced in features or widgets
- Terminology drift detected in PR reviews or QA
- User feedback on confusing language

**Review cadence:** Review and update this glossary during each Wave completion.

**Verification:** Use forbidden alternates list to search in-scope files and ensure no regressions.
