FROM node:24.21.0-bookworm AS deps

WORKDIR /app

ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_PROGRESS=false
ENV NPM_CONFIG_FETCH_RETRIES=5
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000
ENV NPM_CONFIG_FETCH_TIMEOUT=600000

COPY package*.json ./
RUN npm ci

FROM deps AS build

ENV NODE_OPTIONS=--max-old-space-size=4096

COPY nest-cli.json prisma.config.ts tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src

RUN npm run prisma:generate && npm run build
RUN npm prune --omit=dev

FROM node:24.21.0-bookworm AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Клиент PostgreSQL 16 из репозитория PGDG для резервных копий из админки: в bookworm по умолчанию
# версия 15, а pg_dump 15 не снимает копию с сервера postgres:16.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl curl \
  && install -d /usr/share/postgresql-common/pgdg \
  && curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends postgresql-client-16 \
  && rm -rf /var/lib/apt/lists/*

# Том с копиями монтируется сюда; Docker переносит владельца каталога в пустой именованный том.
RUN install -d -o node -g node /backups

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --chown=node:node package*.json ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod 755 /usr/local/bin/docker-entrypoint.sh

USER node

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=12 --start-period=30s \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start:prod"]
