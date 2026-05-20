import { spawn, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const port = process.env.SMOKE_SERVER_PORT ?? process.env.PORT ?? '3000';
const targetUrl = `http://127.0.0.1:${port}/api-json`;
const authApiOperations = [
  { path: '/auth/signup', methods: ['post'] },
  { path: '/auth/signin', methods: ['post'] },
  { path: '/auth/logout', methods: ['post'] },
  { path: '/auth/refresh', methods: ['post'] },
];

const manifestRaw = await readFile(
  join(process.cwd(), 'template', 'features.manifest.json'),
  'utf-8',
);
const manifest = JSON.parse(manifestRaw);
const featureApiOperations = (manifest.features ?? []).flatMap((feature) => {
  if (Array.isArray(feature.openApiOperations) && feature.openApiOperations.length > 0) {
    return feature.openApiOperations;
  }

  return typeof feature.route === 'string' ? [{ path: feature.route, methods: [] }] : [];
});
const requiredApiOperations = [...authApiOperations, ...featureApiOperations].filter(
  (operation) => typeof operation.path === 'string' && operation.path.length > 0,
);
const requiredPaths = [...new Set(requiredApiOperations.map((operation) => operation.path))];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const npmExecutable = process.platform === 'win32' ? process.execPath : 'npm';
const npmCliPath =
  process.platform === 'win32'
    ? join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
    : null;

const waitForSwagger = async (url, timeoutMs) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
    } catch {
      // ignore until timeout
    }

    await sleep(500);
  }

  throw new Error(`Server smoke check timed out: ${url}`);
};

const isSwaggerDocument = (payload) => {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    ('openapi' in payload || 'swagger' in payload) &&
    typeof payload.paths === 'object' &&
    payload.paths !== null
  );
};

const findMissingOperations = (swaggerDoc) => {
  const paths = swaggerDoc.paths ?? {};
  const missingOperations = [];

  for (const operation of requiredApiOperations) {
    const methods = Array.isArray(operation.methods) ? operation.methods : [];
    const pathItem = paths[operation.path];

    if (!pathItem || methods.length === 0) {
      continue;
    }

    for (const method of methods) {
      const normalizedMethod = String(method).toLowerCase();
      if (!pathItem[normalizedMethod]) {
        missingOperations.push(`${normalizedMethod.toUpperCase()} ${operation.path}`);
      }
    }
  }

  return missingOperations;
};

const stopProcess = (child) =>
  new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve();
      return;
    }

    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
      resolve();
      return;
    }

    child.once('exit', () => resolve());
    child.kill('SIGTERM');

    setTimeout(() => {
      if (child.exitCode === null) {
        child.kill('SIGKILL');
      }
    }, 3000);
  });

const startServer = () =>
  spawn(
    npmExecutable,
    process.platform === 'win32'
      ? [npmCliPath, 'run', 'start', '--prefix', 'server']
      : ['run', 'start', '--prefix', 'server'],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: port,
      },
    },
  );

let server = null;
let serverLogs = '';

const captureServerLogs = (child) => {
  child.stdout.on('data', (chunk) => {
    serverLogs += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    serverLogs += chunk.toString();
  });
};

try {
  let swaggerDoc;

  try {
    swaggerDoc = await waitForSwagger(targetUrl, 1500);
  } catch {
    server = startServer();
    captureServerLogs(server);
    swaggerDoc = await waitForSwagger(targetUrl, 45000);
  }

  if (!isSwaggerDocument(swaggerDoc)) {
    throw new Error('Target /api-json is not an OpenAPI/Swagger document.');
  }

  const actualPaths = new Set(Object.keys(swaggerDoc.paths));
  const missingPaths = requiredPaths.filter((path) => !actualPaths.has(path));

  if (missingPaths.length > 0) {
    throw new Error(`Missing required API paths: ${missingPaths.join(', ')}`);
  }

  const missingOperations = findMissingOperations(swaggerDoc);

  if (missingOperations.length > 0) {
    throw new Error(`Missing required API operations: ${missingOperations.join(', ')}`);
  }

  console.log('Server smoke check passed.');
} catch (error) {
  console.error('Server smoke check failed.');
  console.error(error instanceof Error ? error.message : String(error));
  console.error(serverLogs);
  if (server) {
    await stopProcess(server);
  }
  process.exit(1);
}

if (server) {
  await stopProcess(server);
}
