import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildDeclPattern,
  formatSymbolReport,
  indexSymbol,
  isIdentifier,
} from './symbol-index.mjs';

describe('isIdentifier', () => {
  it('accepts valid JS identifiers', () => {
    assert.equal(isIdentifier('someSymbolName'), true);
    assert.equal(isIdentifier('_privateVar'), true);
    assert.equal(isIdentifier('$special'), true);
    assert.equal(isIdentifier('camelCase123'), true);
  });

  it('rejects strings with spaces, Cyrillic or punctuation', () => {
    assert.equal(isIdentifier('Тестовый заголовок интерфейса'), false);
    assert.equal(isIdentifier('hello world'), false);
    assert.equal(isIdentifier('kebab-case'), false);
    assert.equal(isIdentifier('123number'), false);
  });
});

describe('buildDeclPattern', () => {
  const pattern = buildDeclPattern('mySymbol');

  it('matches export const, const, let, var', () => {
    assert.ok(pattern.test('export const mySymbol = 1;'));
    assert.ok(pattern.test('const mySymbol = 1;'));
    assert.ok(pattern.test('let mySymbol: string;'));
    assert.ok(pattern.test('var mySymbol = 1;'));
    assert.ok(pattern.test('export let mySymbol;'));
  });

  it('matches functions, async functions, and default functions', () => {
    assert.ok(pattern.test('export function mySymbol() {}'));
    assert.ok(pattern.test('function mySymbol() {}'));
    assert.ok(pattern.test('export async function mySymbol() {}'));
    assert.ok(pattern.test('async function mySymbol() {}'));
    assert.ok(pattern.test('export default function mySymbol() {}'));
  });

  it('matches classes, abstract classes, interfaces, types, enums', () => {
    assert.ok(pattern.test('export class mySymbol {}'));
    assert.ok(pattern.test('class mySymbol {}'));
    assert.ok(pattern.test('export abstract class mySymbol {}'));
    assert.ok(pattern.test('export interface mySymbol {}'));
    assert.ok(pattern.test('interface mySymbol<T> {}'));
    assert.ok(pattern.test('export type mySymbol = string;'));
    assert.ok(pattern.test('type mySymbol<T> = Record<string, T>;'));
    assert.ok(pattern.test('export enum mySymbol {}'));
    assert.ok(pattern.test('enum mySymbol {}'));
  });

  it('does NOT match re-exports or import statements', () => {
    assert.ok(!pattern.test("export { mySymbol } from './foo';"));
    assert.ok(!pattern.test("import { mySymbol } from './foo';"));
    assert.ok(!pattern.test('const other = mySymbol;'));
  });
});

