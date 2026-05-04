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

RUN_DB_MIGRATIONS=true

BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=CHANGE_ADMIN_PASSWORD
BOOTSTRAP_ADMIN_NAME=Administrator
BOOTSTRAP_ADMIN_RESET_PASSWORD=false

OPENROUTER_API_KEY=
OPENROUTER_DEFAULT_MODEL=
OPENROUTER_HTTP_REFERER=
OPENROUTER_APP_NAME=AI Template Admin
```

Заменить:

- `CHANGE_DB_PASSWORD`
- `CHANGE_ACCESS_SECRET`
- `CHANGE_REFRESH_SECRET`
- `admin@example.com`
- `CHANGE_ADMIN_PASSWORD`

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

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d
```

## 7. Остановить

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml down
```
