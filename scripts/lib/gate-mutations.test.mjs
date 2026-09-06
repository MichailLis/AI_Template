import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  GATE_EXCEPTIONS,
  GATE_MUTATIONS,
  applyMutation,
  checkGateCoverage,
  extractPipelineGates,
} from './gate-mutations.mjs';

describe('applyMutation', () => {
  it('appends content to string', () => {
    const original = 'const a = 1;';
    const mutation = {
      id: 'test-append',
      action: 'append',
      append: '\nconst b = 2;',
    };
    const result = applyMutation(original, mutation);
    assert.equal(result, 'const a = 1;\nconst b = 2;');
  });

  it('appends content to Buffer and preserves Buffer type', () => {
    const original = Buffer.from('const a = 1;\n');
    const mutation = {
      id: 'test-append-buf',
      action: 'append',
      append: 'const b = 2;\n',
    };
    const result = applyMutation(original, mutation);
    assert.ok(Buffer.isBuffer(result));
    assert.equal(result.toString('utf8'), 'const a = 1;\nconst b = 2;\n');
  });

  it('preserves CRLF line endings when appending to CRLF source', () => {
    const original = Buffer.from('line1\r\nline2\r\n');
    const mutation = {
      id: 'test-crlf-append',
      action: 'append',
      append: 'line3\nline4\n',
    };
    const result = applyMutation(original, mutation);
    assert.ok(Buffer.isBuffer(result));
    assert.equal(result.toString('utf8'), 'line1\r\nline2\r\nline3\r\nline4\r\n');
  });

  it('replaces target string in content', () => {
    const original = 'export const foo = 123;';
    const mutation = {
      id: 'test-replace',
      action: 'replace',
      search: 'foo = 123',
      replace: 'bar = 456',
    };
    const result = applyMutation(original, mutation);
    assert.equal(result, 'export const bar = 456;');
  });

  it('replaces target RegExp in content', () => {
    const original = 'const timeout = 1000;';
    const mutation = {
      id: 'test-replace-regex',
      action: 'replace',
      search: /timeout\s*=\s*\d+/,
      replace: 'timeout = 9999',
    };
    const result = applyMutation(original, mutation);
    assert.equal(result, 'const timeout = 9999;');
  });

  it('preserves CRLF line endings during replacement in CRLF source', () => {
    const original = 'header\r\nsearch-me\r\nfooter\r\n';
    const mutation = {
      id: 'test-crlf-replace',
      action: 'replace',
      search: 'search-me',
      replace: 'replacement-1\nreplacement-2',
    };
    const result = applyMutation(original, mutation);
    assert.equal(result, 'header\r\nreplacement-1\r\nreplacement-2\r\nfooter\r\n');
  });

  it('throws error when search target is not found', () => {
    const original = 'const a = 1;';
    const mutation = {
      id: 'test-missing',
      action: 'replace',
      search: 'nonexistent-string',
      replace: 'bar',
    };
    assert.throws(() => applyMutation(original, mutation), /Mutation target.*not found/);
  });

  it('throws error for unknown mutation action', () => {
    const original = 'const a = 1;';
    const mutation = {
      id: 'test-invalid-action',
      action: 'unsupported-action',
    };
    assert.throws(() => applyMutation(original, mutation), /Unknown mutation action/);
  });
});

describe('extractPipelineGates', () => {
  it('extracts verify gates from verify:local and verify:template', () => {
    const mockPackageJson = {
      scripts: {
        'verify:local':
          'npm run verify:ai-guide && npm run verify:contracts && npm run verify:maintainability',
        'verify:template':
          'npm run verify:ai-guide && npm run verify:maintainability && npm run verify:smoke:server',
        'verify:ai-guide': 'node scripts/verify-ai-guide.mjs',
        'verify:contracts': 'npm run gen:openapi && npm run verify:architecture',
        'verify:architecture': 'node scripts/verify-architecture.mjs',
        'verify:maintainability': 'node scripts/verify-maintainability.mjs',
        'verify:smoke:server': 'node scripts/smoke-server.mjs',
      },
    };

    const gates = extractPipelineGates(mockPackageJson);
    const gateScripts = gates.map((g) => g.script);

    assert.ok(gateScripts.includes('scripts/verify-ai-guide.mjs'));
    assert.ok(gateScripts.includes('scripts/verify-architecture.mjs'));
    assert.ok(gateScripts.includes('scripts/verify-maintainability.mjs'));
    assert.ok(gateScripts.includes('scripts/smoke-server.mjs'));
  });
});

