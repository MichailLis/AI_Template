#!/bin/sh
set -eu

if [ "${RUN_DB_MIGRATIONS:-true}" = "true" ]; then
  npx prisma migrate deploy --schema prisma/schema.prisma
fi

node dist/scripts/bootstrap-admin.js

exec "$@"
