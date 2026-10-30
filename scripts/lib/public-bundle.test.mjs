import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { findPublicBundleLeaks, toClientModulePath } from './public-bundle.mjs';

const root = 'C:\\repo\\client\\src';

const chunks = [
  {
    fileName: 'assets/index.js',
    isEntry: true,
    imports: ['assets/react.js'],
    moduleIds: [`${root}\\main.tsx`, `${root}\\app\\App.tsx`],
  },
  {
    fileName: 'assets/react.js',
    imports: [],
    moduleIds: ['C:/repo/client/node_modules/react/index.js'],
  },
  {
    fileName: 'assets/public-test-run-page.js',
    facadeModuleId: `${root}\\pages\\t\\public-test-run-page.tsx`,
    imports: ['assets/public-test-workspace.js'],
    moduleIds: [`${root}\\pages\\t\\public-test-run-page.tsx`],
  },
  {
    fileName: 'assets/public-test-workspace.js',
    imports: ['assets/tests.js'],
    dynamicImports: ['assets/admin-only.js'],
    moduleIds: [`${root}\\widgets\\public-test-workspace\\index.ts`],
  },
  {
    fileName: 'assets/tests.js',
    imports: [],
    moduleIds: [
      `${root}\\features\\tests\\ui\\test-editor.tsx`,
      `${root}\\shared\\api\\generated\\tests-public\\tests-public.ts`,
    ],
  },
  {
    fileName: 'assets/admin-only.js',
    imports: [],
    moduleIds: [`${root}\\shared\\api\\generated\\admin\\admin.ts`],
  },
];

describe('findPublicBundleLeaks', () => {
  it('reports admin modules reached through static imports of a /t/* page', () => {
    assert.deepEqual(findPublicBundleLeaks(chunks), [
      {
        page: 'src/pages/t/public-test-run-page.tsx',
        chunkCount: 5,
        leaks: ['src/features/tests/ui/test-editor.tsx'],
      },
    ]);
  });

  it('ignores lazily loaded chunks and the public generated client', () => {
    const clean = chunks.map((chunk) =>
      chunk.fileName === 'assets/tests.js' ? { ...chunk, moduleIds: [chunk.moduleIds[1]] } : chunk,
    );
    assert.deepEqual(findPublicBundleLeaks(clean)[0].leaks, []);
  });

  it('finds no pages when the build has no /t/* entrypoint', () => {
    assert.deepEqual(findPublicBundleLeaks(chunks.filter((chunk) => !chunk.facadeModuleId)), []);
  });
});

describe('toClientModulePath', () => {
  it('normalises Windows and query-suffixed ids', () => {
    assert.equal(toClientModulePath(`${root}\\entities\\x.css?inline`), 'src/entities/x.css');
    assert.equal(
      toClientModulePath('/repo/client/node_modules/.pnpm/cmdk/node_modules/cmdk/dist/index.mjs'),
      'node_modules/cmdk/dist/index.mjs',
    );
  });
});
