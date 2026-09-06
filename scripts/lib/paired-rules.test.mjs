import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  extractTopLevelDeclarations,
  isIgnoredClientPath,
  isTestOrSpecPath,
  parseConstantLiteral,
  scanTopLevelSymbols,
  validateRegistryStructure,
  verifyPairedRules,
} from './paired-rules.mjs';

describe('isTestOrSpecPath', () => {
  it('correctly classifies test and spec files', () => {
    assert.equal(isTestOrSpecPath('src/foo.test.ts'), true);
    assert.equal(isTestOrSpecPath('src/foo.test.tsx'), true);
    assert.equal(isTestOrSpecPath('src/foo.spec.ts'), true);
    assert.equal(isTestOrSpecPath('src/foo.ts'), false);
    assert.equal(isTestOrSpecPath('src/foo.tsx'), false);
  });
});

describe('isIgnoredClientPath', () => {
  it('identifies generated or model api client paths', () => {
    assert.equal(isIgnoredClientPath('client/src/shared/api/generated/tests.ts'), true);
    assert.equal(isIgnoredClientPath('client/src/shared/api/model/types.ts'), true);
    assert.equal(isIgnoredClientPath('client\\src\\shared\\api\\generated\\tests.ts'), true);
    assert.equal(isIgnoredClientPath('client/src/shared/api/api.ts'), false);
  });
});

describe('extractTopLevelDeclarations', () => {
  it('extracts declarations starting at line beginning', () => {
    const source = [
      'const FOO = 1;',
      'export const BAR = "hello";',
      'function doStuff() {}',
      'export async function asyncStuff() {}',
      'class MyClass {}',
      'export default class DefaultClass {}',
      '  const INDENTED = 2;',
      '  function indentedFunc() {}',
    ].join('\n');

    const decls = extractTopLevelDeclarations(source);
    const names = decls.map((d) => d.name);

    assert.deepEqual(names, ['FOO', 'BAR', 'doStuff', 'asyncStuff', 'MyClass', 'DefaultClass']);
  });

  it('handles empty or non-string input safely', () => {
    assert.deepEqual(extractTopLevelDeclarations(''), []);
    assert.deepEqual(extractTopLevelDeclarations(null), []);
  });
});

describe('parseConstantLiteral', () => {
  it('parses numeric, string, and boolean constant literals', () => {
    const source = [
      'export const NUM = 42;',
      'const NEG = -10.5;',
      'const STR1 = "value";',
      "const STR2 = 'single';",
      'const BOOL = true;',
      'const TYPED: number = 100;',
    ].join('\n');

    assert.equal(parseConstantLiteral(source, 'NUM'), 42);
    assert.equal(parseConstantLiteral(source, 'NEG'), -10.5);
    assert.equal(parseConstantLiteral(source, 'STR1'), 'value');
    assert.equal(parseConstantLiteral(source, 'STR2'), 'single');
    assert.equal(parseConstantLiteral(source, 'BOOL'), true);
    assert.equal(parseConstantLiteral(source, 'TYPED'), 100);
    assert.equal(parseConstantLiteral(source, 'NON_EXISTENT'), null);
  });
});

describe('validateRegistryStructure', () => {
  it('validates correct registry structure', () => {
    const valid = {
      version: 1,
      rules: [
        {
          name: 'ruleA',
          type: 'constant',
          authority: 'server',
          client: { file: 'client/a.ts' },
          server: { file: 'server/a.ts' },
          reason: 'Constant parity',
        },
        {
          name: 'ruleB',
          type: 'behaviour',
          authority: 'server',
          client: { file: 'client/b.ts', testFile: 'client/b.test.ts' },
          server: { file: 'server/b.ts', testFile: 'server/b.spec.ts' },
          reason: 'Behaviour parity',
        },
        {
          name: 'ruleC',
          type: 'unrelated',
          client: { file: 'client/c.ts' },
          server: { file: 'server/c.ts' },
          reason: 'Accidental name coincidence',
        },
      ],
    };

    const res = validateRegistryStructure(valid);
    assert.equal(res.ok, true);
    assert.equal(res.errors.length, 0);
  });

  it('detects structural errors in registry', () => {
    const invalid = {
      version: 2,
      rules: [
        {
          name: 'duplicate',
          type: 'unknown',
          client: {},
          server: {},
        },
        {
          name: 'duplicate',
          type: 'unrelated',
          client: { file: 'c.ts' },
          server: { file: 's.ts' },
          reason: '',
        },
      ],
    };

    const res = validateRegistryStructure(invalid);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('version')));
    assert.ok(res.errors.some((e) => e.includes('Duplicate rule name')));
    assert.ok(res.errors.some((e) => e.includes('invalid type')));
    assert.ok(res.errors.some((e) => e.includes('must define client.file')));
    assert.ok(res.errors.some((e) => e.includes('must provide a non-empty text reason')));
  });
});

