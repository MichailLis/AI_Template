const toPosix = (filePath) => filePath.replace(/\\/g, '/');

/**
 * Mapping of file patterns to scripts based on verify:local reference order.
 */
export const VERIFY_LOCAL_ORDER = [
  'prisma:generate',
  'verify:ai-guide',
  'verify:package-scripts',
  'verify:runtime-config',
  'test:scripts',
  'verify:api-mutator',
  'verify:invariants',
  'verify:prisma-migrations',
  'verify:contracts',
  'verify:maintainability',
  'typecheck',
  'lint',
  'npm run test --prefix server',
  'npm run test:e2e --prefix server',
  'npm run test:run --prefix client',
  'npm run build --prefix server',
  'npm run build --prefix client',
  'format:check',
];

/**
 * Maps a single file path to the set of scripts/commands it triggers.
 *
 * Changed files mapping:
 * - server/prisma/schema.prisma -> prisma:generate, verify:prisma-migrations
 * - server/prisma/migrations/** -> verify:prisma-migrations
 * - server/src/** /*.controller.ts or dto.ts -> verify:contracts
 * - server/src/** -> verify:invariants, typecheck, lint, server tests
 * - client/src/shared/api/api.ts or interceptors.ts -> verify:api-mutator
 * - client/src/** -> verify:invariants, lint, client tests
 * - scripts/** -> test:scripts, verify:package-scripts
 * - any package.json -> verify:package-scripts
 * - template/*.json -> verify:contracts
 * - .github/workflows/ci.yml -> verify:package-scripts
 * - AI_GUIDE.md, README.md, AGENTS.md, docs/**, .serena/memories/** -> verify:ai-guide
 * - any file at all -> format:check
 */
export const getScriptsForFile = (filePath) => {
  const norm = toPosix(filePath);
  const scripts = new Set();

  // Every changed file triggers format:check
  scripts.add('format:check');

  if (norm === 'server/prisma/schema.prisma') {
    scripts.add('prisma:generate');
    scripts.add('verify:prisma-migrations');
  }

  if (norm.startsWith('server/prisma/migrations/')) {
    scripts.add('verify:prisma-migrations');
  }

  if (
    (norm.startsWith('server/src/') && norm.endsWith('.controller.ts')) ||
    norm.endsWith('.dto.ts')
  ) {
    scripts.add('verify:contracts');
  }

  if (norm.startsWith('server/src/')) {
    scripts.add('verify:invariants');
    scripts.add('typecheck');
    scripts.add('lint');
    scripts.add('npm run test --prefix server');
    scripts.add('npm run test:e2e --prefix server');
  }

  if (
    norm === 'client/src/shared/api/api.ts' ||
    norm === 'client/src/shared/api/interceptors.ts' ||
    norm.endsWith('/interceptors.ts')
  ) {
    scripts.add('verify:api-mutator');
  }

  if (norm.startsWith('client/src/')) {
    scripts.add('verify:invariants');
    scripts.add('lint');
    scripts.add('npm run test:run --prefix client');
  }

  if (norm.startsWith('scripts/')) {
    scripts.add('test:scripts');
    scripts.add('verify:package-scripts');
  }

  if (norm === 'package.json' || norm.endsWith('/package.json')) {
    scripts.add('verify:package-scripts');
  }

  if (norm.startsWith('template/') && norm.endsWith('.json')) {
    scripts.add('verify:contracts');
  }

  if (norm === '.github/workflows/ci.yml') {
    scripts.add('verify:package-scripts');
  }

  if (
    norm === 'AI_GUIDE.md' ||
    norm === 'README.md' ||
    norm === 'AGENTS.md' ||
    norm.startsWith('docs/') ||
    norm.startsWith('.serena/memories/')
  ) {
    scripts.add('verify:ai-guide');
  }

  return scripts;
};

/**
 * Returns an ordered, deduplicated list of script/command names for the given changed files.
 * Order matches the relative order in verify:local, followed by format:check.
 */
export const getOrderedScripts = (relativePaths) => {
  if (!relativePaths || relativePaths.length === 0) {
    return [];
  }

  const allScripts = new Set();
  for (const path of relativePaths) {
    const fileScripts = getScriptsForFile(path);
    for (const s of fileScripts) {
      allScripts.add(s);
    }
  }

  // Preserve relative order from VERIFY_LOCAL_ORDER
  const result = [];
  for (const script of VERIFY_LOCAL_ORDER) {
    if (allScripts.has(script)) {
      result.push(script);
      allScripts.delete(script);
    }
  }

  // Any remaining scripts not in VERIFY_LOCAL_ORDER (fallback)
  for (const remaining of allScripts) {
    result.push(remaining);
  }

  return result;
};

/**
 * Converts a script identifier from getOrderedScripts into the executable shell command.
 * E.g. 'test:scripts' -> 'npm run test:scripts'
 * 'npm run test --prefix server' -> 'npm run test --prefix server'
 */
export const scriptToCommand = (scriptName) => {
  if (scriptName.startsWith('npm ')) {
    return scriptName;
  }
  return `npm run ${scriptName}`;
};

/**
 * Returns affected scopes based on changed files for informational reporting.
 */
export const getAffectedScopes = (relativePaths) => {
  const scopes = new Set();
  for (const path of relativePaths) {
    const norm = toPosix(path);
    if (norm.startsWith('server/prisma/')) scopes.add('server/prisma');
    else if (norm.startsWith('server/src/')) scopes.add('server/src');
    else if (norm.startsWith('client/src/shared/api/')) scopes.add('client/api');
    else if (norm.startsWith('client/src/')) scopes.add('client/src');
    else if (norm.startsWith('scripts/')) scopes.add('scripts');
    else if (norm.endsWith('package.json')) scopes.add('package.json');
    else if (norm.startsWith('template/')) scopes.add('template');
    else if (norm.startsWith('.github/')) scopes.add('ci');
    else if (
      norm === 'AI_GUIDE.md' ||
      norm === 'README.md' ||
      norm === 'AGENTS.md' ||
      norm === 'CLAUDE.md' ||
      norm.startsWith('docs/') ||
      norm.startsWith('.serena/memories/')
    ) {
      scopes.add('documentation');
    } else {
      scopes.add('other');
    }
  }
  return Array.from(scopes).sort();
};

/**
 * Checks for \r\r\n CRLF corruption in file source.
 * Returns array of error descriptions, or empty array if clean.
 */
export const findCrlfCorruption = ({ relativePath, source }) => {
  if (typeof source !== 'string') {
    return [];
  }

  const errors = [];
  const regex = /\r\r\n/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const line = source.slice(0, match.index).split(/\r?\n/).length;
    errors.push(
      `${relativePath}:${line}: corrupted line ending \\r\\r\\n found (CRLF duplication)`,
    );
  }

  return errors;
};

export const checkCrlfCorruption = findCrlfCorruption;

/**
 * Compares two versions of content and returns true if they differ ONLY by line endings (\r\n vs \n).
 * Returns false if they are identical or if they have different content beyond line endings.
 */
export const differsOnlyByLineEndings = (contentA, contentB) => {
  if (contentA === contentB) {
    return false;
  }
  if (typeof contentA !== 'string' || typeof contentB !== 'string') {
    return false;
  }

  const normalizedA = contentA.replace(/\r\n|\r/g, '\n');
  const normalizedB = contentB.replace(/\r\n|\r/g, '\n');

  return normalizedA === normalizedB;
};
