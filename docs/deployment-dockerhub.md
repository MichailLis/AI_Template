# Развертывание через Docker Hub

Эта инструкция рассчитана на чистую Linux или Windows машину с установленным Docker.
Развертывание выполняется одной командой `docker compose`, но приложение использует
четыре контейнера:

- `ai_template_frontend` - Nginx + собранный React/Vite frontend.
- `ai_template_backend` - NestJS API + Prisma.
- `ai_template_postgres` - PostgreSQL.
- `ai_template_adminer` - Adminer для просмотра базы.

В Docker Hub публикуются два прикладных образа. Namespace и tag задаются через
`DOCKERHUB_NAMESPACE` и `APP_IMAGE_TAG` в `.env.deploy`:

- `${DOCKERHUB_NAMESPACE}/ai-template-frontend:${APP_IMAGE_TAG}`
- `${DOCKERHUB_NAMESPACE}/ai-template-backend:${APP_IMAGE_TAG}`

PostgreSQL и Adminer берутся из официальных Docker образов. Это правильная модель
Docker: один контейнер - один основной сервис, а единицей развертывания является
`docker-compose.deploy.yml`.

## 1. Требования

На целевой машине нужны:

- Docker Engine или Docker Desktop.
- Docker Compose v2, проверяется командой `docker compose version`.
- Доступ к Docker Hub для скачивания публичных или приватных образов.

На Windows используйте Docker Desktop в режиме Linux containers.

## 2. Получить файлы развертывания

На сервере должны быть минимум эти файлы из репозитория:

- `.env.deploy.example`
- `docker-compose.deploy.yml`

Если репозиторий уже склонирован:

```bash
git checkout prod
```

## 3. Создать env-файл

Linux/macOS:

```bash
cp .env.deploy.example .env.deploy
```

Windows PowerShell:

```powershell
Copy-Item .env.deploy.example .env.deploy
```

Заполните `.env.deploy`. Минимальный рабочий пример для опубликованных образов:

```env
DOCKERHUB_NAMESPACE=morro665065
APP_IMAGE_TAG=prod

APP_HTTP_PORT=8080
ADMINER_PORT=8081

POSTGRES_USER=ai_template
POSTGRES_PASSWORD=change-this-db-password
POSTGRES_DB=ai_template
DATABASE_URL=postgresql://ai_template:change-this-db-password@postgres:5432/ai_template?schema=public

JWT_ACCESS_SECRET=change-this-access-secret
JWT_REFRESH_SECRET=change-this-refresh-secret
CORS_ALLOWED_ORIGINS=https://your-domain.example

RUN_DB_MIGRATIONS=true

BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=change-this-admin-password
BOOTSTRAP_ADMIN_NAME=Administrator
BOOTSTRAP_ADMIN_RESET_PASSWORD=false

AI_PROVIDER=polza
AI_BASE_URL=
AI_API_KEY=
AI_DEFAULT_MODEL=
AI_TIMEOUT_MS=120000
AI_PROF_ORIENTATION_TIMEOUT_MS=90000
AI_PROF_ORIENTATION_TIMEOUT_RETRIES=2
OPENROUTER_HTTP_REFERER=https://your-domain.example
OPENROUTER_APP_NAME=AI Template Admin
```

Важно:

- `POSTGRES_PASSWORD` и пароль внутри `DATABASE_URL` должны совпадать.
- Значения `change-this-*` обязательно замените перед реальным продакшеном.
- `CORS_ALLOWED_ORIGINS` должен содержать реальные frontend origins через запятую.
  В production-like окружениях backend не стартует без этого значения.
- Переменные провайдера ИИ (`AI_*`, `OPENROUTER_*`) должны оставаться backend-only и
  совпадать с контрактом в `.env.deploy.example` и `docker-compose.deploy.yml`; не добавляйте
  `AI_API_KEY` в frontend env или Vite-переменные. Провайдер по умолчанию — Polza.ai, другой
  OpenAI-совместимый сервис подключается через `AI_PROVIDER` и `AI_BASE_URL`.
- Если реальный `AI_API_KEY`, JWT secret или пароль уже попадал в логи,
  `docker compose config` или чат, поверните его у провайдера перед повторным
  использованием.
