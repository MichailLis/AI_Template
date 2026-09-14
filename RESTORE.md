# Инструкция по восстановлению проекта (Disaster Recovery & Clean Setup)

Данный документ описывает пошаговый процесс полного восстановления окружения разработки на чистой операционной системе (Windows).

---

## Текущее состояние проекта

- **Основная ветка:** `main` (или активная ветка разработки)
- **База задач Beads (`bd`):** сохранена в [.beads/issues.jsonl](file:///.beads/issues.jsonl).
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

# 3. Переключение на целевую ветку (например, main)
git checkout main
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

История задач, статусы, зависимости, комментарии и заметки агентов сохранены в файле `.beads/issues.jsonl`.

```powershell
# 1. Установка CLI beads глобально
npm install -g @gastownhall/beads

# 2. Инициализация Beads в репозитории
bd init --no-db

# 3. Импорт всей истории задач и воспоминаний
bd import -i .beads/issues.jsonl

# 4. Проверка статуса базы
bd status
bd list
```

Команда `bd status` отобразит текущую статистику задач репозитория, а `bd list` — список открытых и взятых в работу задач.

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

## 10. Управление задачами через Beads

Для просмотра и выполнения задач разработки используйте CLI Beads (`bd`):

```powershell
# Посмотреть все задачи и их статусы
bd list

# Посмотреть задачи, готовые к выполнению (без блокирующих зависимостей)
bd ready

# Посмотреть подробное описание и контекст конкретной задачи
bd show <issue-id>

# Взять задачу в работу
bd update <issue-id> --claim

# Закрыть задачу после реализации и прохождения тестов
bd close <issue-id>
```
