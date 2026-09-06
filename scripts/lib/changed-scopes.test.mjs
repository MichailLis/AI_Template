import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  checkCrlfCorruption,
  differsOnlyByLineEndings,
  findCrlfCorruption,
  getAffectedScopes,
  getOrderedScripts,
  getScriptsForFile,
  scriptToCommand,
  VERIFY_LOCAL_ORDER,
} from './changed-scopes.mjs';

describe('getScriptsForFile and getOrderedScripts', () => {
  it('triggers prisma:generate, verify:prisma-migrations and format:check on server/prisma/schema.prisma', () => {
    const scripts = getOrderedScripts(['server/prisma/schema.prisma']);
    assert.deepEqual(scripts, ['prisma:generate', 'verify:prisma-migrations', 'format:check']);
  });

  it('triggers verify:prisma-migrations and format:check on server/prisma/migrations/**', () => {
    const scripts = getOrderedScripts(['server/prisma/migrations/20250101_init/migration.sql']);
    assert.deepEqual(scripts, ['verify:prisma-migrations', 'format:check']);
  });

  it('triggers verify:contracts for server controller and dto files', () => {
    const scripts = getOrderedScripts(['server/src/users/users.controller.ts']);
    assert.ok(scripts.includes('verify:contracts'));
    assert.ok(scripts.includes('verify:invariants'));
    assert.ok(scripts.includes('typecheck'));
    assert.ok(scripts.includes('lint'));
    assert.ok(scripts.includes('npm run test --prefix server'));
    assert.ok(scripts.includes('npm run test:e2e --prefix server'));
    assert.ok(scripts.includes('format:check'));
  });

  it('triggers verify:api-mutator for client/src/shared/api/api.ts and interceptors.ts', () => {
    const scriptsApi = getOrderedScripts(['client/src/shared/api/api.ts']);
    assert.ok(scriptsApi.includes('verify:api-mutator'));

    const scriptsInterceptors = getOrderedScripts(['client/src/shared/api/interceptors.ts']);
    assert.ok(scriptsInterceptors.includes('verify:api-mutator'));
  });

  it('triggers client checks for client/src/** files', () => {
    const scripts = getOrderedScripts(['client/src/entities/user/ui/user-card.tsx']);
    assert.deepEqual(scripts, [
      'verify:invariants',
      'verify:maintainability',
      'lint',
      'npm run test:run --prefix client',
      'format:check',
    ]);
  });

  it('triggers test:scripts, verify:package-scripts and verify:invariants for scripts/**', () => {
    const scripts = getOrderedScripts(['scripts/verify-diff.mjs']);
    assert.deepEqual(scripts, [
      'verify:package-scripts',
      'test:scripts',
      'verify:invariants',
      'verify:maintainability',
      'format:check',
    ]);
  });

  it('triggers verify:package-scripts for any package.json or ci.yml', () => {
    const rootPkg = getOrderedScripts(['package.json']);
    assert.deepEqual(rootPkg, ['verify:package-scripts', 'format:check']);

    const serverPkg = getOrderedScripts(['server/package.json']);
    assert.deepEqual(serverPkg, [
      'verify:package-scripts',
      'verify:runtime-config',
      'format:check',
    ]);

    const ciYml = getOrderedScripts(['.github/workflows/ci.yml']);
    assert.deepEqual(ciYml, ['verify:package-scripts', 'format:check']);
  });
  it('triggers verify:runtime-config on docker-compose.yml, Dockerfiles, vite.config.ts, server/package.json', () => {
    const compose = getOrderedScripts(['docker-compose.yml']);
    assert.ok(compose.includes('verify:runtime-config'));

    const serverDocker = getOrderedScripts(['server/Dockerfile']);
    assert.ok(serverDocker.includes('verify:runtime-config'));

    const clientDocker = getOrderedScripts(['client/Dockerfile']);
    assert.ok(clientDocker.includes('verify:runtime-config'));

    const viteConfig = getOrderedScripts(['client/vite.config.ts']);
    assert.ok(viteConfig.includes('verify:runtime-config'));

    const serverPkg = getOrderedScripts(['server/package.json']);
    assert.ok(serverPkg.includes('verify:runtime-config'));
  });

  it('triggers verify:maintainability on client/src/**, server/src/**, scripts/**', () => {
    assert.ok(getOrderedScripts(['client/src/app/App.tsx']).includes('verify:maintainability'));
    assert.ok(getOrderedScripts(['server/src/main.ts']).includes('verify:maintainability'));
    assert.ok(getOrderedScripts(['scripts/verify-diff.mjs']).includes('verify:maintainability'));
  });

  it('triggers verify:contracts for template/*.json', () => {
    const scripts = getOrderedScripts(['template/features.manifest.json']);
    assert.deepEqual(scripts, ['verify:contracts', 'format:check']);
  });

  it('triggers verify:ai-guide for AI_GUIDE.md, README.md, AGENTS.md, docs/**, .serena/memories/**', () => {
    const docScripts = getOrderedScripts([
      'AI_GUIDE.md',
      'README.md',
      'AGENTS.md',
      'docs/adr/001.md',
      '.serena/memories/tech-stack.md',
    ]);
    assert.deepEqual(docScripts, ['verify:ai-guide', 'format:check']);
  });

  it('triggers only format:check for unknown or arbitrary files', () => {
    const scripts = getOrderedScripts(['random-asset.png']);
    assert.deepEqual(scripts, ['format:check']);
  });

  it('deduplicates and preserves relative order from verify:local', () => {
    // Current branch diff simulation: scripts/**, package.json, two .md files
    const changed = [
      'scripts/lib/changed-scopes.mjs',
      'scripts/lib/changed-scopes.test.mjs',
      'package.json',
      'AI_GUIDE.md',
      'CLAUDE.md',
    ];
    const scripts = getOrderedScripts(changed);

    // Expected relative order according to verify:local:
    // verify:ai-guide, verify:package-scripts, test:scripts, verify:invariants, format:check
    assert.deepEqual(scripts, [
      'verify:ai-guide',
      'verify:package-scripts',
      'test:scripts',
      'verify:invariants',
      'verify:maintainability',
      'format:check',
    ]);
    // Server/client tests and prisma:generate must NOT be present
    assert.ok(!scripts.includes('prisma:generate'));
    assert.ok(!scripts.includes('npm run test --prefix server'));
    assert.ok(!scripts.includes('npm run test:run --prefix client'));
  });

  it('handles empty input', () => {
    assert.deepEqual(getOrderedScripts([]), []);
    assert.deepEqual(getOrderedScripts(null), []);
  });

  it('handles Windows backslash paths correctly', () => {
    const scripts = getOrderedScripts(['server\\prisma\\schema.prisma']);
    assert.deepEqual(scripts, ['prisma:generate', 'verify:prisma-migrations', 'format:check']);
  });
});

