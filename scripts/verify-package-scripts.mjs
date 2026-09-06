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
const serverTypecheck = serverScripts.typecheck ?? '';
const auditCommandPattern = /(?:^|&&|\|\||;)\s*npm(?:\s+run)?\s+audit(?::|\b)/;
const ciWorkflowPath = join(rootDir, '.github', 'workflows', 'ci.yml');
const splitScriptSegments = (script) =>
  script
    .split('&&')
    .map((segment) => segment.trim())
    .filter(Boolean);
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

// `nest build` compiles through tsconfig.build.json, which excludes **/*spec.ts. Without a
// separate full-program typecheck the specs are the one part of the server no gate ever
// compiles, and type errors accumulate there unseen.
if (!serverTypecheck) {
  fail('server package must define typecheck script');
}

if (!serverTypecheck.includes('--noEmit')) {
  fail('server typecheck script must run tsc --noEmit');
}

if (serverTypecheck.includes('tsconfig.build.json')) {
  fail('server typecheck must use tsconfig.json, which includes specs, not tsconfig.build.json');
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
if (rootScripts['verify:invariants'] !== 'node scripts/verify-invariants.mjs') {
  fail('root package must define verify:invariants script');
}
if (rootScripts['verify:paired-rules'] !== 'node scripts/verify-paired-rules.mjs') {
  fail('root package must define verify:paired-rules script');
}
if (rootScripts['verify:gates'] !== 'node scripts/verify-gates.mjs') {
  fail('root package must define verify:gates script as "node scripts/verify-gates.mjs"');
}

if (rootScripts['verify:diff'] !== 'node scripts/verify-diff.mjs') {
  fail('root package must define verify:diff script as "node scripts/verify-diff.mjs"');
}

if (rootScripts['find:symbol'] !== 'node scripts/find-symbol.mjs') {
  fail('root package must define find:symbol script as "node scripts/find-symbol.mjs"');
}

// audit:explain reads the live advisory registry to explain a red audit:all: which findings this
// branch introduced, which it inherited, which it fixed. It gates nothing, and keeping it out of
// verify:local and verify:template below is the whole point — a check that asks a registry can go
// red on a tree nobody touched, which is the problem this tool diagnoses rather than repeats.
if (rootScripts['audit:explain'] !== 'node scripts/audit-explain.mjs') {
  fail('root package must define audit:explain script as "node scripts/audit-explain.mjs"');
}

// doctor:agent-tooling diagnoses machine-local agent preconditions (rtk hook exclusions, serena binary,
// root typescript, compose project name). It gates nothing, and keeping it out of verify:local and
// verify:template below is intentional — machine configuration should not fail builds on a clean tree.
if (rootScripts['doctor:agent-tooling'] !== 'node scripts/doctor-agent-tooling.mjs') {
  fail(
    'root package must define doctor:agent-tooling script as "node scripts/doctor-agent-tooling.mjs"',
  );
}

for (const scriptName of ['verify:local', 'verify:template']) {
  const script = rootScripts[scriptName] ?? '';
  if (script.includes('verify:diff')) {
    fail(
      `${scriptName} must not include verify:diff (verify:diff is an auxiliary pre-flight, not a gate)`,
    );
  }
  if (script.includes('find:symbol')) {
    fail(
      `${scriptName} must not include find:symbol (find:symbol is a developer tool, not a gate)`,
    );
  }
  if (script.includes('audit:explain')) {
    fail(
      `${scriptName} must not include audit:explain (audit:explain is a diagnostic, not a gate)`,
    );
  }
  if (script.includes('doctor:agent-tooling')) {
    fail(
      `${scriptName} must not include doctor:agent-tooling (doctor:agent-tooling is a diagnostic, not a gate)`,
    );
  }
}

for (const scriptName of ['verify:local', 'verify:template']) {
  requireRootScriptSegment(scriptName, 'npm run verify:package-scripts');
  requireRootScriptSegment(scriptName, 'npm run verify:runtime-config');
  requireRootScriptSegment(scriptName, 'npm run test:scripts');
  requireRootScriptSegment(scriptName, 'npm run verify:prisma-migrations');
  requireRootScriptSegment(scriptName, 'npm run verify:invariants');
  requireRootScriptSegment(scriptName, 'npm run verify:paired-rules');
  requireRootScriptSegment(scriptName, 'npm run typecheck');
  requireRootScriptSegment(scriptName, 'npm run verify:gates');
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

// verify:architecture reads server/openapi.json but never writes it, and the file is gitignored.
// Every gate that runs the check must therefore regenerate the document first, or it validates a
// stale artifact — or, on a clean checkout, fails on a missing one. verify:contracts pairs the two
// so a gate cannot pick up the check without the generation.
const CONTRACTS_SCRIPT = 'npm run gen:openapi && npm run verify:architecture';
const OPENAPI_PRODUCERS = new Set(['npm run gen:openapi', 'npm run gen:api']);

if (rootScripts['verify:contracts'] !== CONTRACTS_SCRIPT) {
  fail(`root verify:contracts script must be "${CONTRACTS_SCRIPT}"`);
}

for (const scriptName of ['verify:local', 'verify:template']) {
  const segments = splitScriptSegments(rootScripts[scriptName] ?? '');
  const architectureIndex = segments.indexOf('npm run verify:architecture');

  if (architectureIndex === -1) {
    if (!segments.includes('npm run verify:contracts')) {
      fail(`${scriptName} must verify the architecture, via npm run verify:contracts`);
    }
    continue;
  }

  // Calling the check directly is allowed only where the document is already fresh.
  const regeneratedBefore = segments
    .slice(0, architectureIndex)
    .some((segment) => OPENAPI_PRODUCERS.has(segment));

  if (!regeneratedBefore) {
    fail(
      `${scriptName} runs verify:architecture without regenerating server/openapi.json first; ` +
        'use npm run verify:contracts',
    );
  }
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

const claudeSettingsPath = join(rootDir, '.claude', 'settings.json');
if (existsSync(claudeSettingsPath)) {
  try {
    const claudeSettings = JSON.parse(readFileSync(claudeSettingsPath, 'utf8'));
    const hooksConfig = claudeSettings.hooks;
    if (hooksConfig && typeof hooksConfig === 'object') {
      const SCRIPT_EXTENSIONS = /\.(?:mjs|cjs|js|ts|sh|cmd)$/i;
      const IGNORED_PREFIX = /^(?:\/|~|%|\\|[a-zA-Z]:)/;

      for (const [eventName, eventEntries] of Object.entries(hooksConfig)) {
        if (!Array.isArray(eventEntries)) continue;
        for (const entry of eventEntries) {
          const hooksList = Array.isArray(entry?.hooks)
            ? entry.hooks
            : entry?.command
              ? [entry]
              : [];
          for (const hook of hooksList) {
            const command = hook?.command;
            if (typeof command !== 'string') continue;

            const tokens = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
            for (const token of tokens) {
              const cleanToken = token.replace(/^["']|["']$/g, '').trim();
              if (!SCRIPT_EXTENSIONS.test(cleanToken)) continue;
              if (IGNORED_PREFIX.test(cleanToken)) continue;

              const scriptPath = join(rootDir, cleanToken);
              if (!existsSync(scriptPath)) {
                fail(
                  `.claude/settings.json hook for "${eventName}" references missing script "${cleanToken}" in command "${command}"`,
                );
              }
            }
          }
        }
      }
    }
  } catch (err) {
    fail(`Failed to parse .claude/settings.json: ${err.message}`);
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