- В образе нет захардкоженного админа. Первый админ создается только если заданы
  `BOOTSTRAP_ADMIN_EMAIL` и `BOOTSTRAP_ADMIN_PASSWORD`.
- Если пользователь с таким email уже существует, bootstrap только выдаст ему роль
  `ADMIN`. Пароль будет перезаписан только при `BOOTSTRAP_ADMIN_RESET_PASSWORD=true`.
- После первого входа пароль лучше сменить или убрать bootstrap-переменные из env.

## 4. Запустить стек

Linux/macOS:

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d
```

Windows PowerShell:

```powershell
docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d
```

Проверить контейнеры:

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

Ожидаемый результат:

- `ai_template_postgres` - healthy.
- `ai_template_backend` - healthy.
- `ai_template_frontend` - healthy.
- `ai_template_adminer` - running.

## 5. Проверить приложение

Откройте:

- Приложение: `http://localhost:8080`
- Логин: `http://localhost:8080/login`
- Adminer: `http://localhost:8081`
- OpenAPI JSON через Nginx: `http://localhost:8080/api/api-json`

Для входа в приложение используйте:

- Email: значение `BOOTSTRAP_ADMIN_EMAIL`
- Password: значение `BOOTSTRAP_ADMIN_PASSWORD`

Adminer использует не app-логин, а данные PostgreSQL:

- System: `PostgreSQL`
- Server: `postgres`
- Username: значение `POSTGRES_USER`
- Password: значение `POSTGRES_PASSWORD`
- Database: значение `POSTGRES_DB`

## 6. Проверка через curl

Linux/macOS:

```bash
curl -f http://localhost:8080/health
curl -f http://localhost:8080/api/api-json
```

Windows PowerShell:

```powershell
curl.exe -f http://localhost:8080/health
curl.exe -f http://localhost:8080/api/api-json
```

Проверка логина через API:

```bash
curl -i -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"change-this-admin-password"}'
```

На Windows PowerShell удобнее использовать одну строку:

```powershell
curl.exe -i -X POST http://localhost:8080/api/auth/signin -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"change-this-admin-password\"}"
```

Успешный ответ содержит `accessToken` и объект `user`. Refresh token не возвращается
в JSON: backend выставляет его как `HttpOnly` cookie `refreshToken`, поэтому в
`curl -i` проверяйте заголовок `Set-Cookie`.

## 7. Чистая проверка рядом с текущей установкой

Если на машине уже есть старый стек или старая база, можно проверить новый deploy
изолированно, не удаляя существующие данные. Создайте `.env.deploy.clean`:

```env
DOCKERHUB_NAMESPACE=morro665065
APP_IMAGE_TAG=prod

APP_HTTP_PORT=18080
ADMINER_PORT=18081

POSTGRES_CONTAINER_NAME=ai_template_clean_postgres
ADMINER_CONTAINER_NAME=ai_template_clean_adminer
BACKEND_CONTAINER_NAME=ai_template_clean_backend
FRONTEND_CONTAINER_NAME=ai_template_clean_frontend
POSTGRES_VOLUME_NAME=ai_template_clean_postgres_data

POSTGRES_USER=clean_user
POSTGRES_PASSWORD=clean_password
POSTGRES_DB=clean_db
DATABASE_URL=postgresql://clean_user:clean_password@postgres:5432/clean_db?schema=public

JWT_ACCESS_SECRET=change-this-access-secret
JWT_REFRESH_SECRET=change-this-refresh-secret
CORS_ALLOWED_ORIGINS=http://127.0.0.1:18080
RUN_DB_MIGRATIONS=true

BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=change-this-admin-password
BOOTSTRAP_ADMIN_NAME=Administrator
BOOTSTRAP_ADMIN_RESET_PASSWORD=false

AI_PROVIDER=polza
AI_BASE_URL=
AI_API_KEY=
AI_DEFAULT_MODEL=
AI_TIMEOUT_MS=120000
AI_PROF_ORIENTATION_TIMEOUT_MS=90000
AI_PROF_ORIENTATION_TIMEOUT_RETRIES=2
OPENROUTER_HTTP_REFERER=http://127.0.0.1:18080
OPENROUTER_APP_NAME=AI Template Admin
```

Запуск:

```bash
docker compose --project-name ai_template_clean --env-file .env.deploy.clean -f docker-compose.deploy.yml up -d --pull always
```

