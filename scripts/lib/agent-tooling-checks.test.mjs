import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  checkComposeProjectName,
  checkRootTypescript,
  checkRtkHookExclusions,
  checkSerenaBinary,
  deriveRtkHookExclusions,
  extractExcludeCommands,
  formatReport,
  runAgentToolingChecks,
} from './agent-tooling-checks.mjs';

const REQUIRED_EXCLUSIONS = ['tsc', 'vitest', 'jest', 'playwright', 'find', 'wc', 'tree'];

describe('extractExcludeCommands', () => {
  it('extracts command strings from TOML exclude_commands array', () => {
    const toml = `
[hooks]
exclude_commands = [
    "tsc",
    'vitest',
    "jest",
]
`;
    assert.deepEqual(extractExcludeCommands(toml), ['tsc', 'vitest', 'jest']);
  });

  it('returns empty array when exclude_commands is not present or input is invalid', () => {
    assert.deepEqual(extractExcludeCommands(''), []);
    assert.deepEqual(extractExcludeCommands(null), []);
    assert.deepEqual(extractExcludeCommands(undefined), []);
    assert.deepEqual(extractExcludeCommands('[hooks]\nenabled = true'), []);
  });
});

describe('deriveRtkHookExclusions', () => {
  it('extracts single-word subcommands from rtk commands (e.g. rtk tsc -> tsc)', () => {
    assert.deepEqual(deriveRtkHookExclusions(['rtk tsc']), ['tsc']);
  });

  it('discards multi-word or flagged commands like rtk read -l aggressive', () => {
    assert.deepEqual(deriveRtkHookExclusions(['rtk read -l aggressive']), []);
    assert.deepEqual(deriveRtkHookExclusions(['rtk tsc', 'rtk read -l aggressive', 'rtk vitest']), [
      'tsc',
      'vitest',
    ]);
  });

  it('automatically includes hypothetical new commands like rtk newdanger', () => {
    assert.deepEqual(deriveRtkHookExclusions(['rtk tsc', 'rtk newdanger']), ['tsc', 'newdanger']);
  });

  it('returns empty array when input is empty or invalid', () => {
    assert.deepEqual(deriveRtkHookExclusions([]), []);
    assert.deepEqual(deriveRtkHookExclusions(null), []);
    assert.deepEqual(deriveRtkHookExclusions(undefined), []);
    assert.deepEqual(deriveRtkHookExclusions('invalid'), []);
    assert.deepEqual(deriveRtkHookExclusions(123), []);
    assert.deepEqual(deriveRtkHookExclusions([null, 123, {}, '   ']), []);
  });

  it('derives expected default exclusions from standard unsafe filter list', () => {
    const unsafe = [
      'rtk tsc',
      'rtk vitest',
      'rtk jest',
      'rtk playwright',
      'rtk find',
      'rtk wc',
      'rtk tree',
      'rtk read -l aggressive',
    ];
    assert.deepEqual(deriveRtkHookExclusions(unsafe), REQUIRED_EXCLUSIONS);
  });
});

describe('checkRtkHookExclusions', () => {
  it('returns ok when config is null (rtk not installed or no config)', () => {
    const result = checkRtkHookExclusions(null, REQUIRED_EXCLUSIONS);
    assert.equal(result.id, 'rtk');
    assert.equal(result.status, 'ok');
    assert.equal(result.fix, null);
    assert.match(result.message, /nothing to check/i);
  });

  it('returns ok when config is undefined', () => {
    const result = checkRtkHookExclusions(undefined, REQUIRED_EXCLUSIONS);
    assert.equal(result.status, 'ok');
    assert.equal(result.fix, null);
  });

  it('returns ok when all required exclusions are present', () => {
    const toml = `
[hooks]
exclude_commands = [
    "eslint",
    "tsc",
    "vitest",
    "jest",
    "playwright",
    "find",
    "wc",
    "tree",
    "git",
]
`;
    const result = checkRtkHookExclusions(toml, REQUIRED_EXCLUSIONS);
    assert.equal(result.id, 'rtk');
    assert.equal(result.status, 'ok');
    assert.equal(result.fix, null);
    assert.match(result.message, /includes all required hook exclusions/i);
  });

  it('returns problem and names missing exclusions when only partially present', () => {
    const toml = `
[hooks]
exclude_commands = [
    "tsc",
    "find",
]
`;
    const result = checkRtkHookExclusions(toml, REQUIRED_EXCLUSIONS);
    assert.equal(result.id, 'rtk');
    assert.equal(result.status, 'problem');
    assert.ok(result.fix !== null);

    // Missing: vitest, jest, playwright, wc, tree
    assert.match(result.message, /vitest/);
    assert.match(result.message, /jest/);
    assert.match(result.message, /playwright/);
    assert.match(result.message, /wc/);
    assert.match(result.message, /tree/);
    // Already present: tsc, find should NOT be in missing list
    assert.doesNotMatch(result.message, /missing required hook exclusions:.*?\btsc\b/);

    assert.match(result.fix, /hooks\.exclude_commands/);
  });

  it('returns problem when exclude_commands block is completely missing from config', () => {
    const toml = `
[tracking]
enabled = true
`;
    const result = checkRtkHookExclusions(toml, REQUIRED_EXCLUSIONS);
    assert.equal(result.id, 'rtk');
    assert.equal(result.status, 'problem');
    for (const cmd of REQUIRED_EXCLUSIONS) {
      assert.match(result.message, new RegExp(`\\b${cmd}\\b`));
    }
  });
});

