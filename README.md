# Развертывание

## 1. Подготовить сервер

Установить Docker и Docker Compose v2.

Проверить:

```bash
docker --version
docker compose version
```

## 2. Получить файлы

```bash
git clone -b prod_ready --single-branch <repo-url>
cd AI_Template
```

## 3. Создать env-файл

Linux:

```bash
cp .env.deploy.example .env.deploy
```

Windows PowerShell:

```powershell
Copy-Item .env.deploy.example .env.deploy
```

В файле `.env.deploy` заменить:

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
curl -f http://localhost/health
curl -f http://localhost/api/api-json
```

Открыть:

- приложение: `http://SERVER_IP/`
- логин: `http://SERVER_IP/login`
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
