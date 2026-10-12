# AI Template — развёртывание из образов Docker Hub

Ветка `prod_ready` содержит только то, что нужно для запуска из готовых образов: compose-файл,
пример `.env`, три скрипта для базы и эту инструкцию. Исходный код проекта лежит в `main`
(и в `prod`, это снимок `main` на момент публикации).

Образы публикуются в Docker Hub:

- `morro665065/ai-template-backend`
- `morro665065/ai-template-frontend`

Теги: `prod` (текущий релиз), `prod-<коммит>` (неизменяемая копия релиза),
`prod-YYYYMMDD` (предыдущий релиз, нужен для отката). Тег `latest` не публикуется.

Стек состоит из четырёх контейнеров: `frontend` (Nginx + React), `backend` (NestJS + Prisma),
`postgres` (база), `adminer` (просмотр базы). Данные живут в именованных томах Docker:
`ai_template_postgres_data` (база) и `ai_template_backups` (копии из админки).

Все команды ниже запускаются из каталога, где лежат `docker-compose.deploy.yml` и `.env.deploy`.

---

## Сценарий А. Новая установка

Нужны Docker Engine (или Docker Desktop) и Docker Compose v2: `docker compose version`.

1. Получите файлы ветки:

   ```bash
   git clone --branch prod_ready https://github.com/MichailLis/AI_Template.git
   cd AI_Template
   cp .env.deploy.example .env.deploy
   ```

2. Заполните `.env.deploy`. Обязательно замените:

   - `POSTGRES_PASSWORD` и тот же пароль внутри `DATABASE_URL`;
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (длинные случайные строки, например
     `openssl rand -hex 32`);
   - `CORS_ALLOWED_ORIGINS` — адрес, по которому откроют сайт, например `https://prof.example.ru`;
   - `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` — первый администратор;
   - `APP_HTTP_PORT` (на сервере обычно `80`) и, если нужен ИИ-анализ, `AI_API_KEY`.

   Ключ ИИ хранится только в `.env.deploy` на сервере, не в репозитории и не во frontend.

3. Запустите:

   ```bash
   docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
   docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d
   docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
   ```

   Через 1–2 минуты `postgres`, `backend`, `frontend` должны быть `healthy`. Миграции базы
   применяются сами при старте backend (`RUN_DB_MIGRATIONS=true`).

4. Проверьте:

   ```bash
   curl -f http://localhost:${APP_HTTP_PORT:-8080}/health
   ```

   Откройте `http://<адрес>/login` и войдите под `BOOTSTRAP_ADMIN_EMAIL` /
   `BOOTSTRAP_ADMIN_PASSWORD`. Adminer — на порту `ADMINER_PORT` (его лучше не открывать наружу).

5. После первого входа смените пароль администратора и уберите `BOOTSTRAP_ADMIN_PASSWORD` из
   `.env.deploy`.

---

## Сценарий Б. Обновление уже работающей установки

Обновление не удаляет данные: том базы не пересоздаётся, миграции только добавляют таблицы и
колонки. Тем не менее **всё начинается с копии базы**: без неё обновлять нельзя.

Команды `docker compose down -v`, удаление тома `ai_template_postgres_data` и смена
`POSTGRES_VOLUME_NAME` на новое имя уничтожают или «теряют» данные. В этой инструкции их нет, и
выполнять их не нужно.

### 1. Копия базы

```bash
sh scripts/backup-db.sh
```

Скрипт кладёт файл `db-backups/db-ГГГГММДД-ЧЧММСС.dump`, проверяет, что он читается, и печатает его
имя. Если он пишет «ОШИБКА», дальше не идите.

Скопируйте файл с сервера на другую машину (например, `scp`): том Docker живёт на том же диске, что
и база.

Заодно запишите число строк в таблицах, чтобы сравнить после обновления:

```bash
sh scripts/db-counts.sh > counts-before.txt
cat counts-before.txt
```

### 2. Новые файлы развёртывания

Если сервер стоит на `prod_ready` (или на `prod`), файлы `docker-compose.deploy.yml` и
`.env.deploy.example` в этих ветках одинаковые:

