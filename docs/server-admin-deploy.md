# Инструкция развертывания

## 1. Подготовить сервер

Установить Docker и Docker Compose v2.

Проверить:

```bash
docker --version
docker compose version
```

## 2. Получить файлы

На сервере нужны файлы:

- `docker-compose.deploy.yml`
- `.env.deploy.example`

Если используется git:

```bash
git clone <repo-url>
cd AI_Template
git checkout prod
```

## 3. Создать `.env.deploy`

Linux:

```bash
cp .env.deploy.example .env.deploy
```

Windows PowerShell:

```powershell
Copy-Item .env.deploy.example .env.deploy
```

Заполнить `.env.deploy`:

```env
DOCKERHUB_NAMESPACE=morro665065
APP_IMAGE_TAG=prod

APP_HTTP_PORT=80
ADMINER_PORT=8081

POSTGRES_USER=ai_template
POSTGRES_PASSWORD=CHANGE_DB_PASSWORD
POSTGRES_DB=ai_template
DATABASE_URL=postgresql://ai_template:CHANGE_DB_PASSWORD@postgres:5432/ai_template?schema=public

JWT_ACCESS_SECRET=CHANGE_ACCESS_SECRET
JWT_REFRESH_SECRET=CHANGE_REFRESH_SECRET
CORS_ALLOWED_ORIGINS=https://YOUR_DOMAIN

RUN_DB_MIGRATIONS=true

BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=CHANGE_ADMIN_PASSWORD
BOOTSTRAP_ADMIN_NAME=Administrator
BOOTSTRAP_ADMIN_RESET_PASSWORD=false

OPENROUTER_API_KEY=
OPENROUTER_DEFAULT_MODEL=
OPENROUTER_HTTP_REFERER=https://YOUR_DOMAIN
OPENROUTER_APP_NAME=AI Template Admin
OPENROUTER_TIMEOUT_MS=120000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS=180000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES=1
```

Заменить:

- `CHANGE_DB_PASSWORD`
- `CHANGE_ACCESS_SECRET`
- `CHANGE_REFRESH_SECRET`
- `https://YOUR_DOMAIN`
- `admin@example.com`
- `CHANGE_ADMIN_PASSWORD`

Если реальный `OPENROUTER_API_KEY`, JWT secret или пароль уже попадал в логи,
`docker compose config` или чат, поверните его у провайдера перед повторным
использованием.

`CORS_ALLOWED_ORIGINS` должен перечислять реальные frontend origins через запятую.
Для production-like окружений сервер не стартует без этого значения или с
локальными placeholder-секретами.

OpenRouter-переменные должны оставаться backend-only и совпадать с контрактом в
`.env.deploy.example` и `docker-compose.deploy.yml`. Не добавляйте
`OPENROUTER_API_KEY` в frontend env или Vite-переменные.

## 4. Запустить

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d
```

## 5. Проверить

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

Должны быть запущены:

- `ai_template_frontend`
- `ai_template_backend`
- `ai_template_postgres`
- `ai_template_adminer`

Проверить HTTP:

```bash
curl -f http://localhost/health
curl -f http://localhost/api/api-json
```

Открыть в браузере:

- Приложение: `http://SERVER_IP/`
- Логин: `http://SERVER_IP/login`
- Adminer: `http://SERVER_IP:8081`

Вход в приложение:

- email: значение `BOOTSTRAP_ADMIN_EMAIL`
- password: значение `BOOTSTRAP_ADMIN_PASSWORD`

## 6. Обновить

Перед обновлением, если данные важны, сделать backup:

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "backup-$(date +%Y%m%d-%H%M%S).sql"
```

Подтянуть свежие deploy-файлы и образы:

```bash
git fetch origin
git checkout prod
git pull --ff-only origin prod
docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --force-recreate backend frontend
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

Проверить:

```bash
curl -f http://localhost/health
curl -f http://localhost/api/api-json
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 backend
```

Что будет с базой:

- `pull` и `up -d` не удаляют PostgreSQL volume.
- Данные удаляются только при `docker compose down -v`, ручном удалении volume или смене
  `POSTGRES_VOLUME_NAME` на пустой volume.
- Production backend при `RUN_DB_MIGRATIONS=true` выполняет `prisma migrate deploy`.
- Если серверная база была создана через `prisma db push` и не содержит таблицу
  `_prisma_migrations`, будущий релиз со schema change может остановиться с `P3005`.
- Не считайте релиз безмиграционным по старой заметке: если менялся
  `server/prisma/schema.prisma`, в commit должна быть соответствующая migration.

Перед обновлением релиза со schema change проверьте локально:

```bash
npm run verify:prisma-migrations
```

Для чистой проверки применимости миграций используйте временную пустую PostgreSQL
базу и команду из директории `server/`:
`npx prisma migrate deploy --schema prisma/schema.prisma`. После
добавления/изменения миграций пересоберите и заново опубликуйте production images.

## 7. Остановить

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml down
```
