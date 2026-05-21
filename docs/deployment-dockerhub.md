# Развертывание через Docker Hub

Эта инструкция рассчитана на чистую Linux или Windows машину с установленным Docker.
Развертывание выполняется одной командой `docker compose`, но приложение использует
четыре контейнера:

- `ai_template_frontend` - Nginx + собранный React/Vite frontend.
- `ai_template_backend` - NestJS API + Prisma.
- `ai_template_postgres` - PostgreSQL.
- `ai_template_adminer` - Adminer для просмотра базы.

В Docker Hub публикуются два прикладных образа:

- `morro665065/ai-template-frontend:prod`
- `morro665065/ai-template-backend:prod`

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

OPENROUTER_API_KEY=
OPENROUTER_DEFAULT_MODEL=
OPENROUTER_HTTP_REFERER=https://your-domain.example
OPENROUTER_APP_NAME=AI Template Admin
OPENROUTER_TIMEOUT_MS=120000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS=180000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES=1
```

Важно:

- `POSTGRES_PASSWORD` и пароль внутри `DATABASE_URL` должны совпадать.
- Значения `change-this-*` обязательно замените перед реальным продакшеном.
- `CORS_ALLOWED_ORIGINS` должен содержать реальные frontend origins через запятую.
  В production-like окружениях backend не стартует без этого значения.
- Если реальный `OPENROUTER_API_KEY`, JWT secret или пароль уже попадал в логи,
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

Успешный ответ содержит `accessToken`, `refreshToken` и объект `user`.

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

OPENROUTER_API_KEY=
OPENROUTER_DEFAULT_MODEL=
OPENROUTER_HTTP_REFERER=http://127.0.0.1:18080
OPENROUTER_APP_NAME=AI Template Admin
OPENROUTER_TIMEOUT_MS=120000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS=180000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES=1
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

Перед обновлением проверьте, что `.env.deploy` указывает на нужные образы:

```env
DOCKERHUB_NAMESPACE=morro665065
APP_IMAGE_TAG=prod
```

Если сервер использует git checkout с deploy-файлами, сначала подтяните актуальные
`docker-compose.deploy.yml` и `.env.deploy.example`:

```bash
git fetch origin
git checkout prod
git pull --ff-only origin prod
```

Сделайте резервную копию базы перед обновлением, если данные важны:

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "backup-$(date +%Y%m%d-%H%M%S).sql"
```

Затем подтяните новые образы и пересоздайте только изменившиеся контейнеры:

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --force-recreate backend frontend
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

Проверьте HTTP и логи backend:

```bash
curl -f http://localhost:${APP_HTTP_PORT:-8080}/health
curl -f http://localhost:${APP_HTTP_PORT:-8080}/api/api-json
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 backend
```

Для отката укажите предыдущий `APP_IMAGE_TAG` и снова выполните `pull` + `up -d`.
Если используется переиспользуемый tag `prod`, откат возможен только если предыдущий
образ дополнительно опубликован под отдельным immutable tag.

## 9. Сборка и публикация своих образов

Если нужно опубликовать образы в свой Docker Hub namespace:

```bash
docker login
docker compose --env-file .env.deploy -f docker-compose.build.yml build
docker compose --env-file .env.deploy -f docker-compose.build.yml push
```

Для multi-arch публикации:

```bash
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 -f server/Dockerfile -t your-dockerhub/ai-template-backend:prod --push server
docker buildx build --platform linux/amd64,linux/arm64 -f client/Dockerfile -t your-dockerhub/ai-template-frontend:prod --push client
```

## 10. Важное про существующую базу

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

Если подключить старую непустую базу, созданную через `prisma db push`, Prisma может
остановиться с ошибкой `P3005`, потому что в базе нет истории миграций. Для такой базы
нужна отдельная стратегия:

- сделать backup;
- зафиксировать baseline миграцию через Prisma;
- либо перенести данные в новую базу, созданную через migrations.

Не удаляйте volume с продакшен-данными без backup.

Перед будущими релизами со schema change проверяйте наличие истории миграций:

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml exec postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT migration_name, finished_at FROM \"_prisma_migrations\" ORDER BY finished_at DESC LIMIT 5;"'
```

Текущий релиз меняет поведение анализа и UI, но не меняет `schema.prisma`, поэтому
новых таблиц/колонок и миграций для серверной БД не добавляет.