Проверка:

- App: `http://localhost:18080`
- Login: `http://localhost:18080/login`
- Adminer: `http://localhost:18081`

## 8. Обновление контейнеров на сервере

Все файлы для развёртывания из образов (compose, пример `.env`, скрипты копии и отката) лежат в
ветке `prod_ready`; в `prod` те же `docker-compose.deploy.yml` и `.env.deploy.example`. Пошаговая
инструкция для сервера с командами «копия базы → обновление → проверка → откат» — в `README.md`
ветки `prod_ready`. Ниже то же самое в сокращении. Порядок проверен на отдельном стеке: поднят
предыдущий релиз с данными (300+ прохождений, пользователи, тесты, промпты), затем выполнено
обновление; число строк во всех таблицах и их идентификаторы совпали до и после, откат из копии
вернул исходное состояние.

Что делает обновление с базой: `pull` и `up -d` не трогают том PostgreSQL; backend при старте
выполняет `prisma migrate deploy`, то есть только добавляет таблицы и колонки из
`server/prisma/migrations`. Единственная правка существующих данных в последних релизах —
миграция `20260912000000`, которая переводит устаревшие опубликованные версии промптов в архив.

1. **Копия базы. Без неё не обновлять.**

   ```bash
   sh scripts/backup-db.sh          # db-backups/db-ГГГГММДД-ЧЧММСС.dump, проверяется на читаемость
   sh scripts/db-counts.sh > counts-before.txt
   ```

   Скопируйте `.dump` на другую машину. Без скриптов: `pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"`
   внутри контейнера `postgres` (формат custom, читается `pg_restore`).

2. **Новые файлы развёртывания и образы.**

   ```bash
   git fetch origin
   git pull --ff-only origin "$(git rev-parse --abbrev-ref HEAD)"
   docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
   docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --force-recreate backend frontend
   docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
   ```

   В `.env.deploy` должно быть `DOCKERHUB_NAMESPACE=morro665065` и `APP_IMAGE_TAG=prod`.
   Старые переменные `OPENROUTER_API_KEY` и `OPENROUTER_DEFAULT_MODEL` продолжают работать;
   `OPENROUTER_*_TIMEOUT*` больше не передаются в контейнер (действуют `AI_TIMEOUT_MS` и
   `AI_PROF_ORIENTATION_*`).

3. **Проверка.**

   ```bash
   docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=60 backend
   curl -f http://localhost:${APP_HTTP_PORT:-8080}/health
   sh scripts/db-counts.sh > counts-after.txt && diff counts-before.txt counts-after.txt
   ```

   В логе должно быть «All migrations have been successfully applied». В `diff` допустимо только:
   новая таблица `audit_events` с 0 строк и новые записи в `_prisma_migrations`. Затем зайдите в
   админку, аналитику, «Настройки → Резервные копии» и откройте публичную ссылку `/t/<код>`.

4. **Откат.** Верните в `.env.deploy` предыдущий неизменяемый тег (`APP_IMAGE_TAG=prod-YYYYMMDD`,
   см. раздел 9) и восстановите базу из копии шага 1:

   ```bash
   sh scripts/restore-db.sh db-backups/db-ГГГГММДД-ЧЧММСС.dump   # попросит ввести RESTORE
   ```

   Скрипт останавливает backend и frontend, пересоздаёт базу (`DROP DATABASE ... WITH (FORCE)` +
   `CREATE DATABASE`), заливает копию и запускает контейнеры заново. Не используйте
   `pg_restore --clean` поверх базы с более новой схемой: таблицы новых миграций остаются в базе и
   мешают удалению старых.

## 9. Сборка и публикация своих образов

Схема тегов в Docker Hub: `prod` (текущий релиз, его тянет сервер), `prod-<короткий коммит>`
(неизменяемая копия того же релиза) и `prod-YYYYMMDD` (предыдущий релиз, сохраняется перед
перезаписью `prod`, чтобы было куда откатываться). Перед публикацией нового `prod` сохраните
старый образ:

```bash
docker buildx imagetools create -t your-dockerhub/ai-template-backend:prod-YYYYMMDD your-dockerhub/ai-template-backend:prod
docker buildx imagetools create -t your-dockerhub/ai-template-frontend:prod-YYYYMMDD your-dockerhub/ai-template-frontend:prod
```