describe('indexSymbol', () => {
  it('detects a single exported declaration with references and imports', () => {
    const files = [
      {
        relativePath: 'client/src/features/tests/lib/mock-unique-val.ts',
        source: 'export const mockUniqueOptionValue = (val: string) => val;\n',
      },
      {
        relativePath: 'client/src/features/tests/lib/mock-parse.ts',
        source:
          "import { mockUniqueOptionValue } from './mock-unique-val';\n" +
          'const x = mockUniqueOptionValue("test");\n',
      },
    ];

    const result = indexSymbol(files, 'mockUniqueOptionValue');
    assert.equal(result.symbol, 'mockUniqueOptionValue');
    assert.equal(result.declarationsCount, 1);
    assert.equal(result.declarations[0].isExported, true);
    assert.equal(result.declarations[0].line, 1);
    assert.equal(result.filesCount, 2);
    assert.equal(result.referencesCount, 3);
    assert.equal(result.imports.length, 1);
    assert.equal(result.verdict, 'one_declaration');
    assert.equal(result.isCandidateUnusedExport, false);
    assert.equal(result.hasClientServerDrift, false);
  });

  it('detects client/server drift warning when declared in both trees', () => {
    const files = [
      {
        relativePath: 'client/src/features/tests/lib/mock-client-choice.ts',
        source: 'export const mockChoiceLimit = () => 5;\n',
      },
      {
        relativePath: 'server/src/tests/session/mock-server-choice.ts',
        source: 'const mockChoiceLimit = () => 10;\n',
      },
    ];

    const result = indexSymbol(files, 'mockChoiceLimit');
    assert.equal(result.declarationsCount, 2);
    assert.equal(result.verdict, 'multiple_declarations');
    assert.equal(result.hasClientServerDrift, true);
    assert.equal(result.declarations[0].isExported, true);
    assert.equal(result.declarations[1].isExported, false);
  });

  it('detects candidate for unused export when exported but not imported elsewhere', () => {
    const files = [
      {
        relativePath: 'client/src/shared/api/mock-api.ts',
        source: 'export const mockCustomInstance = () => {};\n',
      },
      {
        relativePath: 'scripts/verify-mock.mjs',
        source: '// check if mockCustomInstance is exported\n',
      },
    ];

    const result = indexSymbol(files, 'mockCustomInstance');
    assert.equal(result.declarationsCount, 1);
    assert.equal(result.declarations[0].isExported, true);
    assert.equal(result.isCandidateUnusedExport, true);
  });

  it('handles local unexported declaration in a single file', () => {
    const files = [
      {
        relativePath: 'server/src/mock-setup.ts',
        source:
          'const mockLocalHelper = (origin: string) => origin.trim();\n' +
          'const res = mockLocalHelper("http://localhost");\n',
      },
    ];

    const result = indexSymbol(files, 'mockLocalHelper');
    assert.equal(result.declarationsCount, 1);
    assert.equal(result.declarations[0].isExported, false);
    assert.equal(result.isCandidateUnusedExport, false);
    assert.equal(result.referencesCount, 2);
    assert.equal(result.verdict, 'one_declaration');
  });

  it('treats re-exports as references, not declarations', () => {
    const files = [
      {
        relativePath: 'client/src/features/tests/index.ts',
        source: "export { mockReexportSym } from './lib/mock-choice';\n",
      },
    ];

    const result = indexSymbol(files, 'mockReexportSym');
    assert.equal(result.declarationsCount, 0);
    assert.equal(result.referencesCount, 1);
    assert.equal(result.exports.length, 1);
    assert.equal(result.exports[0].isReexport, true);
  });

  it('marks local declaration exported if separate export statement exists in same file', () => {
    const files = [
      {
        relativePath: 'client/src/lib/foo.ts',
        source: 'const myHelper = () => 1;\nexport { myHelper };\n',
      },
    ];

    const result = indexSymbol(files, 'myHelper');
    assert.equal(result.declarationsCount, 1);
    assert.equal(result.declarations[0].isExported, true);
  });

  it('ignores declarations inside single-line and multiline comments', () => {
    const files = [
      {
        relativePath: 'client/src/lib/bar.ts',
        source:
          '// const commentedOut = 1;\n' +
          '/* const alsoCommented = 2; */\n' +
          '/*\n * const multiLineCommented = 3;\n */\n' +
          'const realSymbol = 4;\n',
      },
    ];

    assert.equal(indexSymbol(files, 'commentedOut').declarationsCount, 0);
    assert.equal(indexSymbol(files, 'alsoCommented').declarationsCount, 0);
    assert.equal(indexSymbol(files, 'multiLineCommented').declarationsCount, 0);
    assert.equal(indexSymbol(files, 'realSymbol').declarationsCount, 1);
  });

  it('handles zero declarations for UI strings or text', () => {
    const files = [
      {
        relativePath: 'client/src/pages/privacy.tsx',
        source: '<h1>Тестовый заголовок интерфейса</h1>\n',
      },
    ];

    const result = indexSymbol(files, 'Тестовый заголовок интерфейса');
    assert.equal(result.declarationsCount, 0);
    assert.equal(result.referencesCount, 1);
    assert.equal(result.verdict, 'zero_declarations');
  });

  it('handles completely unknown symbol cleanly without crashing', () => {
    const files = [
      {
        relativePath: 'server/src/main.ts',
        source: 'console.log("hello");\n',
      },
    ];

    const result = indexSymbol(files, 'unknownNonExistentSymbolXYZ');
    assert.equal(result.declarationsCount, 0);
    assert.equal(result.referencesCount, 0);
    assert.equal(result.filesCount, 0);
    assert.equal(result.verdict, 'zero_declarations');
  });
});

