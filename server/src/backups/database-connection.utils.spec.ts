import { parsePgToolMajorVersion, toPgConnectionEnv } from './database-connection.utils';

describe('toPgConnectionEnv', () => {
  it('drops the Prisma-only schema parameter that libpq rejects', () => {
    expect(
      toPgConnectionEnv('postgresql://user:password@postgres:5432/my_app_db?schema=public'),
    ).toEqual({
      PGHOST: 'postgres',
      PGPORT: '5432',
      PGUSER: 'user',
      PGPASSWORD: 'password',
      PGDATABASE: 'my_app_db',
    });
  });

  it('decodes percent-encoded credentials and keeps sslmode', () => {
    expect(
      toPgConnectionEnv(
        'postgres://ai%40app:p%40ss%2Fword@db.example:6543/app%20db?sslmode=require',
      ),
    ).toEqual({
      PGHOST: 'db.example',
      PGPORT: '6543',
      PGUSER: 'ai@app',
      PGPASSWORD: 'p@ss/word',
      PGDATABASE: 'app db',
      PGSSLMODE: 'require',
    });
  });

  it('defaults the port', () => {
    expect(toPgConnectionEnv('postgresql://user:pw@localhost/db').PGPORT).toBe('5432');
  });

  it.each([
    ['', 'not a valid URL'],
    ['mysql://user:pw@localhost/db', 'postgresql:// scheme'],
    ['postgresql://user:pw@localhost/', 'name a database'],
  ])('rejects %p', (databaseUrl, message) => {
    expect(() => toPgConnectionEnv(databaseUrl)).toThrow(message);
  });
});

describe('parsePgToolMajorVersion', () => {
  it('reads the major version of a Debian build', () => {
    expect(parsePgToolMajorVersion('pg_dump (PostgreSQL) 16.4 (Debian 16.4-1.pgdg120+1)\n')).toBe(
      16,
    );
  });

  it('returns null for unexpected output', () => {
    expect(parsePgToolMajorVersion('command not found')).toBeNull();
  });
});
