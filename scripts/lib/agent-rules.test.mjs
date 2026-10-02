import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  checkClaudeImport,
  findMissingAnchors,
  findUnknownEnforcers,
  normalizeWhitespace,
  validateRegistry,
} from './agent-rules.mjs';

const rule = (overrides = {}) => ({
  id: 'storage-discipline',
  group: 'A',
  rule: 'Browser storage is reached only through safeStorage.',
  enforcedBy: ['verify:invariants'],
  anchor: 'Use `safeStorage`',
  ...overrides,
});

const registry = (rules = [rule()]) => ({ alwaysLoadedFiles: ['AGENTS.md'], rules });

describe('validateRegistry', () => {
  it('accepts a well-formed registry', () => {
    assert.deepEqual(validateRegistry(registry()), []);
  });

  it('rejects a registry without rules instead of treating it as nothing to check', () => {
    assert.match(validateRegistry({ alwaysLoadedFiles: ['AGENTS.md'], rules: [] })[0], /empty/);
    assert.match(validateRegistry(null)[0], /"rules" array/);
  });

  it('rejects duplicate ids', () => {
    assert.match(validateRegistry(registry([rule(), rule()])).join('\n'), /duplicate id/);
  });

  // A group A rule is allowed to be terse in the prose because a gate catches the violation.
  // Without a named gate that licence is unearned.
  it('rejects a gated rule that names no gate', () => {
    const errors = validateRegistry(registry([rule({ enforcedBy: [] })]));
    assert.match(errors.join('\n'), /group A but names no gate/);
  });

  it('rejects a prose-only rule that lists a gate', () => {
    const errors = validateRegistry(registry([rule({ group: 'B' })]));
    assert.match(errors.join('\n'), /group B but lists a gate/);
  });

  it('rejects a rule without an anchor', () => {
    assert.match(validateRegistry(registry([rule({ anchor: ' ' })])).join('\n'), /anchor/);
  });
});

describe('findUnknownEnforcers', () => {
  it('flags a gate name that is not a known enforcer', () => {
    const errors = findUnknownEnforcers(registry([rule({ enforcedBy: ['verify:nothing'] })]), [
      'verify:invariants',
    ]);
    assert.match(errors[0], /unknown enforcer "verify:nothing"/);
  });

  it('accepts known enforcers', () => {
    assert.deepEqual(findUnknownEnforcers(registry(), ['verify:invariants']), []);
  });
});

describe('findMissingAnchors', () => {
  it('finds an anchor that markdown wrapped across lines', () => {
    const text = 'Never touch storage directly. Use\n   `safeStorage` from the shared lib.';
    assert.deepEqual(findMissingAnchors(registry(), text), []);
  });

  it('reports the rule whose anchor is gone', () => {
    const errors = findMissingAnchors(registry(), 'Storage is fine to use directly.');
    assert.equal(errors.length, 1);
    assert.match(errors[0], /"storage-discipline" is no longer in the always-loaded instructions/);
  });

  it('normalizes runs of whitespace', () => {
    assert.equal(normalizeWhitespace('  a \r\n   b\tc '), 'a b c');
  });
});

describe('checkClaudeImport', () => {
  it('accepts the import anywhere on a line', () => {
    assert.deepEqual(checkClaudeImport('# Title\n\nShared rules: @AGENTS.md\n', '@AGENTS.md'), []);
  });

  it('reports a missing import', () => {
    assert.match(checkClaudeImport('# Title\n\nSee AGENTS.md.\n', '@AGENTS.md')[0], /import/);
  });

  it('does not accept a longer token that merely contains the import', () => {
    assert.equal(checkClaudeImport('See docs/@AGENTS.md.bak\n', '@AGENTS.md').length, 1);
  });

  it('checks nothing when the registry declares no import', () => {
    assert.deepEqual(checkClaudeImport('# Title\n', undefined), []);
  });
});

describe('the committed registry', () => {
  const committed = JSON.parse(
    readFileSync(new URL('../../template/agent-rules.json', import.meta.url), 'utf8'),
  );

  it('is well-formed', () => {
    assert.deepEqual(validateRegistry(committed), []);
  });

  // The prose-only rules are the ones nothing else protects; an empty group B would mean the
  // registry stopped describing them, not that they all gained gates.
  it('lists both gated and prose-only rules', () => {
    assert.ok(committed.rules.some((entry) => entry.group === 'A'));
    assert.ok(committed.rules.some((entry) => entry.group === 'B'));
  });
});

describe('dropped entries', () => {
  const withDropped = (dropped) => ({ ...registry(), dropped });

  it('accepts a retired text with its reason', () => {
    const errors = validateRegistry(
      withDropped([{ id: 'search-mode', was: 'AI_GUIDE.md, "Search Mode"', reason: 'Generic.' }]),
    );
    assert.deepEqual(errors, []);
  });

  it('rejects a retired text without a reason', () => {
    const errors = validateRegistry(withDropped([{ id: 'search-mode', was: 'AI_GUIDE.md' }]));
    assert.match(errors.join('\n'), /must give the reason/);
  });

  it('rejects an id that is both a live rule and dropped', () => {
    const errors = validateRegistry(
      withDropped([{ id: 'storage-discipline', was: 'somewhere', reason: 'none' }]),
    );
    assert.match(errors.join('\n'), /both as a rule and as dropped/);
  });
});
