import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

import { checkWriteGuard } from './write-guard.mjs';

const adapterPath = fileURLToPath(new URL('../claude-write-guard.mjs', import.meta.url));

const runAdapter = (stdin) => {
  const result = spawnSync(process.execPath, [adapterPath], {
    input: stdin,
    encoding: 'utf8',
  });
  return result;
};

describe('checkWriteGuard: generated API client', () => {
  it('rejects a write inside client/src/shared/api/generated/', () => {
    const violations = checkWriteGuard({
      toolName: 'Write',
      filePath: 'client/src/shared/api/generated/users/users.ts',
      addedContent: 'export const useUsersControllerGetUsers = () => {};',
    });
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, 'generated-api-client');
    assert.match(violations[0].message, /npm run gen:api/);
  });

  it('rejects a write inside client/src/shared/api/model/', () => {
    const violations = checkWriteGuard({
      toolName: 'Edit',
      filePath: 'client/src/shared/api/model/userDto.ts',
      addedContent: 'export interface UserDto { id: number; }',
    });
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, 'generated-api-client');
  });

  it('allows a write to a hand-written client file next to the generated directories', () => {
    const violations = checkWriteGuard({
      toolName: 'Write',
      filePath: 'client/src/shared/api/schemas.ts',
      addedContent: 'export const userSchema = z.object({});',
    });
    assert.deepEqual(violations, []);
  });
});

describe('checkWriteGuard: INV-1 api.ts mutator', () => {
  it('rejects window usage added to client/src/shared/api/api.ts', () => {
    const violations = checkWriteGuard({
      toolName: 'Edit',
      filePath: 'client/src/shared/api/api.ts',
      addedContent: 'if (typeof window !== "undefined") { console.log(window.location); }',
    });
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, 'inv-1-api-mutator');
    assert.match(violations[0].message, /interceptors\.ts/);
  });

  it('rejects import.meta usage added to client/src/shared/api/api.ts', () => {
    const violations = checkWriteGuard({
      toolName: 'Edit',
      filePath: 'client/src/shared/api/api.ts',
      addedContent: 'const baseURL = import.meta.env.VITE_API_URL;',
    });
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, 'inv-1-api-mutator');
  });

  it('allows the same window usage added to client/src/shared/api/interceptors.ts', () => {
    const violations = checkWriteGuard({
      toolName: 'Edit',
      filePath: 'client/src/shared/api/interceptors.ts',
      addedContent: 'if (typeof window !== "undefined") { console.log(window.location); }',
    });
    assert.deepEqual(violations, []);
  });
});

describe('checkWriteGuard: INV-2 storage discipline', () => {
  it('rejects direct localStorage use in an ordinary client component', () => {
    const violations = checkWriteGuard({
      toolName: 'Edit',
      filePath: 'client/src/features/auth/ui/login-form.tsx',
      addedContent: 'localStorage.setItem("token", token);',
    });
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, 'inv-2-storage-discipline');
    assert.match(violations[0].message, /safeStorage/);
  });

  it('allows the same localStorage use inside the storage.ts exception file', () => {
    const violations = checkWriteGuard({
      toolName: 'Edit',
      filePath: 'client/src/shared/lib/storage.ts',
      addedContent: 'localStorage.setItem(key, value);',
    });
    assert.deepEqual(violations, []);
  });
});