Если нужно опубликовать образы в свой Docker Hub namespace:

```bash
docker login
docker compose --env-file .env.deploy -f docker-compose.build.yml build
docker compose --env-file .env.deploy -f docker-compose.build.yml push
```

Для multi-arch публикации:

Frontend Dockerfile запускает `build:production`: строгая проверка всего runtime-кода и
Vite-конфига, затем production bundle. Контекст сборки остаётся `client`; исходные
`*.test.*` / `*.spec.*` исключены только из этой проверки, так как тестовые fixtures
находятся в корневом `template/`. Обычный `npm run build --prefix client` и CI продолжают
проверять все исходные тесты; перед публикацией обязателен `npm run verify:template`.

```bash
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 -f server/Dockerfile -t your-dockerhub/ai-template-backend:prod --push server
docker buildx build --platform linux/amd64,linux/arm64 -f client/Dockerfile -t your-dockerhub/ai-template-frontend:prod --push client
```

Перед `push` проверьте тот самый образ, который уйдёт в Docker Hub (проверка через API не
заменяет браузер):

1. Соберите frontend. На Windows в Git Bash не передавайте `--build-arg VITE_API_URL=/api`:
   оболочка превращает `/api` в `C:/Program Files/Git/api` (так был сломан релиз `prod-a508aa8`).
   Либо не задавайте аргумент (по умолчанию `/api`), либо `MSYS_NO_PATHCONV=1 docker build ...`.
   Dockerfile сам падает, если `VITE_API_URL` не начинается с `/` или `http(s)://`, или если в
   бандле нашёлся путь вида `C:/Program Files`.
2. Бандл: `docker run --rm --entrypoint sh <образ> -c 'grep -rl "Program Files" /usr/share/nginx/html'`
   ничего не печатает.
3. Поднимите отдельный стек из этих образов (раздел 7, другие порты и тома) и войдите в админку в
   браузере: логин и пароль вводятся в форму, открывается `/admin/tests`. Если браузерный вход не
   удался по любой причине, образ не публикуется.

## 10. Важное про существующую базу и миграции

`docker compose pull` и `up -d` не удаляют PostgreSQL volume. Данные сохраняются в
volume `POSTGRES_VOLUME_NAME` или, по умолчанию, `ai_template_postgres_data`.
Опасные команды для данных: `docker compose down -v`, ручное удаление volume и
пересоздание стека с другим `POSTGRES_VOLUME_NAME`.

При старте production backend выполняет:

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

если `RUN_DB_MIGRATIONS=true`. Это применяет только миграции из `server/prisma/migrations`
и не делает destructive reset.

На чистой базе backend применяет Prisma migrations автоматически.

Перед сборкой и публикацией релиза, в котором менялся `server/prisma/schema.prisma`,
обязательно проверьте, что в репозитории есть соответствующая миграция:

```bash
npm run verify:prisma-migrations
```

Для дополнительной чистой проверки можно поднять временный пустой PostgreSQL и
прогнать:

```bash
cd server
npx prisma migrate deploy --schema prisma/schema.prisma
```

После изменения или добавления миграций production Docker images нужно пересобрать
и опубликовать заново, а затем обновлять сервер только на commit, содержащий эту
миграцию.

Если подключить старую непустую базу, созданную через `prisma db push`, Prisma может
остановиться с ошибкой `P3005`, потому что в базе нет истории миграций. Для такой базы
нужна отдельная стратегия:

- сделать backup;
- зафиксировать baseline миграцию через Prisma;
- либо перенести данные в новую базу, созданную через migrations.

Не удаляйте volume с продакшен-данными без backup.

