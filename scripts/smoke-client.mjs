import { spawn, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';

const port = '4173';
const targetUrl = `http://127.0.0.1:${port}/`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const npmExecutable =
  process.platform === 'win32'
    ? process.execPath
    : 'npm';
const npmCliPath =
  process.platform === 'win32'
    ? join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
    : null;

const waitForClient = async (url, timeoutMs) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const html = await response.text();
        if (html.includes('<div id="root"></div>')) {
          return;
        }
      }
    } catch {
      // ignore until timeout
    }

    await sleep(500);
  }

  throw new Error(`Client smoke check timed out: ${url}`);
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

const client = spawn(
  npmExecutable,
  process.platform === 'win32'
    ? [
        npmCliPath,
        'run',
        'preview',
        '--prefix',
        'client',
        '--',
        '--host',
        '127.0.0.1',
        '--port',
        port,
      ]
    : [
        'run',
        'preview',
        '--prefix',
        'client',
        '--',
        '--host',
        '127.0.0.1',
        '--port',
        port,
      ],
  {
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

let clientLogs = '';

client.stdout.on('data', (chunk) => {
  clientLogs += chunk.toString();
});

client.stderr.on('data', (chunk) => {
  clientLogs += chunk.toString();
});

try {
  await waitForClient(targetUrl, 30000);
  console.log('Client smoke check passed.');
} catch (error) {
  console.error('Client smoke check failed.');
  console.error(error instanceof Error ? error.message : String(error));
  console.error(clientLogs);
  await stopProcess(client);
  process.exit(1);
}

await stopProcess(client);
