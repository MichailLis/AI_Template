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

AI_PROVIDER=polza
AI_BASE_URL=
AI_API_KEY=
AI_DEFAULT_MODEL=
AI_TIMEOUT_MS=120000
AI_PROF_ORIENTATION_TIMEOUT_MS=90000
AI_PROF_ORIENTATION_TIMEOUT_RETRIES=2
OPENROUTER_HTTP_REFERER=https://YOUR_DOMAIN
OPENROUTER_APP_NAME=AI Template Admin

BACKUP_RETENTION_DAYS=14
BACKUP_MAX_COUNT=30
BACKUP_MAX_UPLOAD_MB=500
BACKUPS_VOLUME_NAME=ai_template_backups
```

Резервные копии базы делаются из админки («Настройки → Резервные копии») и лежат в томе
`BACKUPS_VOLUME_NAME` на этом же сервере. Регулярно скачивайте копию, чтобы она была и вне
сервера. Подробности — `docs/deployment-dockerhub.md`, разделы 11 и 12 (копирование на другую машину).

Заменить:

- `CHANGE_DB_PASSWORD`
- `CHANGE_ACCESS_SECRET`
- `CHANGE_REFRESH_SECRET`
- `https://YOUR_DOMAIN`
- `admin@example.com`
- `CHANGE_ADMIN_PASSWORD`

Если реальный `AI_API_KEY`, JWT secret или пароль уже попадал в логи,
`docker compose config` или чат, поверните его у провайдера перед повторным
использованием.

`CORS_ALLOWED_ORIGINS` должен перечислять реальные frontend origins через запятую.
Для production-like окружений сервер не стартует без этого значения или с
локальными placeholder-секретами.

Переменные провайдера ИИ (`AI_*`, `OPENROUTER_*`) должны оставаться backend-only и
совпадать с контрактом в `.env.deploy.example` и `docker-compose.deploy.yml`. Не добавляйте
`AI_API_KEY` в frontend env или Vite-переменные. Провайдер по умолчанию — Polza.ai;
OpenRouter или любой другой OpenAI-совместимый сервис подключается через `AI_PROVIDER` и
`AI_BASE_URL` (см. `AI_GUIDE.md`, «AI Provider Configuration»).

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
- Adminer доступен только с самого сервера (`127.0.0.1:8081`). С вашего компьютера откройте SSH-туннель:
  `ssh -L 8081:127.0.0.1:8081 user@SERVER_IP`, затем `http://localhost:8081`.

Логи контейнеров ротируются (`json-file`, `10m` × 5 файлов на сервис), а токены сессий и результатов
учеников (`/sessions/<токен>`, `/session/<токен>`, `/result/<токен>`) в access log nginx
(`docker compose logs frontend`) заменяются на `***`.

Вход в приложение:

- email: значение `BOOTSTRAP_ADMIN_EMAIL`
- password: значение `BOOTSTRAP_ADMIN_PASSWORD`

## 6. Обновить

Полная инструкция с откатом — `docs/deployment-dockerhub.md`, раздел 8 (и `README.md` ветки
`prod_ready`). Коротко:

1. Копия базы, обязательно до всего остального: `sh scripts/backup-db.sh` (скрипт есть в ветке
   `prod_ready`). Скачайте файл с сервера. Для сравнения: `sh scripts/db-counts.sh > counts-before.txt`.
2. Подтянуть файлы и образы:

   ```bash
   git fetch origin
   git pull --ff-only origin "$(git rev-parse --abbrev-ref HEAD)"
   docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
   docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --force-recreate backend frontend
   docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
   ```

3. Проверить: `curl -f http://localhost/health`, лог backend (`All migrations have been
successfully applied`), `sh scripts/db-counts.sh | diff counts-before.txt -`.
4. Откат: `APP_IMAGE_TAG=prod-YYYYMMDD` в `.env.deploy` и `sh scripts/restore-db.sh <файл копии>`.

Что будет с базой:

- `pull` и `up -d` не удаляют PostgreSQL volume.
- Данные удаляются только при `docker compose down -v`, ручном удалении volume или смене
  `POSTGRES_VOLUME_NAME` на пустой volume.
- Production backend при `RUN_DB_MIGRATIONS=true` выполняет `prisma migrate deploy`: только
  добавляет таблицы и колонки из `server/prisma/migrations`.
- Если серверная база была создана через `prisma db push` и не содержит таблицу
  `_prisma_migrations`, релиз со schema change может остановиться с `P3005`.
- Не считайте релиз безмиграционным по старой заметке: если менялся
  `server/prisma/schema.prisma`, в commit должна быть соответствующая migration.

Перед публикацией релиза со schema change проверьте локально:

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
