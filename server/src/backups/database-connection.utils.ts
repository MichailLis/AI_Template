/**
 * Переменные окружения libpq для `pg_dump`. `DATABASE_URL` нельзя передать как есть: Prisma
 * держит в нем `?schema=public`, а libpq отклоняет неизвестные параметры URI. Пароль уходит
 * через `PGPASSWORD`, а не в аргументах, чтобы не попасть в список процессов.
 */
export const toPgConnectionEnv = (databaseUrl: string): Record<string, string> => {
  let url: URL;

  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL');
  }

  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL must use the postgresql:// scheme');
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));

  if (!database) {
    throw new Error('DATABASE_URL must name a database');
  }

  const env: Record<string, string> = {
    PGHOST: url.hostname || 'localhost',
    PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: database,
  };

  const sslMode = url.searchParams.get('sslmode');

  if (sslMode) {
    env.PGSSLMODE = sslMode;
  }

  return env;
};

/** Мажорная версия из вывода `pg_dump --version`: «pg_dump (PostgreSQL) 16.4 (Debian ...)». */
export const parsePgToolMajorVersion = (versionOutput: string): number | null => {
  const match = /\(PostgreSQL\)\s+(\d+)/.exec(versionOutput);

  return match ? Number(match[1]) : null;
};
