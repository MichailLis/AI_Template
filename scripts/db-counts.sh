#!/bin/sh
# Печатает число строк в каждой таблице и последнюю применённую миграцию.
# Запустите до обновления и после, результаты должны совпасть (новые таблицы могут добавиться).
# Запуск:  sh scripts/db-counts.sh > counts-before.txt
set -eu

ENV_FILE="${ENV_FILE:-.env.deploy}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.deploy.yml}"
DC="docker compose --env-file $ENV_FILE -f $COMPOSE_FILE"

$DC exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -F " | "' <<'SQL'
SELECT table_name,
       (xpath('/row/c/text()',
              query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name),
                           false, true, '')))[1]::text AS rows
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
SELECT 'последняя миграция', migration_name
FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1;
SQL