describe('scriptToCommand', () => {
  it('wraps simple script name in npm run', () => {
    assert.equal(scriptToCommand('test:scripts'), 'npm run test:scripts');
    assert.equal(scriptToCommand('format:check'), 'npm run format:check');
  });

  it('leaves already prefixed npm commands untouched', () => {
    assert.equal(scriptToCommand('npm run test --prefix server'), 'npm run test --prefix server');
  });
});

describe('getAffectedScopes', () => {
  it('classifies changed files into human-readable scopes', () => {
    const scopes = getAffectedScopes([
      'server/src/main.ts',
      'client/src/App.tsx',
      'scripts/verify-diff.mjs',
      'AI_GUIDE.md',
      'other.txt',
    ]);
    assert.deepEqual(scopes, ['client/src', 'documentation', 'other', 'scripts', 'server/src']);
  });
});

describe('findCrlfCorruption', () => {
  it('returns empty array when there is no \\r\\r\\n corruption', () => {
    const cleanUnix = 'line 1\nline 2\nline 3\n';
    const cleanWindows = 'line 1\r\nline 2\r\nline 3\r\n';

    assert.deepEqual(findCrlfCorruption({ relativePath: 'clean.ts', source: cleanUnix }), []);
    assert.deepEqual(findCrlfCorruption({ relativePath: 'clean.ts', source: cleanWindows }), []);
  });

  it('detects \\r\\r\\n corruption and reports file and line numbers', () => {
    const corrupted = 'line 1\r\r\nline 2\nline 3\r\r\nline 4\n';
    const errors = findCrlfCorruption({ relativePath: 'bad.ts', source: corrupted });

    assert.equal(errors.length, 2);
    assert.match(errors[0], /bad\.ts:1: corrupted line ending \\r\\r\\n found/);
    assert.match(errors[1], /bad\.ts:3: corrupted line ending \\r\\r\\n found/);
  });

  it('handles non-string source safely', () => {
    assert.deepEqual(findCrlfCorruption({ relativePath: 'test.ts', source: null }), []);
  });
});