describe('checkSerenaBinary', () => {
  it('returns ok when Serena binary is resolved on PATH', () => {
    const result = checkSerenaBinary(true);
    assert.equal(result.id, 'serena');
    assert.equal(result.status, 'ok');
    assert.equal(result.fix, null);
    assert.match(result.message, /resolved on PATH/i);
  });

  it('returns problem with exact install fix when Serena binary is missing', () => {
    const result = checkSerenaBinary(false);
    assert.equal(result.id, 'serena');
    assert.equal(result.status, 'problem');
    assert.match(result.message, /30-second MCP/);
    assert.match(result.message, /uvx/);
    assert.equal(
      result.fix,
      'uv tool install serena-agent --from git+https://github.com/oraios/serena',
    );
  });
});

describe('checkRootTypescript', () => {
  it('returns ok when root typescript is resolved', () => {
    const result = checkRootTypescript(true);
    assert.equal(result.id, 'typescript');
    assert.equal(result.status, 'ok');
    assert.equal(result.fix, null);
    assert.match(result.message, /resolved/i);
  });

  it('returns problem when root typescript is missing', () => {
    const result = checkRootTypescript(false);
    assert.equal(result.id, 'typescript');
    assert.equal(result.status, 'problem');
    assert.match(result.message, /typescript-lsp/);
    assert.match(result.message, /findReferences/);
    assert.match(result.message, /incomingCalls/);
    assert.ok(result.fix !== null);
  });
});

describe('checkComposeProjectName', () => {
  it('returns ok when docker-compose pins top-level name to ai_template', () => {
    const yaml = 'name: ai_template\nservices:\n  postgres:\n    image: postgres:16-alpine\n';
    const result = checkComposeProjectName(yaml);
    assert.equal(result.id, 'compose');
    assert.equal(result.status, 'ok');
    assert.equal(result.fix, null);
  });

  it('returns ok with quoted name values', () => {
    assert.equal(checkComposeProjectName('name: "ai_template"\nservices:\n').status, 'ok');
    assert.equal(checkComposeProjectName("name: 'ai_template'\nservices:\n").status, 'ok');
  });

  it('returns problem when docker-compose has a different project name', () => {
    const yaml = 'name: sargassum\nservices:\n  postgres:\n    image: postgres:16-alpine\n';
    const result = checkComposeProjectName(yaml);
    assert.equal(result.id, 'compose');
    assert.equal(result.status, 'problem');
    assert.match(result.message, /sargassum/);
    assert.match(result.message, /expected "ai_template"/);
    assert.match(result.message, /worktree/);
    assert.match(result.fix, /name: ai_template/);
  });

  it('returns problem when top-level name key is missing', () => {
    const yaml = 'services:\n  postgres:\n    image: postgres:16-alpine\n';
    const result = checkComposeProjectName(yaml);
    assert.equal(result.id, 'compose');
    assert.equal(result.status, 'problem');
    assert.match(result.message, /missing top-level "name" key/);
    assert.match(result.fix, /name: ai_template/);
  });

  it('returns problem when compose file is empty or null', () => {
    assert.equal(checkComposeProjectName('').status, 'problem');
    assert.equal(checkComposeProjectName(null).status, 'problem');
    assert.equal(checkComposeProjectName(undefined).status, 'problem');
  });
});

describe('runAgentToolingChecks and formatReport', () => {
  it('runs all four checks and returns structured results', () => {
    const results = runAgentToolingChecks({
      rtkConfig: 'exclude_commands = ["tsc", "vitest", "jest", "playwright", "find", "wc", "tree"]',
      requiredHookExclusions: REQUIRED_EXCLUSIONS,
      hasSerena: true,
      hasRootTypescript: true,
      dockerComposeContent: 'name: ai_template\nservices:\n',
    });

    assert.equal(results.length, 4);
    assert.ok(results.every((r) => r.status === 'ok'));

    const report = formatReport(results);
    assert.match(report, /\[ok\]\s+rtk:/);
    assert.match(report, /\[ok\]\s+serena:/);
    assert.match(report, /\[ok\]\s+typescript:/);
    assert.match(report, /\[ok\]\s+compose:/);
    assert.doesNotMatch(report, /Actionable fixes:/);
  });

  it('formats problem report with actionable fixes', () => {
    const results = runAgentToolingChecks({
      rtkConfig: null,
      requiredHookExclusions: REQUIRED_EXCLUSIONS,
      hasSerena: false,
      hasRootTypescript: false,
      dockerComposeContent: 'name: wrong_project\n',
    });

    assert.equal(results.filter((r) => r.status === 'problem').length, 3);
    const report = formatReport(results);
    assert.match(report, /\[problem\] serena:/);
    assert.match(report, /\[problem\] typescript:/);
    assert.match(report, /\[problem\] compose:/);
    assert.match(report, /Actionable fixes:/);
    assert.match(report, /uv tool install serena-agent/);
  });
});
