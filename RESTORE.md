# Инструкция по восстановлению проекта (Disaster Recovery & Clean Setup)

Данный документ описывает пошаговый процесс полного восстановления окружения разработки на чистой операционной системе (Windows).

---

## Текущее состояние проекта

- **Основная рабочая ветка:** `fix/admin-audit-p1`
- **Pull Request на GitHub:** [#55: fix(admin): resolve admin panel audit findings](https://github.com/MichailLis/AI_Template/pull/55)
- **Статус аудита (эпик `ait-rcw`):** 36 из 45 задач закрыто (все P1 закрыты на 100%).
- **База задач Beads (`bd`):** полностью экспортирована в [.beads/issues.jsonl](file:///.beads/issues.jsonl).
- **Резервные артефакты:** выгружены в ветку `origin/archive-local-artifacts`.

---

## 1. Установка базового ПО на чистой Windows

Установите необходимые инструменты через консоль PowerShell (от имени администратора) с помощью `winget`:

```powershell
# Git и GitHub CLI
winget install --id Git.Git -e
winget install --id GitHub.cli -e

# Node.js LTS (v20+ или v22+)
winget install --id OpenJS.NodeJS.LTS -e

# Docker Desktop (для PostgreSQL и контейнеров)
winget install --id Docker.DockerDesktop -e

# Python / uv (для агентов и инструментов, если используются)
winget install --id astral-sh.uv -e
```

_После установки перезапустите терминал PowerShell, чтобы обновились переменные `PATH`._

---

## 2. Клонирование репозитория

```powershell
# 1. Авторизация в GitHub CLI (если ещё не выполнена)
gh auth login

# 2. Клонирование репозитория
git clone https://github.com/MichailLis/AI_Template.git
cd AI_Template

# 3. Переключение на рабочую ветку аудита
git checkout fix/admin-audit-p1
```

---

## 3. Установка зависимостей

Проект состоит из трех уровней: корневые скрипты, `client` (React 19 / Vite) и `server` (NestJS 11).

```powershell
# Установка корневых зависимостей и хуков husky
npm install

# Установка зависимостей для client и server
npm run install:all
```

---

## 4. Настройка переменных окружения (`.env`)

Скопируйте файлы конфигурации из шаблонов:

```powershell
# Корневой .env для Docker Compose
Copy-Item .env.example .env

# Конфигурация для сервера
Copy-Item server/.env.example server/.env
```

> **Примечание:** Если вы используете интеграцию с ИИ, укажите ваш ключ в `server/.env`:
>
> ```env
> OPENROUTER_API_KEY=sk-or-v1-...
> ```

---

## 5. Восстановление трекера задач Beads (`bd`)

Все 45 задач аудита, статусы, зависимости, комментарии и заметки агента сохранены в файле `.beads/issues.jsonl`.

```powershell
# 1. Установка CLI beads глобально
npm install -g @gastownhall/beads

# 2. Инициализация Beads в репозитории
bd init --no-db

# 3. Импорт всей истории задач и воспоминаний
bd import -i .beads/issues.jsonl

# 4. Проверка статуса базы
bd status
```

Вы должны увидеть:

```text
Total Issues:  45
Open:          9
In Progress:   0
Closed:        36
Ready to Work: 9
```

---

## 6. Запуск Docker и базы данных

1. Запустите **Docker Desktop** в Windows и дождитесь его готовности.
2. Поднимите стек проекта (PostgreSQL, Adminer, Backend, Frontend):

```powershell
docker compose up -d
```

3. Сгенерируйте клиент Prisma и примените схему базы данных:

```powershell
# Генерация типов Prisma Client
npm run prisma:generate

# Синхронизация схемы БД
npm run prisma:push

# Заполнение начальными данными (пользователи/тесты)
npm run prisma:seed
```

---

## 7. Запуск проекта для разработки

Для локальной разработки на хосте:

```powershell
npm run dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend:** [http://localhost:3000](http://localhost:3000)
- **Swagger API:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Adminer (веб-клиент БД):** [http://localhost:8080](http://localhost:8080)

---

## 8. Проверка качества и прохождение тестов

Для проверки целостности репозитория запустите проверки:

```powershell
# Проверка типов
npm run typecheck

# Архитектурные инварианты и парные правила
npm run verify:invariants
npm run verify:paired-rules
npm run verify:ai-guide

# Линтер
npm run lint

# Тесты бэкенда
npm run test --prefix server

# Тесты фронтенда
npm run test:run --prefix client

# Полный цикл верификации (требует запущенный Docker с PostgreSQL)
npm run verify:local
```

---

## 9. Где найти сохранённые резервные ветки

Если вам понадобятся старые наработки, брифы задач или временные файлы:

- **`origin/archive-local-artifacts`** — содержит:
  - Брифы и отчёты Subagent-Driven Development (`.superpowers/sdd/`)
  - Хук Codex (`.codex/hooks/karpathy_guidelines_prompt.py`)
  - Документацию RTK (`RTK.md`)
  - Временные файлы расчетов Владивостока (`outputs/` и `.artifact-work/`)
  - Патч старого незакоммиченного редизайна (`stash-2-admin-tests-redesign.patch`)
- **`origin/backup/main-work`** — резервная копия локальной ветки `main-work`.
- **`origin/backup/wip-main-checkout-local-changes`** — резервная копия запаркованных изменений.

Для просмотра содержимого любой резервной ветки без переключения текущей:

```powershell
git checkout origin/archive-local-artifacts -- .superpowers/
```

---

## 10. Как продолжить выполнение задач аудита

Чтобы продолжить устранение оставшихся 8 находок аудита:

```powershell
# Посмотреть готовые к работе задачи
bd ready

# Посмотреть детали конкретной задачи
bd show ait-rcw.33

# Взять задачу в работу
bd update ait-rcw.33 --claim

# Закрыть после выполнения
bd close ait-rcw.33
```

Оставшиеся задачи:

1. `ait-rcw.33` (FLOW-08: завершенная попытка открывается как незавершенная)
2. `ait-rcw.34` (FLOW-10: отключение учебного заведения и его влияние на ссылки)
3. `ait-rcw.35` (FLOW-11: истекшая сессия администратора и сохранение ввода)
4. `ait-rcw.36` (UX-16: карточки-заглушки при результате теста без анализа)
5. `ait-rcw.37` (UX-18: дата публикации новой редакции политики ПДн)
6. `ait-rcw.40` (FLOW-12: валидация пересекающихся диапазонов слайдера)
7. `ait-rcw.38` (UX-17: фильтрация латиницы в имени ученика)
8. `ait-rcw.39` (UX-19: мелкие дефекты оформления, порядок вопросов)