describe('differsOnlyByLineEndings', () => {
  it('returns false when contents are identical', () => {
    assert.equal(differsOnlyByLineEndings('hello\r\nworld', 'hello\r\nworld'), false);
    assert.equal(differsOnlyByLineEndings('hello\nworld', 'hello\nworld'), false);
  });

  it('returns true when contents differ only by CRLF vs LF', () => {
    const unix = 'first line\nsecond line\nthird line';
    const windows = 'first line\r\nsecond line\r\nthird line';
    assert.equal(differsOnlyByLineEndings(unix, windows), true);
    assert.equal(differsOnlyByLineEndings(windows, unix), true);
  });

  it('returns false when contents have textual differences', () => {
    const a = 'first line\nsecond line';
    const b = 'first line\r\nsecond line modified';
    assert.equal(differsOnlyByLineEndings(a, b), false);
  });

  it('handles non-string inputs safely', () => {
    assert.equal(differsOnlyByLineEndings(null, 'test'), false);
    assert.equal(differsOnlyByLineEndings('test', undefined), false);
  });
});

describe('reachability of verify:local pipeline gates from changed-scopes', () => {
  const UNLINKED_GATE_EXCEPTIONS = [
    {
      gate: 'verify:gates',
      reason:
        'Mutation verification runner mutates files intentionally; omitted from diff pre-flight',
    },
    {
      gate: 'build --prefix server',
      reason:
        'Full NestJS production build is a release/packaging step; pre-flight relies on typecheck and tests instead',
    },
    {
      gate: 'build --prefix client',
      reason:
        'Full Vite production bundle is a release/packaging step; pre-flight relies on typecheck and client tests instead',
    },
  ];

  it('ensures every gate in verify:local is reachable from changed-scopes or documented as an exception', () => {
    const pkgPath = resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const verifyLocal = pkg.scripts?.['verify:local'] ?? '';

    assert.ok(verifyLocal, 'verify:local script must exist in package.json');

    const pipelineCommands = verifyLocal
      .split('&&')
      .map((seg) => seg.trim())
      .filter((seg) => seg.startsWith('npm run '));

    // Representative sample paths testing all scopes and triggers in changed-scopes.mjs
    const samplePaths = [
      'server/prisma/schema.prisma',
      'server/prisma/migrations/20250101_init/migration.sql',
      'server/src/users/users.controller.ts',
      'server/src/users/users.dto.ts',
      'server/src/main.ts',
      'client/src/shared/api/api.ts',
      'client/src/shared/api/interceptors.ts',
      'client/src/app/App.tsx',
      'scripts/verify-diff.mjs',
      'package.json',
      'server/package.json',
      'client/package.json',
      'template/features.manifest.json',
      '.github/workflows/ci.yml',
      'AI_GUIDE.md',
      'README.md',
      'AGENTS.md',
      'docs/adr/001.md',
      '.serena/memories/tech-stack.md',
      'docker-compose.yml',
      'server/Dockerfile',
      'client/Dockerfile',
      'client/vite.config.ts',
    ];

    const reachableCommands = new Set();
    for (const p of samplePaths) {
      for (const s of getScriptsForFile(p)) {
        reachableCommands.add(scriptToCommand(s));
      }
    }

    const unreachedGates = [];
    for (const cmd of pipelineCommands) {
      const isExcepted = UNLINKED_GATE_EXCEPTIONS.some(
        (exc) => exc.gate === cmd || `npm run ${exc.gate}` === cmd,
      );
      if (isExcepted) {
        continue;
      }
      if (!reachableCommands.has(cmd)) {
        unreachedGates.push(cmd);
      }
    }

    assert.deepEqual(
      unreachedGates,
      [],
      `Unreachable gate(s) in verify:local: ${unreachedGates.join(', ')}. ` +
        'Every pipeline gate must be reachable from changed-scopes or explicitly excepted with a reason.',
    );
  });
});
