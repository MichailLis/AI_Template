import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const rootDir = process.cwd();
const serverDir = join(rootDir, 'server');
const schemaPath = join(serverDir, 'prisma', 'schema.prisma');
const migrationsDir = join(serverDir, 'prisma', 'migrations');
const serverRequire = createRequire(join(serverDir, 'package.json'));

const fail = (message, output = '') => {
  console.error('Prisma migration verification failed.');
  console.error(message);

  if (output.trim()) {
    console.error(output.trim());
  }

  process.exit(1);
};

const readServerEnvValue = (name) => {
  if (process.env[name]) {
    return process.env[name];
  }

  const envPath = join(serverDir, '.env');
  if (!existsSync(envPath)) {
    return undefined;
  }

  const envFile = readFileSync(envPath, 'utf8');
  const match = envFile.match(new RegExp(`^${name}\\s*=\\s*(.*)$`, 'm'));
  const rawValue = match?.[1]?.trim();

  if (!rawValue) {
    return undefined;
  }

  return rawValue.replace(/^["']|["']$/g, '');
};

const quoteIdentifier = (value) => `"${value.replaceAll('"', '""')}"`;

const createVerificationError = (message, output = '') =>
  new Error(output.trim() ? `${message}\n${output.trim()}` : message);

const isLocalDatabaseHost = (databaseUrl) => {
  const parsedUrl = new URL(databaseUrl);

  return ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname);
};

const buildShadowDatabaseName = (databaseUrl) => {
  const parsedUrl = new URL(databaseUrl);
  const sourceName = decodeURIComponent(parsedUrl.pathname.replace(/^\//, '')) || 'app';
  const normalizedSourceName = sourceName.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 28);
  const suffix = `shadow_${process.pid}_${Date.now()}`;

  return `${normalizedSourceName}_${suffix}`.slice(0, 63);
};

const buildDatabaseUrlWithName = (databaseUrl, databaseName, { keepSearch }) => {
  const parsedUrl = new URL(databaseUrl);
  parsedUrl.pathname = `/${encodeURIComponent(databaseName)}`;

  if (!keepSearch) {
    parsedUrl.search = '';
  }

  return parsedUrl.toString();
};

const runDockerPostgresAdminSql = (sql) => {
  const result = spawnSync(
    'docker',
    [
      'exec',
      process.env['PRISMA_MIGRATION_SHADOW_DOCKER_CONTAINER'] ?? 'ai_template_postgres',
      'psql',
      '-U',
      process.env['PRISMA_MIGRATION_SHADOW_DOCKER_USER'] ?? 'ai_template',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      sql,
    ],
    {
      cwd: rootDir,
      encoding: 'utf8',
    },
  );
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;

  if (result.error) {
    throw createVerificationError(result.error.message, output);
  }

  if (result.status !== 0) {
    throw createVerificationError('docker postgres admin command failed.', output);
  }
};

const createTemporaryShadowDatabase = async (databaseUrl) => {
  if (!isLocalDatabaseHost(databaseUrl)) {
    fail(
      'Set SHADOW_DATABASE_URL to a disposable database before running migration drift verification against a non-local DATABASE_URL.',
    );
  }

  const { Client } = serverRequire('pg');
  const sourceUrl = new URL(databaseUrl);
  const databaseOwner = decodeURIComponent(sourceUrl.username);
  const shadowDatabaseName = buildShadowDatabaseName(databaseUrl);
  const adminDatabaseUrl = buildDatabaseUrlWithName(databaseUrl, 'postgres', { keepSearch: false });
  const shadowDatabaseUrl = buildDatabaseUrlWithName(databaseUrl, shadowDatabaseName, {
    keepSearch: true,
  });
  const createDatabaseSql = `CREATE DATABASE ${quoteIdentifier(
    shadowDatabaseName,
  )} OWNER ${quoteIdentifier(databaseOwner)}`;
  const dropDatabaseSql = `DROP DATABASE IF EXISTS ${quoteIdentifier(
    shadowDatabaseName,
  )} WITH (FORCE)`;
  const adminClient = new Client({ connectionString: adminDatabaseUrl });

  try {
    await adminClient.connect();
    await adminClient.query(createDatabaseSql);

    return {
      shadowDatabaseUrl,
      async cleanup() {
        try {
          await adminClient.query(dropDatabaseSql);
        } finally {
          await adminClient.end();
        }
      },
    };
  } catch (error) {
    await adminClient.end().catch(() => undefined);
    runDockerPostgresAdminSql(createDatabaseSql);
  }

  return {
    shadowDatabaseUrl,
    async cleanup() {
      runDockerPostgresAdminSql(dropDatabaseSql);
    },
  };
};

const runPrismaDiff = (shadowDatabaseUrl) => {
  const npxExecutable = process.platform === 'win32' ? process.execPath : 'npx';
  const npxArguments =
    process.platform === 'win32'
      ? [join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js')]
      : [];
  const result = spawnSync(
    npxExecutable,
    [
      ...npxArguments,
      'prisma',
      'migrate',
      'diff',
      '--from-migrations',
      'prisma/migrations',
      '--to-schema',
      'prisma/schema.prisma',
      '--exit-code',
    ],
    {
      cwd: serverDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        DATABASE_URL: shadowDatabaseUrl,
        SHADOW_DATABASE_URL: shadowDatabaseUrl,
      },
    },
  );

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;

  if (result.error) {
    throw createVerificationError(result.error.message, output);
  }

  if (result.status === 2) {
    throw createVerificationError(
      'Committed Prisma migrations are not in sync with server/prisma/schema.prisma.',
      output,
    );
  }

  if (result.status !== 0) {
    throw createVerificationError('prisma migrate diff returned an error.', output);
  }
};

if (!existsSync(schemaPath)) {
  fail('Missing server/prisma/schema.prisma.');
}

if (!existsSync(migrationsDir)) {
  fail('Missing server/prisma/migrations.');
}

const databaseUrl = readServerEnvValue('DATABASE_URL');

if (!databaseUrl) {
  fail('DATABASE_URL is required for Prisma migration drift verification.');
}

const explicitShadowDatabaseUrl = readServerEnvValue('SHADOW_DATABASE_URL');
let temporaryShadowDatabase;
let verificationError;

try {
  temporaryShadowDatabase = explicitShadowDatabaseUrl
    ? { shadowDatabaseUrl: explicitShadowDatabaseUrl, cleanup: async () => undefined }
    : await createTemporaryShadowDatabase(databaseUrl);

  runPrismaDiff(temporaryShadowDatabase.shadowDatabaseUrl);
} catch (error) {
  verificationError = error;
} finally {
  try {
    await temporaryShadowDatabase?.cleanup();
  } catch (error) {
    verificationError ??= error;
  }
}

if (verificationError) {
  fail(verificationError instanceof Error ? verificationError.message : String(verificationError));
}

console.log('Prisma migration verification passed.');
