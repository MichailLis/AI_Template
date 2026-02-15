import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();

const MAX_FILE_LINES = 420;
const MAX_USE_STATE_PER_FILE = 14;

const SOURCE_ROOT = join(root, 'client', 'src');
const IGNORED_PREFIXES = ['shared/api/generated/'];

const toPosix = (value) => value.replace(/\\/g, '/');

const collectFiles = async (directoryPath) => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
      continue;
    }

    if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) {
      continue;
    }

    const relativePath = toPosix(absolutePath.slice(root.length + 1));
    if (IGNORED_PREFIXES.some((prefix) => relativePath.startsWith(`client/src/${prefix}`))) {
      continue;
    }

    files.push({ absolutePath, relativePath });
  }

  return files;
};

const files = await collectFiles(SOURCE_ROOT);
const errors = [];

for (const file of files) {
  const source = await readFile(file.absolutePath, 'utf-8');
  const lineCount = source.split(/\r?\n/).length;

  if (lineCount > MAX_FILE_LINES) {
    errors.push(
      `${file.relativePath}: ${lineCount} lines (max ${MAX_FILE_LINES}). Split module to keep maintainability stable.`,
    );
  }

  const useStateCount = (source.match(/\buseState\s*\(/g) ?? []).length;
  if (useStateCount > MAX_USE_STATE_PER_FILE) {
    errors.push(
      `${file.relativePath}: ${useStateCount} useState calls (max ${MAX_USE_STATE_PER_FILE}). Consider useReducer or state extraction.`,
    );
  }
}

if (errors.length > 0) {
  console.error('Maintainability verification failed.');
  for (const [index, error] of errors.entries()) {
    console.error(`${index + 1}. ${error}`);
  }
  process.exit(1);
}

console.log('Maintainability verification passed.');
