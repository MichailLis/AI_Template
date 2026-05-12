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

Перед обновлением, если данные важны, сделать backup:

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "backup-$(date +%Y%m%d-%H%M%S).sql"
```

Подтянуть свежие deploy-файлы и образы:

```bash
git fetch origin
git checkout prod_ready
git pull --ff-only origin prod_ready
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
- Текущий релиз не меняет `schema.prisma`, поэтому новых миграций для БД не добавляет.

## 7. Остановить

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml down
```