Перед релизами со schema change также проверяйте историю миграций на целевой базе:

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml exec postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT migration_name, finished_at FROM \"_prisma_migrations\" ORDER BY finished_at DESC LIMIT 5;"'
```

Не полагайтесь на старые заметки вида "текущий релиз не меняет schema": за последние
итерации в проект добавлялись миграции для режимов входа, Polus/public template,
аналитических индексов, case-insensitive identity и `publicBranding`.

## 11. Резервные копии из админки

В админке есть раздел «Настройки → Резервные копии». Кнопка «Создать копию» запускает
`pg_dump` внутри контейнера backend и сохраняет полную копию базы в формате PostgreSQL
custom (`.dump`). Копию можно скачать: браузер получает одноразовую ссылку, которая
действует минуту.

Что нужно на сервере:

- Образ backend содержит `postgresql-client-16`. Если PostgreSQL в стеке когда-нибудь
  обновится до новой мажорной версии, обновите и клиент в `server/Dockerfile`: старый
  `pg_dump` не снимает копию с более нового сервера, и раздел покажет причину.
- Копии лежат в томе `BACKUPS_VOLUME_NAME` (по умолчанию `ai_template_backups`),
  смонтированном в `/backups`. Том живет на той же машине, что и база, поэтому от потери
  диска он не защищает: регулярно скачивайте свежую копию.
- Расписание: по умолчанию копия создается раз в сутки в 03:00 UTC. Час, выключение
  расписания, срок хранения и число копий меняются в том же разделе админки и сохраняются
  в томе (`/backups/settings.json`), поэтому восстановление базы их не откатывает.
  Пропущенный из-за простоя запуск выполняется в течение десяти минут после старта backend.
- Хранение: пока настройки не сохранены в админке, действуют `BACKUP_RETENTION_DAYS`
  (по умолчанию 14 дней) и `BACKUP_MAX_COUNT` (по умолчанию 30 копий). Старые копии
  удаляются после каждой новой; последняя успешная копия не удаляется никогда.
- Место на диске: вкладка показывает, сколько свободно, сколько занимают копии и сколько весит
  база, и предупреждает, когда свободного места меньше, чем на три копии. Копия не начинается,
  если свободного места меньше размера базы; пропущенная по этой причине плановая копия
  появляется в списке со статусом «Ошибка» и причиной и не повторяется до следующего дня.
  Восстановление не начинается, если места не хватит на вторую базу и копию текущей.
- Все действия с копиями записываются в журнал изменений.

Восстановление из админки: у готовой копии кнопка «Восстановить», подтверждение словом
`RESTORE`. Порядок действий сервера:

1. Сохраняет копию текущей базы (в списке она помечена «Перед восстановлением»).
2. Включает режим обслуживания: API отвечает 503 примерно минуту.
3. Разворачивает копию во временной базе `<POSTGRES_DB>_restore` и проверяет ее: схема не
   новее приложения (более старая догоняется `prisma migrate deploy`), есть активный
   администратор. Если проверка не прошла, рабочая база не меняется.
4. Меняет базы местами переименованием. Прежняя база остается под именем
   `<POSTGRES_DB>_before_<время>`, и кнопка «Отменить восстановление» возвращает ее
   (изменения, сделанные после восстановления, при этом пропадают). Хранится одна прежняя база.
5. Сбрасывает все сессии: после восстановления все пользователи входят заново.

Для этого пользователь `POSTGRES_USER` должен иметь право создавать и переименовывать базы;
в официальном образе PostgreSQL он суперпользователь. Пока прежняя база хранится, место на
диске под базу нужно примерно вдвое.

Импорт: кнопка «Загрузить копию» принимает файл `.dump` (формат custom, как у скачанных
копий или `pg_dump -Fc`). Сервер проверяет подпись файла и читает оглавление через
`pg_restore --list`, после чего файл появляется в списке с пометкой «Загружена». Восстановить
базу из него можно той же кнопкой «Восстановить», со всеми проверками выше. Загруженные копии
не удаляются ротацией. Лимит размера — `BACKUP_MAX_UPLOAD_MB` (по умолчанию 500 МБ); если
поднимаете его выше, увеличьте и `client_max_body_size` для `/api/admin/backups/import` в
`client/nginx/default.conf` и пересоберите образ frontend. Дамп может содержать любой SQL и
восстанавливается с правами владельца базы, поэтому загружайте только свои файлы.

Восстановить скачанную копию вручную:

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml stop backend
docker compose --env-file .env.deploy -f docker-compose.deploy.yml exec -T postgres \
  sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-acl --single-transaction' \
  < backup-YYYYMMDDTHHMMSSZ-xxxxxx.dump
docker compose --env-file .env.deploy -f docker-compose.deploy.yml start backend
```

Восстановление перезаписывает текущие данные. Перед ним создайте свежую копию.
