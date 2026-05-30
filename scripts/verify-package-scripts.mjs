import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();
const rootPackage = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const serverPackage = JSON.parse(readFileSync(join(rootDir, 'server', 'package.json'), 'utf8'));

const failures = [];

const fail = (message) => {
  failures.push(message);
};

const rootScripts = rootPackage.scripts ?? {};
const serverScripts = serverPackage.scripts ?? {};
const clientPackage = JSON.parse(readFileSync(join(rootDir, 'client', 'package.json'), 'utf8'));
const clientScripts = clientPackage.scripts ?? {};
const clientLint = clientScripts.lint ?? '';
const serverLint = serverScripts.lint ?? '';
const serverLintFix = serverScripts['lint:fix'] ?? '';
const auditCommandPattern = /(?:^|&&|\|\||;)\s*npm(?:\s+run)?\s+audit(?::|\b)/;
const ciWorkflowPath = join(rootDir, '.github', 'workflows', 'ci.yml');
const requireRootScriptSegment = (scriptName, expectedSegment) => {
  const script = rootScripts[scriptName] ?? '';

  if (!script.includes(expectedSegment)) {
    fail(`${scriptName} must include ${expectedSegment}`);
  }
};

if (!serverLint) {
  fail('server package must define lint script');
}

if (serverLint.includes('--fix')) {
  fail('server lint script must be read-only and must not include --fix');
}

if (!serverLint.includes('src/**/*.ts')) {
  fail('server lint script must lint src/**/*.ts');
}

if (serverLint.includes('test')) {
  fail('server lint script must not include test globs while server eslint ignores tests');
}

if (!serverLintFix) {
  fail('server package must define lint:fix script');
}

if (!serverLintFix.includes('--fix')) {
  fail('server lint:fix script must include --fix');
}

if (!serverLintFix.includes('src/**/*.ts')) {
  fail('server lint:fix script must lint src/**/*.ts');
}

if (!clientLint) {
  fail('client package must define lint script');
}

if (clientLint.includes('--fix')) {
  fail('client lint script must be read-only and must not include --fix');
}

if (rootScripts.lint !== 'npm run lint --prefix client && npm run lint --prefix server') {
  fail('root lint script must run client and server lint scripts');
}

if (rootScripts['test:scripts'] !== 'node --test scripts/lib/*.test.mjs') {
  fail('root test:scripts script must run scripts/lib/*.test.mjs');
}

if (rootScripts['install:all'] !== 'npm ci --prefix client && npm ci --prefix server') {
  fail('install:all must use npm ci for client and server');
}

if (!rootScripts['audit:all']) {
  fail('root package must define audit:all script');
}

if (!rootScripts['audit:prod']) {
  fail('root package must define audit:prod script');
}

if (rootScripts['verify:prisma-migrations'] !== 'node scripts/verify-prisma-migrations.mjs') {
  fail('root package must define verify:prisma-migrations script');
}

for (const scriptName of ['verify:local', 'verify:template']) {
  requireRootScriptSegment(scriptName, 'npm run verify:package-scripts');
  requireRootScriptSegment(scriptName, 'npm run verify:runtime-config');
  requireRootScriptSegment(scriptName, 'npm run test:scripts');
  requireRootScriptSegment(scriptName, 'npm run verify:prisma-migrations');
}

for (const expectedSegment of [
  'npm run prisma:generate',
  'npm run gen:api',
  'npm run test:run --prefix client',
  'npm run format:check',
  'npm run audit:all',
  'npm run verify:e2e:critical',
]) {
  requireRootScriptSegment('verify:template', expectedSegment);
}

if (auditCommandPattern.test(rootScripts['verify:local'] ?? '')) {
  fail('verify:local must stay practical and must not include audit scripts');
}

if (!existsSync(ciWorkflowPath)) {
  fail('.github/workflows/ci.yml must exist');
} else {
  const ciWorkflow = readFileSync(ciWorkflowPath, 'utf8');

  for (const expectedCommand of [
    'npm ci',
    'npm ci --prefix client',
    'npm ci --prefix server',
    'npm run verify:template',
  ]) {
    if (!ciWorkflow.includes(expectedCommand)) {
      fail(`.github/workflows/ci.yml must include ${expectedCommand}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Package scripts verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Package scripts verification passed.');