describe('checkGateCoverage', () => {
  it('passes when all pipeline gates are covered by mutations or exceptions', () => {
    const pipelineGates = [
      { npmScript: 'verify:a', script: 'scripts/verify-a.mjs', gate: 'verify-a.mjs' },
      { npmScript: 'verify:b', script: 'scripts/verify-b.mjs', gate: 'verify-b.mjs' },
    ];
    const mutations = [{ gate: 'verify-a.mjs', script: 'scripts/verify-a.mjs' }];
    const exceptions = [
      { gate: 'verify-b.mjs', script: 'scripts/verify-b.mjs', reason: 'Explicit test reason' },
    ];

    const result = checkGateCoverage({ mutations, exceptions, pipelineGates });
    assert.equal(result.ok, true);
    assert.equal(result.errors.length, 0);
    assert.equal(result.coveredCount, 1);
    assert.equal(result.exceptedCount, 1);
  });

  it('reports error when a gate is neither mutated nor excepted', () => {
    const pipelineGates = [
      {
        npmScript: 'verify:covered',
        script: 'scripts/verify-covered.mjs',
        gate: 'verify-covered.mjs',
      },
      {
        npmScript: 'verify:uncovered',
        script: 'scripts/verify-uncovered.mjs',
        gate: 'verify-uncovered.mjs',
      },
    ];
    const mutations = [{ gate: 'verify-covered.mjs', script: 'scripts/verify-covered.mjs' }];
    const exceptions = [];

    const result = checkGateCoverage({ mutations, exceptions, pipelineGates });
    assert.equal(result.ok, false);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /Gate "verify:uncovered".*has no mutations/);
  });

  it('reports error when an exception does not provide a reason', () => {
    const pipelineGates = [
      { npmScript: 'verify:a', script: 'scripts/verify-a.mjs', gate: 'verify-a.mjs' },
    ];
    const mutations = [];
    const exceptions = [{ gate: 'verify-a.mjs', script: 'scripts/verify-a.mjs', reason: '' }];

    const result = checkGateCoverage({ mutations, exceptions, pipelineGates });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((err) => err.includes('must provide a non-empty text reason')));
  });
});

describe('GATE_MUTATIONS and GATE_EXCEPTIONS registry invariants', () => {
  it('ensures each mutation has a unique id and required fields', () => {
    const seenIds = new Set();

    for (const mutation of GATE_MUTATIONS) {
      assert.ok(mutation.id, 'Mutation must have an id');
      assert.ok(!seenIds.has(mutation.id), `Duplicate mutation id: ${mutation.id}`);
      seenIds.add(mutation.id);

      assert.ok(mutation.gate, `Mutation ${mutation.id} must have a gate`);
      assert.ok(mutation.script, `Mutation ${mutation.id} must have a script path`);
      assert.ok(mutation.file, `Mutation ${mutation.id} must have a file`);
      assert.ok(mutation.description, `Mutation ${mutation.id} must have a description`);
      assert.ok(
        mutation.action === 'append' || mutation.action === 'replace',
        `Mutation ${mutation.id} must have valid action`,
      );
    }
  });

  it('ensures each gate in registry has at least two mutations', () => {
    const mutationsPerGate = new Map();

    for (const mutation of GATE_MUTATIONS) {
      const count = mutationsPerGate.get(mutation.gate) ?? 0;
      mutationsPerGate.set(mutation.gate, count + 1);
    }

    for (const [gate, count] of mutationsPerGate) {
      assert.ok(count >= 2, `Gate ${gate} must have at least 2 mutations, found ${count}`);
    }
  });

  it('ensures all exceptions have non-empty text reasons', () => {
    assert.ok(GATE_EXCEPTIONS.length > 0, 'There must be at least one exception');

    for (const exception of GATE_EXCEPTIONS) {
      assert.ok(exception.gate, 'Exception must specify gate');
      assert.ok(
        typeof exception.reason === 'string' && exception.reason.trim().length > 10,
        `Exception for ${exception.gate} must provide a substantial reason`,
      );
    }
  });
});