describe('scanTopLevelSymbols', () => {
  it('finds top-level symbols shared between client and server', () => {
    const clientFiles = [
      {
        relativePath: 'client/src/a.ts',
        source: 'const SHARED_1 = 1;\nfunction clientOnly() {}',
      },
      {
        relativePath: 'client/src/b.ts',
        source: 'export const SHARED_2 = 2;',
      },
      {
        relativePath: 'client/src/c.test.ts',
        source: 'const SHARED_IN_TEST = 3;',
      },
    ];

    const serverFiles = [
      {
        relativePath: 'server/src/a.ts',
        source: 'const SHARED_1 = 1;\nexport const SHARED_2 = 2;\nfunction serverOnly() {}',
      },
      {
        relativePath: 'server/src/b.ts',
        source: 'const SHARED_IN_TEST = 3;',
      },
    ];

    const { commonNames } = scanTopLevelSymbols({ clientFiles, serverFiles });
    assert.deepEqual(commonNames, ['SHARED_1', 'SHARED_2']);
  });
});

describe('verifyPairedRules', () => {
  const createMockContext = (overrides = {}) => {
    const files = new Map([
      ['client/a.ts', 'export const MAX_COUNT = 5;\nexport const helper = () => true;'],
      ['server/a.ts', 'export const MAX_COUNT = 5;\nexport const helper = () => true;'],
      ['client/a.test.ts', "import vectors from 'template/paired-rules.vectors.json';\nhelper();"],
      ['server/a.spec.ts', "import vectors from 'template/paired-rules.vectors.json';\nhelper();"],
    ]);

    const registry = {
      version: 1,
      rules: [
        {
          name: 'MAX_COUNT',
          type: 'constant',
          authority: 'server',
          client: { file: 'client/a.ts' },
          server: { file: 'server/a.ts' },
          reason: 'Constant limit',
        },
        {
          name: 'helper',
          type: 'behaviour',
          authority: 'server',
          client: { file: 'client/a.ts', testFile: 'client/a.test.ts' },
          server: { file: 'server/a.ts', testFile: 'server/a.spec.ts' },
          reason: 'Shared behaviour',
        },
      ],
    };

    const vectorsDoc = {
      version: 1,
      vectors: {
        helper: [
          { input: 1, expected: true },
          { input: 2, expected: true },
          { input: 3, expected: true },
          { input: 4, expected: true },
          { input: 5, expected: true },
          { input: 6, expected: true },
        ],
      },
    };

    const clientFiles = [{ relativePath: 'client/a.ts', source: files.get('client/a.ts') }];
    const serverFiles = [{ relativePath: 'server/a.ts', source: files.get('server/a.ts') }];

    return {
      registry,
      vectorsDoc,
      clientFiles,
      serverFiles,
      readContent: (p) => files.get(p) ?? '',
      fileExists: (p) => files.has(p),
      files,
      ...overrides,
    };
  };

  it('passes on valid mock configuration', () => {
    const ctx = createMockContext();
    const result = verifyPairedRules(ctx);
    assert.equal(result.ok, true, `Expected ok, got errors: ${result.errors.join('; ')}`);
    assert.equal(result.errors.length, 0);
  });

  it('catches constant value mismatch', () => {
    const ctx = createMockContext();
    ctx.files.set('client/a.ts', 'export const MAX_COUNT = 10;\nexport const helper = () => true;');
    ctx.clientFiles[0].source = ctx.files.get('client/a.ts');

    const result = verifyPairedRules(ctx);
    assert.equal(result.ok, false);
    assert.ok(
      result.errors.some(
        (e) =>
          e.includes('Constant "MAX_COUNT" value mismatch') && e.includes('10') && e.includes('5'),
      ),
    );
  });

  it('catches undeclared paired symbol (closing rule)', () => {
    const ctx = createMockContext();
    ctx.files.set(
      'client/a.ts',
      'export const MAX_COUNT = 5;\nexport const helper = () => true;\nexport const undeclaredPair = 1;',
    );
    ctx.files.set(
      'server/a.ts',
      'export const MAX_COUNT = 5;\nexport const helper = () => true;\nexport const undeclaredPair = 1;',
    );
    ctx.clientFiles[0].source = ctx.files.get('client/a.ts');
    ctx.serverFiles[0].source = ctx.files.get('server/a.ts');

    const result = verifyPairedRules(ctx);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('Undeclared paired symbol "undeclaredPair"')));
  });

  it('catches disconnected behaviour vectors or missing test files', () => {
    const ctx = createMockContext();
    ctx.files.set('client/a.test.ts', '// test without vectors import\nhelper();');

    const result = verifyPairedRules(ctx);
    assert.equal(result.ok, false);
    assert.ok(
      result.errors.some((e) =>
        e.includes(
          'client test file "client/a.test.ts" does not read or import template/paired-rules.vectors.json',
        ),
      ),
    );
  });
});