```bash
git fetch origin
git pull --ff-only origin "$(git rev-parse --abbrev-ref HEAD)"
```

Если `git pull` ругается на локальные изменения, остановитесь и не делайте `reset --hard`: ваш
`.env.deploy` в git не входит, а конфликт значит, что кто-то правил tracked-файлы на сервере.

Что изменилось в compose относительно прошлого релиза (правок в `.env.deploy` не требуется):

- добавлен том `ai_template_backups` с копиями базы из админки (создаётся сам);
- переменные ИИ называются `AI_*`. Старые `OPENROUTER_API_KEY` и `OPENROUTER_DEFAULT_MODEL`
  продолжают работать и передаются как раньше; таймауты `OPENROUTER_*_TIMEOUT*` больше не
  передаются, действуют значения по умолчанию (`AI_TIMEOUT_MS` и `AI_PROF_ORIENTATION_*`).

Новые необязательные переменные описаны в `.env.deploy.example`: `AI_*`, `BACKUP_*`,
`BACKUPS_VOLUME_NAME`. Пока их нет в `.env.deploy`, действуют значения по умолчанию.

### 3. Обновление

В `.env.deploy` должно быть `APP_IMAGE_TAG=prod`.

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --force-recreate backend frontend
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

База и Adminer не пересоздаются. При старте backend сам применяет новые миграции.

### 4. Проверка

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=60 backend | grep -i -E "migration|error"
curl -f http://localhost:${APP_HTTP_PORT:-8080}/health
sh scripts/db-counts.sh > counts-after.txt
diff counts-before.txt counts-after.txt
```

Ожидаемо:

- в логе «All migrations have been successfully applied»;
- `health` отвечает `200`;
- `diff` показывает только: новую таблицу `audit_events` (0 строк), увеличенное число
  применённых миграций (`_prisma_migrations`) и новую «последнюю миграцию». Число строк в
  остальных таблицах (пользователи, тесты, ссылки, прохождения, ответы) не меняется;
- одна осознанная правка данных: миграция `20260912000000` переводит в архив устаревшие
  опубликованные версии промптов (оставляет только самую новую у каждого промпта). Число версий
  не меняется, меняется их статус.

Затем в браузере: вход в админку, раздел аналитики, «Настройки → Резервные копии» (кнопка
«Создать копию»), публичная ссылка `/t/<код>`.

### 5. Откат, если что-то пошло не так

1. Верните прежние образы. В `.env.deploy` поставьте:

   ```env
   APP_IMAGE_TAG=prod-20260710
   ```

   (Это образы, которые работали до обновления. Тег `prod` уже указывает на новый релиз.)

2. Восстановите базу из копии, снятой на шаге 1:

   ```bash
   sh scripts/restore-db.sh db-backups/db-ГГГГММДД-ЧЧММСС.dump
   ```

   Скрипт просит ввести `RESTORE`, останавливает backend и frontend, пересоздаёт базу, заливает
   копию и запускает контейнеры заново. Данные, появившиеся после копии, пропадут.

3. Проверьте: `sh scripts/db-counts.sh | diff counts-before.txt -`.

---

## Полезное

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs -f backend frontend
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
docker compose --env-file .env.deploy -f docker-compose.deploy.yml down      # остановить, данные остаются
```

Резервные копии из админки («Настройки → Резервные копии») и их восстановление описаны в
`docs/deployment-dockerhub.md` основной ветки (раздел 11).

Порты: `APP_HTTP_PORT` открывает frontend (Nginx), `ADMINER_PORT` — Adminer. Backend слушает `3000`
только внутри сети Docker; чтобы сменить внешний порт, меняйте `APP_HTTP_PORT`, а не `PORT`.

Рядом с работающим стеком можно поднять отдельный для проверки: задайте в отдельном env-файле
другие `APP_HTTP_PORT`, `ADMINER_PORT`, `*_CONTAINER_NAME`, `POSTGRES_VOLUME_NAME`,
`BACKUPS_VOLUME_NAME` и запускайте с `--project-name <имя> --env-file <файл>`.