describe('checkWriteGuard: INV-4b DTO dates', () => {
  it('rejects z.date() added to a server DTO file', () => {
    const violations = checkWriteGuard({
      toolName: 'Edit',
      filePath: 'server/src/users/users.dto.ts',
      addedContent: 'createdAt: z.date(),',
    });
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, 'inv-4b-dto-no-zod-date');
    assert.match(violations[0].message, /z\.string\(\)/);
  });

  it('rejects z.coerce.date() added to any server/src TypeScript file', () => {
    const violations = checkWriteGuard({
      toolName: 'Write',
      filePath: 'server/src/tests/dto/tests.dto.ts',
      addedContent: 'updatedAt: z.coerce.date(),',
    });
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, 'inv-4b-dto-no-zod-date');
  });

  it('allows z.string() added to the same DTO file', () => {
    const violations = checkWriteGuard({
      toolName: 'Edit',
      filePath: 'server/src/users/users.dto.ts',
      addedContent: 'createdAt: z.string(),',
    });
    assert.deepEqual(violations, []);
  });

  it('allows z.date() added to a server spec file, which is excluded from the DTO scan', () => {
    const violations = checkWriteGuard({
      toolName: 'Edit',
      filePath: 'server/src/users/users.dto.spec.ts',
      addedContent: 'const fixture = { createdAt: z.date() };',
    });
    assert.deepEqual(violations, []);
  });
});

describe('checkWriteGuard: path normalization and no fifth rule', () => {
  it('normalizes an absolute Windows path before matching rules', () => {
    const violations = checkWriteGuard({
      toolName: 'Write',
      filePath:
        'C:\\Users\\admin\\orca\\workspaces\\AI_Template\\sargassum\\client\\src\\shared\\api\\api.ts',
      addedContent: 'window.location.href = "/";',
    });
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, 'inv-1-api-mutator');
  });

  it('returns no violations for an unrelated file with unrelated content', () => {
    const violations = checkWriteGuard({
      toolName: 'Write',
      filePath: 'client/src/widgets/dashboard/ui/dashboard-widget.tsx',
      addedContent: 'export const DashboardWidget = () => <div>Dashboard</div>;',
    });
    assert.deepEqual(violations, []);
  });
});

describe('claude-write-guard.mjs adapter', () => {
  it('denies a Write event that introduces a generated-api-client violation', () => {
    const event = {
      tool_name: 'Write',
      tool_input: {
        file_path: 'client/src/shared/api/generated/users/users.ts',
        content: 'export const useUsersControllerGetUsers = () => {};',
      },
    };
    const result = runAdapter(JSON.stringify(event));
    assert.equal(result.status, 0);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.hookSpecificOutput.permissionDecision, 'deny');
    assert.match(parsed.hookSpecificOutput.permissionDecisionReason, /generated-api-client/);
  });

  it('allows an Edit event with no violation', () => {
    const event = {
      tool_name: 'Edit',
      tool_input: {
        file_path: 'client/src/shared/api/schemas.ts',
        old_string: 'foo',
        new_string: 'export const userSchema = z.object({});',
      },
    };
    const result = runAdapter(JSON.stringify(event));
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout), {});
  });

  it('concatenates new_string across a multi-edit payload before checking', () => {
    const event = {
      tool_name: 'Edit',
      tool_input: {
        file_path: 'server/src/users/users.dto.ts',
        edits: [
          { old_string: 'a', new_string: 'id: z.number(),' },
          { old_string: 'b', new_string: 'createdAt: z.date(),' },
        ],
      },
    };
    const result = runAdapter(JSON.stringify(event));
    assert.equal(result.status, 0);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.hookSpecificOutput.permissionDecision, 'deny');
    assert.match(parsed.hookSpecificOutput.permissionDecisionReason, /inv-4b-dto-no-zod-date/);
  });

  it('fails open with {} and exit 0 on invalid JSON stdin', () => {
    const result = runAdapter('not json at all');
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout), {});
  });

  it('fails open with {} and exit 0 on empty stdin', () => {
    const result = runAdapter('');
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout), {});
  });

  it('fails open with {} when tool_input is missing entirely', () => {
    const result = runAdapter(JSON.stringify({ tool_name: 'Write' }));
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout), {});
  });

  it('allows an unrecognized tool_name without crashing', () => {
    const event = {
      tool_name: 'SomeOtherTool',
      tool_input: { file_path: 'client/src/shared/api/api.ts' },
    };
    const result = runAdapter(JSON.stringify(event));
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout), {});
  });
});
