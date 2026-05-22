import { spawnNpm } from './lib/npm-runner.mjs';
import { getProcessTreeSpawnOptions, stopProcessTree } from './lib/process-tree.mjs';

const port = '4173';
const targetUrl = `http://127.0.0.1:${port}/`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const client = spawnNpm(
  [
    'run',
    'preview',
    '--prefix',
    'client',
    '--',
    '--host',
    '127.0.0.1',
    '--port',
    port,
    '--strictPort',
  ],
  getProcessTreeSpawnOptions({
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
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
  await stopProcessTree(client);
  process.exit(1);
}

await stopProcessTree(client);
