import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { findPublicBundleLeaks } from './lib/public-bundle.mjs';

// Собираем клиент в память своим vite build: проверке нужны moduleIds чанков, а на диск их
// пишет только sourcemap, которую в прод выкладывать незачем.
const client = join(process.cwd(), 'client');
const { build } = await import(pathToFileURL(join(client, 'node_modules/vite/dist/node/index.js')));
const result = await build({ root: client, logLevel: 'error', build: { write: false } });
const chunks = (Array.isArray(result) ? result : [result])
  .flatMap((output) => output.output)
  .filter((item) => item.type === 'chunk');

const pages = findPublicBundleLeaks(chunks);
const errors = [];

if (pages.length === 0) {
  errors.push('no chunk for client/src/pages/t/* found: the check would pass blind');
}
for (const { page, leaks } of pages) {
  for (const leak of leaks) errors.push(`${page} loads ${leak}`);
}

if (errors.length > 0) {
  console.error('Public bundle verification failed: /t/* pages must not load admin code.');
  for (const [index, error] of errors.entries()) console.error(`${index + 1}. ${error}`);
  process.exit(1);
}

console.log(
  `Public bundle verification passed (${pages.length} /t/* pages, no admin modules in their chunks).`,
);
