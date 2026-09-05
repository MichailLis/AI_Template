import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { formatSymbolReport, indexSymbol } from './lib/symbol-index.mjs';

const __filename = fileURLToPath(import.meta.url);
const rootDir = resolve(dirname(__filename), '..');

const SCAN_DIRS = [
  join(rootDir, 'client', 'src'),
  join(rootDir, 'server', 'src'),
  join(rootDir, 'scripts'),
];

const EXTENSIONS = new Set(['.ts', '.tsx', '.mjs', '.js']);

const IGNORED_PREFIXES = ['client/src/shared/api/generated/', 'client/src/shared/api/model/'];

const IGNORED_DIR_NAMES = new Set(['node_modules', 'dist', 'build', '.git']);

const toPosix = (path) => path.replace(/\\/g, '/');

const collectFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIR_NAMES.has(entry.name) || entry.name.startsWith('.')) {
        continue;
      }
      const fullPath = join(dir, entry.name);
      const relPath = toPosix(fullPath.slice(rootDir.length + 1));
      if (
        IGNORED_PREFIXES.some(
          (prefix) => relPath.startsWith(prefix) || (relPath + '/').startsWith(prefix),
        )
      ) {
        continue;
      }
      files.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile()) {
      const ext = entry.name.slice(entry.name.lastIndexOf('.'));
      if (EXTENSIONS.has(ext)) {
        const fullPath = join(dir, entry.name);
        const relPath = toPosix(fullPath.slice(rootDir.length + 1));
        if (IGNORED_PREFIXES.some((prefix) => relPath.startsWith(prefix))) {
          continue;
        }
        files.push({ fullPath, relativePath: relPath });
      }
    }
  }

  return files;
};

const main = async () => {
  const rawArgs = process.argv.slice(2);
  const symbolName = rawArgs.join(' ').trim();

  if (!symbolName) {
    console.error('Usage: npm run find:symbol -- <symbol-name>');
    process.exit(1);
  }

  const collected = [];
  for (const dir of SCAN_DIRS) {
    try {
      collected.push(...(await collectFiles(dir)));
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  const files = await Promise.all(
    collected.map(async ({ fullPath, relativePath }) => {
      const source = await readFile(fullPath, 'utf8');
      return { relativePath, source };
    }),
  );

  const result = indexSymbol(files, symbolName);
  const report = formatSymbolReport(result);

  console.log(report);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
