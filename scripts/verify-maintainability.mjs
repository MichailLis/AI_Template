import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();

const MAX_USE_STATE_PER_FILE = 14;

const SOURCE_SCOPES = [
  {
    directoryPath: join(root, 'client', 'src'),
    extensions: ['.ts', '.tsx'],
    ignoredPrefixes: ['client/src/shared/api/generated/'],
    label: 'Client source',
    maxEffectiveLines: 420,
  },
  {
    directoryPath: join(root, 'server', 'src'),
    extensions: ['.ts'],
    ignoredPrefixes: ['server/src/generated/'],
    label: 'Server source',
    maxEffectiveLines: 900,
  },
  {
    directoryPath: join(root, 'scripts'),
    extensions: ['.js', '.mjs'],
    ignoredPrefixes: [],
    label: 'Repository scripts',
    maxEffectiveLines: 700,
  },
  {
    directoryPath: join(root, 'client', 'src'),
    extensions: ['.css'],
    ignoredPrefixes: [],
    label: 'Client styles',
    maxEffectiveLines: 2000,
  },
];

const toPosix = (value) => value.replace(/\\/g, '/');

const hasSupportedExtension = (fileName, extensions) =>
  extensions.some((extension) => fileName.endsWith(extension));

const getEffectiveLineCount = (source) =>
  source.split(/\r?\n/).filter((line) => {
    const trimmedLine = line.trim();

    return (
      trimmedLine &&
      !trimmedLine.startsWith('//') &&
      !trimmedLine.startsWith('/*') &&
      !trimmedLine.startsWith('*') &&
      !trimmedLine.startsWith('*/')
    );
  }).length;

const collectFiles = async (scope, directoryPath = scope.directoryPath) => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(scope, absolutePath)));
      continue;
    }

    if (!entry.isFile() || !hasSupportedExtension(entry.name, scope.extensions)) {
      continue;
    }

    const relativePath = toPosix(absolutePath.slice(root.length + 1));
    if (scope.ignoredPrefixes.some((prefix) => relativePath.startsWith(prefix))) {
      continue;
    }

    files.push({ absolutePath, relativePath, scope });
  }

  return files;
};

const files = [];
const errors = [];

for (const scope of SOURCE_SCOPES) {
  files.push(...(await collectFiles(scope)));
}

for (const file of files) {
  const source = await readFile(file.absolutePath, 'utf-8');
  const lineCount = getEffectiveLineCount(source);

  if (lineCount > file.scope.maxEffectiveLines) {
    errors.push(
      `${file.relativePath}: ${lineCount} effective lines in ${file.scope.label} (max ${file.scope.maxEffectiveLines}). Split module to keep maintainability stable.`,
    );
  }

  if (file.relativePath.startsWith('client/src/') && /\.(ts|tsx)$/.test(file.relativePath)) {
    const useStateCount = (source.match(/\buseState\s*\(/g) ?? []).length;
    if (useStateCount > MAX_USE_STATE_PER_FILE) {
      errors.push(
        `${file.relativePath}: ${useStateCount} useState calls (max ${MAX_USE_STATE_PER_FILE}). Consider useReducer or state extraction.`,
      );
    }
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
