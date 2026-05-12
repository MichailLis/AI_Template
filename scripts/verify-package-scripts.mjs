import { readFileSync } from 'node:fs';
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

if (!rootScripts['audit:all']) {
  fail('root package must define audit:all script');
}

if (!rootScripts['audit:prod']) {
  fail('root package must define audit:prod script');
}

if (auditCommandPattern.test(rootScripts['verify:local'] ?? '')) {
  fail('verify:local must not include audit scripts before dependency remediation');
}

if (auditCommandPattern.test(rootScripts['verify:template'] ?? '')) {
  fail('verify:template must not include audit scripts before dependency remediation');
}

for (const scriptName of ['verify:local', 'verify:template']) {
  requireRootScriptSegment(scriptName, 'npm run verify:package-scripts');
  requireRootScriptSegment(scriptName, 'npm run verify:runtime-config');
}

if (failures.length > 0) {
  console.error('Package scripts verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Package scripts verification passed.');
