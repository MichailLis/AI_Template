#!/bin/sh
# Снимает полную копию базы (pg_dump, формат custom) в файл и проверяет, что файл читается.
# Запуск из каталога с docker-compose.deploy.yml:  sh scripts/backup-db.sh [каталог]
# Файл окружения и compose-файл можно заменить: ENV_FILE=... COMPOSE_FILE=... sh scripts/backup-db.sh
set -eu

ENV_FILE="${ENV_FILE:-.env.deploy}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.deploy.yml}"
OUT_DIR="${1:-./db-backups}"
DC="docker compose --env-file $ENV_FILE -f $COMPOSE_FILE"

mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/db-$(date +%Y%m%d-%H%M%S).dump"

if ! $DC exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > "$FILE"; then
  rm -f "$FILE"
  echo "ОШИБКА: pg_dump не выполнился, копия не создана. Обновлять нельзя." >&2
  exit 1
fi

if [ ! -s "$FILE" ] || ! $DC exec -T postgres pg_restore --list < "$FILE" > /dev/null; then
  echo "ОШИБКА: файл $FILE пуст или не читается. Обновлять нельзя." >&2
  exit 1
fi

echo "Копия готова и читается: $FILE ($(wc -c < "$FILE") байт)"
echo "Скопируйте ее с сервера на другую машину, прежде чем обновлять."
