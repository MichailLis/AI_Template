#!/bin/sh
# Откат: пересоздаёт базу и заливает в неё копию, снятую scripts/backup-db.sh.
# Все данные, появившиеся после копии, пропадут.
# Перед запуском верните в .env.deploy прежний APP_IMAGE_TAG (см. README, «Откат»).
# Запуск:  sh scripts/restore-db.sh db-backups/db-YYYYMMDD-HHMMSS.dump
set -eu

ENV_FILE="${ENV_FILE:-.env.deploy}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.deploy.yml}"
DC="docker compose --env-file $ENV_FILE -f $COMPOSE_FILE"
FILE="${1:?Укажите файл копии: sh scripts/restore-db.sh db-backups/db-....dump}"

[ -s "$FILE" ] || { echo "Файл $FILE не найден или пуст." >&2; exit 1; }
$DC exec -T postgres pg_restore --list < "$FILE" > /dev/null || { echo "Файл $FILE не читается как копия PostgreSQL." >&2; exit 1; }

printf 'База будет удалена и заменена копией %s. Для подтверждения введите RESTORE: ' "$FILE"
read -r answer
[ "$answer" = "RESTORE" ] || { echo "Отменено."; exit 1; }

$DC stop backend frontend
$DC exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE \"$POSTGRES_DB\" WITH (FORCE)" -c "CREATE DATABASE \"$POSTGRES_DB\""'
$DC exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl --exit-on-error' < "$FILE"
echo "База восстановлена из $FILE."

$DC up -d --force-recreate backend frontend
echo "Backend и frontend запущены. Проверьте: sh scripts/db-counts.sh"