describe('formatSymbolReport', () => {
  it('formats multiple declarations with client/server warning', () => {
    const result = {
      symbol: 'mockChoiceLimit',
      isIdentifier: true,
      declarations: [
        {
          relativePath: 'client/src/features/tests/lib/mock-client.ts',
          line: 10,
          isExported: true,
        },
        {
          relativePath: 'server/src/tests/session/mock-server.ts',
          line: 26,
          isExported: false,
        },
      ],
      declarationsCount: 2,
      referencesCount: 14,
      referencesByFile: {
        'client/src/features/tests/lib/mock-client.ts': [{ line: 10 }],
      },
      filesCount: 6,
      verdict: 'multiple_declarations',
      hasClientServerDrift: true,
      isCandidateUnusedExport: false,
    };

    const output = formatSymbolReport(result);
    assert.ok(output.includes('mockChoiceLimit — 2 declarations, 14 references in 6 files'));
    assert.ok(output.includes('DECLARATIONS'));
    assert.ok(output.includes('exported'));
    assert.ok(output.includes('local'));
    assert.ok(output.includes('WARNING  Declared in both client/ and server/.'));
    assert.ok(output.includes('NEXT     Name is ambiguous'));
  });

  it('formats single declaration with resolved verdict', () => {
    const result = {
      symbol: 'mockOptionValue',
      isIdentifier: true,
      declarations: [
        {
          relativePath: 'client/src/features/tests/lib/mock-val.ts',
          line: 1,
          isExported: true,
        },
      ],
      declarationsCount: 1,
      referencesCount: 12,
      referencesByFile: {
        'client/src/features/tests/lib/mock-val.ts': [{ line: 1 }],
      },
      filesCount: 4,
      verdict: 'one_declaration',
      hasClientServerDrift: false,
      isCandidateUnusedExport: false,
    };

    const output = formatSymbolReport(result);
    assert.ok(output.includes('mockOptionValue — 1 declaration, 12 references in 4 files'));
    assert.ok(output.includes('NEXT     Single declaration found — question resolved here.'));
  });

  it('formats candidate for unused export notice', () => {
    const result = {
      symbol: 'mockUnusedInstance',
      isIdentifier: true,
      declarations: [
        {
          relativePath: 'client/src/shared/api/mock-api.ts',
          line: 26,
          isExported: true,
        },
      ],
      declarationsCount: 1,
      referencesCount: 3,
      referencesByFile: {
        'client/src/shared/api/mock-api.ts': [{ line: 26 }],
      },
      filesCount: 2,
      verdict: 'one_declaration',
      hasClientServerDrift: false,
      isCandidateUnusedExport: true,
    };

    const output = formatSymbolReport(result);
    assert.ok(output.includes('NOTICE   Exported with no imports in other scanned files'));
    assert.ok(output.includes('candidate for'));
  });

  it('formats UI string verdict recommending rg', () => {
    const result = {
      symbol: 'Тестовый заголовок интерфейса',
      isIdentifier: false,
      declarations: [],
      declarationsCount: 0,
      referencesCount: 0,
      referencesByFile: {},
      filesCount: 0,
      verdict: 'zero_declarations',
      hasClientServerDrift: false,
      isCandidateUnusedExport: false,
    };

    const output = formatSymbolReport(result);
    assert.ok(output.includes('VERDICT  Not a code symbol'));
    assert.ok(output.includes('NEXT     Use plain rg'));
  });

  it('formats completely missing symbol with helpful message', () => {
    const result = {
      symbol: 'unknownNonExistentSymbolXYZ',
      isIdentifier: true,
      declarations: [],
      declarationsCount: 0,
      referencesCount: 0,
      referencesByFile: {},
      filesCount: 0,
      verdict: 'zero_declarations',
      hasClientServerDrift: false,
      isCandidateUnusedExport: false,
    };

    const output = formatSymbolReport(result);
    assert.ok(output.includes('unknownNonExistentSymbolXYZ — 0 declarations, 0 references'));
    assert.ok(output.includes('VERDICT  Symbol or text not found anywhere'));
  });
});
