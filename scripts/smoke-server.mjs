import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join } from 'node:path';

import { spawnNpm } from './lib/npm-runner.mjs';

const smokeHost = '127.0.0.1';
const requestedPort = process.env.SMOKE_SERVER_PORT ?? process.env.PORT ?? '';
const reuseExistingServer = process.env.SMOKE_SERVER_REUSE_EXISTING === '1';
let port = requestedPort;
let targetUrl = '';
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

const buildTargetUrl = (candidatePort) => `http://${smokeHost}:${candidatePort}/api-json`;

const isValidPort = (candidatePort) => {
  if (!/^\d+$/.test(candidatePort)) {
    return false;
  }

  const numericPort = Number(candidatePort);
  return numericPort > 0 && numericPort <= 65535;
};

const findAvailablePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();

    server.unref();
    server.on('error', reject);
    server.listen(0, smokeHost, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not allocate an isolated smoke server port'));
        return;
      }

      server.close(() => {
        resolve(String(address.port));
      });
    });
  });

const assertPortAvailable = (candidatePort) =>
  new Promise((resolve, reject) => {
    const server = createServer();

    server.unref();
    server.once('error', () => {
      reject(
        new Error(
          `Smoke server port ${candidatePort} is already in use. Stop the existing process or set SMOKE_SERVER_PORT to a free port. Use SMOKE_SERVER_REUSE_EXISTING=1 only for explicit local reuse.`,
        ),
      );
    });
    server.listen(Number(candidatePort), smokeHost, () => {
      server.close(() => resolve());
    });
  });

const resolveIsolatedPort = async () => {
  if (!requestedPort) {
    return findAvailablePort();
  }

  if (!isValidPort(requestedPort)) {
    throw new Error(`Invalid SMOKE_SERVER_PORT/PORT value: ${requestedPort}`);
  }

  await assertPortAvailable(requestedPort);
  return requestedPort;
};

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
  spawnNpm(['run', 'start', '--prefix', 'server'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: port,
    },
  });

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

  if (reuseExistingServer) {
    port = requestedPort || '3000';
    if (!isValidPort(port)) {
      throw new Error(`Invalid SMOKE_SERVER_PORT/PORT value: ${port}`);
    }
    targetUrl = buildTargetUrl(port);
    swaggerDoc = await waitForSwagger(targetUrl, 5000);
  } else {
    port = await resolveIsolatedPort();
    targetUrl = buildTargetUrl(port);
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
