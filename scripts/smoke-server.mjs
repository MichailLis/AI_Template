import { spawn, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const port = '3105';
const targetUrl = `http://127.0.0.1:${port}/api-json`;
const authApiPaths = ['/auth/signup', '/auth/signin', '/auth/logout', '/auth/refresh'];

const manifestRaw = await readFile(
  join(process.cwd(), 'template', 'features.manifest.json'),
  'utf-8',
);
const manifest = JSON.parse(manifestRaw);
const featureApiPaths = (manifest.features ?? [])
  .map((feature) => feature.route)
  .filter((route) => typeof route === 'string');
const requiredPaths = [...authApiPaths, ...featureApiPaths];

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

const server = spawn(
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

let serverLogs = '';

server.stdout.on('data', (chunk) => {
  serverLogs += chunk.toString();
});

server.stderr.on('data', (chunk) => {
  serverLogs += chunk.toString();
});

try {
  const swaggerDoc = await waitForSwagger(targetUrl, 45000);
  const actualPaths = new Set(Object.keys(swaggerDoc.paths ?? {}));
  const missingPaths = requiredPaths.filter((path) => !actualPaths.has(path));

  if (missingPaths.length > 0) {
    throw new Error(`Missing required API paths: ${missingPaths.join(', ')}`);
  }

  console.log('Server smoke check passed.');
} catch (error) {
  console.error('Server smoke check failed.');
  console.error(error instanceof Error ? error.message : String(error));
  console.error(serverLogs);
  await stopProcess(server);
  process.exit(1);
}

await stopProcess(server);
