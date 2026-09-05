import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  GATE_EXCEPTIONS,
  GATE_MUTATIONS,
  applyMutation,
  checkGateCoverage,
  extractPipelineGates,
} from './lib/gate-mutations.mjs';

const rootDir = process.cwd();
const packageJsonPath = join(rootDir, 'package.json');

// --- Emergency Recovery Handlers ---
let activeRestore = null;

const emergencyRestore = () => {
  if (activeRestore) {
    try {
      writeFileSync(activeRestore.filePath, activeRestore.originalBuffer);
      const restored = readFileSync(activeRestore.filePath);
      if (!activeRestore.originalBuffer.equals(restored)) {
        console.error(
          `FATAL CORRUPTION: Emergency restore failed on ${activeRestore.filePath}! Bytes do not match!`,
        );
      } else {
        console.error(`[EMERGENCY RESTORE] Successfully restored ${activeRestore.filePath}`);
      }
    } catch (err) {
      console.error(
        `FATAL CORRUPTION: Error during emergency restore of ${activeRestore.filePath}:`,
        err,
      );
    }
    activeRestore = null;
  }
};

process.on('SIGINT', () => {
  console.error('\nInterrupted by SIGINT. Restoring mutated files...');
  emergencyRestore();
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.error('\nInterrupted by SIGTERM. Restoring mutated files...');
  emergencyRestore();
  process.exit(143);
});

process.on('uncaughtException', (err) => {
  console.error('\nUncaught Exception encountered:', err);
  emergencyRestore();
  process.exit(1);
});

// --- Main Mutation Verification Driver ---
const main = () => {
  const startTime = Date.now();
  console.log('=== Mutation Verification of Repository Gates (npm run verify:gates) ===\n');

  // 1. Validate Gate Coverage against verify:local and verify:template pipelines
  if (!existsSync(packageJsonPath)) {
    console.error(`Error: package.json not found at ${packageJsonPath}`);
    process.exit(1);
  }

  const rootPackage = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const pipelineGates = extractPipelineGates(rootPackage);

  const coverage = checkGateCoverage({
    mutations: GATE_MUTATIONS,
    exceptions: GATE_EXCEPTIONS,
    pipelineGates,
  });

  if (!coverage.ok) {
    console.error('GATE COVERAGE VALIDATION FAILED:');
    for (const error of coverage.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Gate coverage verified: ${coverage.coveredCount} covered by mutations, ` +
      `${coverage.exceptedCount} excepted with documented reasons (${coverage.totalGates} pipeline gates total).\n`,
  );

  // 2. Report Documented Gate Exceptions
  console.log('--- Documented Gate Exceptions ---');
  for (const exc of GATE_EXCEPTIONS) {
    console.log(`[EXEMPT] ${exc.gate ?? exc.script}: ${exc.reason}`);
  }
  console.log('');

  // 3. Execute Mutations
  console.log('--- Executing Gate Mutations ---');
  let passedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const leaks = [];

  for (const mutation of GATE_MUTATIONS) {
    // Check prerequisite file condition (e.g. server/openapi.json for architecture)
    if (mutation.requiredFile && !existsSync(join(rootDir, mutation.requiredFile))) {
      console.log(
        `[SKIP]   ${mutation.id.padEnd(46)} (${mutation.gate}): ${
          mutation.skipReason ?? 'Required prerequisite file missing'
        }`,
      );
      skippedCount++;
      continue;
    }

    const targetPath = join(rootDir, mutation.file);
    if (!existsSync(targetPath)) {
      console.error(`Error: target file not found for mutation ${mutation.id}: ${targetPath}`);
      failedCount++;
      leaks.push({
        mutation,
        gate: mutation.gate,
        error: `Target file not found: ${mutation.file}`,
      });
      continue;
    }

    // 1. Read target file into buffer (never git checkout)
    const originalBuffer = readFileSync(targetPath);
    activeRestore = { filePath: targetPath, originalBuffer };

    let gateResult;
    try {
      // 2. Apply mutation and write to disk
      const mutatedBuffer = applyMutation(originalBuffer, mutation);
      writeFileSync(targetPath, mutatedBuffer);

      // 3. Run gate directly: node scripts/<gate>.mjs
      const scriptFullPath = join(rootDir, mutation.script);
      gateResult = spawnSync(process.execPath, [scriptFullPath], {
        cwd: rootDir,
        stdio: 'pipe',
        env: process.env,
      });
    } catch (err) {
      console.error(`Error applying mutation ${mutation.id}:`, err.message);
      gateResult = { status: 0, error: err };
    } finally {
      // 4. Restore original buffer and byte-check immediately
      writeFileSync(targetPath, originalBuffer);
      const restoredBuffer = readFileSync(targetPath);

      if (!originalBuffer.equals(restoredBuffer)) {
        console.error(`FATAL: Byte-level restoration mismatch on ${targetPath}!`);
        console.error('File was not restored to exact previous bytes. Terminating immediately.');
        activeRestore = null;
        process.exit(2);
      }
      activeRestore = null;
    }

    // 5. Evaluate outcome (expected: non-zero exit code)
    if (gateResult.status !== 0) {
      passedCount++;
      console.log(`[CAUGHT] ${mutation.id.padEnd(46)} (${mutation.gate})`);
    } else {
      failedCount++;
      console.error(
        `[LEAK]   ${mutation.id.padEnd(46)} (${mutation.gate}) returned exit code 0! Gate failed to catch mutation.`,
      );
      leaks.push({
        mutation,
        gate: mutation.gate,
        error: 'Gate returned exit 0 (mutation undetected)',
      });
    }
  }

  const durationMs = Date.now() - startTime;

  // 4. Print Summary
  console.log('\n======================================================');
  console.log('Gate Mutation Verification Summary:');
  console.log(`  Total mutations:   ${GATE_MUTATIONS.length}`);
  console.log(`  Caught:            ${passedCount}`);
  console.log(`  Leaked (holes):    ${failedCount}`);
  console.log(`  Skipped:           ${skippedCount}`);
  console.log(`  Excepted gates:    ${GATE_EXCEPTIONS.length}`);
  console.log(`  Duration:          ${(durationMs / 1000).toFixed(2)}s`);
  console.log('======================================================');

  if (failedCount > 0) {
    console.error('\nFAILURE: Detected holes in verification gates:');
    for (const leak of leaks) {
      console.error(`  - ${leak.mutation.id} on ${leak.gate}: ${leak.error}`);
    }
    process.exit(1);
  }

  console.log('\nAll gate mutations were successfully caught.');
};

main();
