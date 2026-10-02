import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { checkStack, parseMajor, validateStackDeclaration } from './stack-check.mjs';

const declaration = {
  packages: [
    { name: 'vite', manifest: 'client/package.json', major: 8 },
    { name: 'zustand', manifest: 'client/package.json', major: 5 },
  ],
};

const manifests = (overrides = {}) => ({
  'client/package.json': {
    dependencies: { zustand: '^5.0.15' },
    devDependencies: { vite: '^8.3.1' },
    ...overrides,
  },
});

describe('parseMajor', () => {
  it('reads the major out of common range forms', () => {
    assert.equal(parseMajor('^8.3.1'), 8);
    assert.equal(parseMajor('~6.0.3'), 6);
    assert.equal(parseMajor('4.3.3'), 4);
    assert.equal(parseMajor('>=19 <20'), 19);
    assert.equal(parseMajor('11'), 11);
    assert.equal(parseMajor('8.0.0-beta.1'), 8);
  });

  // An unreadable range must not be mistaken for "nothing to compare".
  it('returns null for ranges without a leading version', () => {
    assert.equal(parseMajor('latest'), null);
    assert.equal(parseMajor('workspace:*'), null);
    assert.equal(parseMajor('github:user/repo'), null);
    assert.equal(parseMajor(undefined), null);
  });
});

describe('validateStackDeclaration', () => {
  it('accepts a well-formed declaration', () => {
    assert.deepEqual(validateStackDeclaration(declaration), []);
  });

  it('rejects an empty declaration instead of passing with nothing to check', () => {
    assert.equal(validateStackDeclaration({ packages: [] }).length, 1);
    assert.equal(validateStackDeclaration(null).length, 1);
  });

  it('rejects an entry without an integer major', () => {
    const errors = validateStackDeclaration({
      packages: [{ name: 'vite', manifest: 'client/package.json', major: '8' }],
    });
    assert.match(errors.join('\n'), /integer "major"/);
  });
});

describe('checkStack', () => {
  it('passes when every package is on its declared major', () => {
    assert.deepEqual(checkStack(declaration, manifests()), []);
  });

  it('reports a major bump', () => {
    const errors = checkStack(declaration, manifests({ devDependencies: { vite: '^9.0.0' } }));
    assert.equal(errors.length, 1);
    assert.match(errors[0], /"vite" is at major 9 .* fixed at major 8/);
  });

  it('reports a stack library that was removed', () => {
    const errors = checkStack(declaration, manifests({ dependencies: {} }));
    assert.match(errors[0], /"zustand" is part of the fixed stack and is no longer a dependency/);
  });

  it('reports a range it cannot read', () => {
    const errors = checkStack(declaration, manifests({ dependencies: { zustand: 'latest' } }));
    assert.match(errors[0], /cannot read a major version/);
  });

  it('reports a manifest that was not supplied', () => {
    assert.match(checkStack(declaration, {})[0], /could not be read/);
  });
});

describe('the committed declaration', () => {
  const committed = JSON.parse(
    readFileSync(new URL('../../template/stack.json', import.meta.url), 'utf8'),
  );

  it('is well-formed', () => {
    assert.deepEqual(validateStackDeclaration(committed), []);
  });
});
