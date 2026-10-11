# Образ backend для локального docker-compose.yml: тот же Node, что и в server/Dockerfile, плюс
# pg_dump для резервных копий из админки. Исходники монтируются в /app, здесь только окружение.
FROM node:24.21.0-bookworm

# Клиент PostgreSQL 16 из репозитория PGDG: в bookworm по умолчанию 15, а pg_dump 15 не снимает
# копию с сервера postgres:16.
RUN install -d /usr/share/postgresql-common/pgdg \
  && curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends postgresql-client-16 \
  && rm -rf /var/lib/apt/lists/* \
  && install -d /backups
