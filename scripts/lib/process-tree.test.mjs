import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { getProcessTreeSpawnOptions, stopProcessTree } from './process-tree.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForFile = async (filePath, timeoutMs) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (existsSync(filePath)) {
      return;
    }

    await sleep(25);
  }

  throw new Error(`Timed out waiting for ${filePath}`);
};

const isProcessAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const waitForProcessExit = async (pid, timeoutMs) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (!isProcessAlive(pid)) {
      return;
    }

    await sleep(25);
  }

  throw new Error(`Process ${pid} is still alive`);
};

test('stopProcessTree rejects when process shutdown cannot be confirmed', async () => {
  const child = new EventEmitter();
  child.exitCode = null;
  child.signalCode = null;
  child.kill = () => true;

  await assert.rejects(stopProcessTree(child, { timeoutMs: 10 }), /process/i);
});

test('getProcessTreeSpawnOptions preserves an explicit detached override', () => {
  assert.equal(getProcessTreeSpawnOptions({ detached: false }).detached, false);
});

test('stopProcessTree terminates a spawned process tree', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'process-tree-'));
  const grandchildPidFile = join(tempDir, 'grandchild.pid');
  const childScript = [
    "const { spawn } = require('node:child_process');",
    "const { writeFileSync } = require('node:fs');",
    `const grandchild = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000);'], { stdio: 'ignore' });`,
    `writeFileSync(${JSON.stringify(grandchildPidFile)}, String(grandchild.pid));`,
    'setInterval(() => {}, 1000);',
  ].join('\n');

  const child = spawn(
    process.execPath,
    ['-e', childScript],
    getProcessTreeSpawnOptions({ stdio: 'ignore' }),
  );

  try {
    await waitForFile(grandchildPidFile, 5000);
    const grandchildPid = Number(readFileSync(grandchildPidFile, 'utf-8'));

    assert.equal(Number.isInteger(grandchildPid), true);
    assert.equal(isProcessAlive(grandchildPid), true);

    await stopProcessTree(child, { timeoutMs: 250 });
    await waitForProcessExit(grandchildPid, 2000);

    assert.equal(isProcessAlive(grandchildPid), false);
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
    }
    rmSync(tempDir, { force: true, recursive: true });
  }
});
