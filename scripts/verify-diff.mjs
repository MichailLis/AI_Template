import { existsSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

import {
  differsOnlyByLineEndings,
  findCrlfCorruption,
  getAffectedScopes,
  getOrderedScripts,
  scriptToCommand,
} from './lib/changed-scopes.mjs';
import { spawnSyncNpm } from './lib/npm-runner.mjs';

const rootDir = process.cwd();

const parseArgs = () => {
  const args = process.argv.slice(2);
  let base = 'origin/main';
  let run = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--run') {
      run = true;
    } else if (arg === '--base') {
      if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
        console.error('Error: --base requires a reference argument.');
        process.exit(1);
      }
      base = args[++i];
    } else if (arg.startsWith('--base=')) {
      base = arg.slice('--base='.length);
      if (!base) {
        console.error('Error: --base requires a reference argument.');
        process.exit(1);
      }
    } else {
      console.error(`Error: Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  return { base, run };
};

const validateBaseRef = (base) => {
  const check = spawnSync('git', ['rev-parse', '--verify', base], {
    cwd: rootDir,
    encoding: 'utf8',
  });

  if (check.status !== 0) {
    console.error(`Error: Base reference "${base}" does not exist in git.`);
    process.exit(1);
  }
};

const getChangedFiles = (base) => {
  const diffResult = spawnSync('git', ['diff', '--name-only', `${base}...HEAD`], {
    cwd: rootDir,
    encoding: 'utf8',
  });

  if (diffResult.status !== 0) {
    console.error(`Error: Failed to compute git diff against base "${base}".`);
    if (diffResult.stderr) {
      console.error(diffResult.stderr);
    }
    process.exit(1);
  }

  const statusResult = spawnSync('git', ['status', '--porcelain', '-uall'], {
    cwd: rootDir,
    encoding: 'utf8',
  });

  if (statusResult.status !== 0) {
    console.error('Error: Failed to inspect git status.');
    if (statusResult.stderr) {
      console.error(statusResult.stderr);
    }
    process.exit(1);
  }

  const candidatePaths = new Set();

  for (const line of diffResult.stdout.split(/\r?\n/)) {
    const trimmed = line.trim().replace(/^"(.*)"$/, '$1');
    if (trimmed) {
      candidatePaths.add(trimmed);
    }
  }

  for (const line of statusResult.stdout.split(/\r?\n/)) {
    if (!line || line.length < 4) {
      continue;
    }
    const statusCode = line.slice(0, 2);
    // Deleted in worktree or index
    if (statusCode === ' D' || statusCode === 'D ') {
      continue;
    }
    const pathPart = line.slice(3).trim();
    const targetPath = pathPart.includes(' -> ') ? pathPart.split(' -> ')[1].trim() : pathPart;
    const cleaned = targetPath.replace(/^"(.*)"$/, '$1');
    if (cleaned) {
      candidatePaths.add(cleaned);
    }
  }

  // Filter out deleted files: files must exist on disk and be regular files
  const existingFiles = [];
  for (const relPath of candidatePaths) {
    const norm = relPath.replace(/\\/g, '/');
    const fullPath = resolve(rootDir, norm);
    if (existsSync(fullPath)) {
      try {
        const st = statSync(fullPath);
        if (st.isFile()) {
          existingFiles.push(norm);
        }
      } catch {
        // Skip unreadable or special paths
      }
    }
  }

  return existingFiles.sort();
};

const runGuards = ({ base, changedFiles }) => {
  // Guard 1: CRLF corruption (\r\r\n)
  const crlfErrors = [];
  for (const relPath of changedFiles) {
    const fullPath = resolve(rootDir, relPath);
    try {
      const source = readFileSync(fullPath, 'utf8');
      const errors = findCrlfCorruption({ relativePath: relPath, source });
      crlfErrors.push(...errors);
    } catch {
      // Non-UTF8 / binary files skipped
    }
  }

  if (crlfErrors.length > 0) {
    console.error(
      `[ERROR] CRLF corruption guard failed: found ${crlfErrors.length} \\r\\r\\n sequence(s):`,
    );
    for (const error of crlfErrors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  // Guard 2: Orval line-ending noise under client/src/shared/api/
  const orvalNoiseFiles = [];
  for (const relPath of changedFiles) {
    if (relPath.startsWith('client/src/shared/api/')) {
      const fullPath = resolve(rootDir, relPath);
      try {
        const diskContent = readFileSync(fullPath, 'utf8');
        const getGitContent = (ref) => {
          const catResult = spawnSync('git', ['cat-file', '--filters', `${ref}:${relPath}`], {
            cwd: rootDir,
            encoding: 'utf8',
          });
          if (catResult.status === 0 && catResult.stdout) {
            return catResult.stdout;
          }
          const showResult = spawnSync('git', ['show', `${ref}:${relPath}`], {
            cwd: rootDir,
            encoding: 'utf8',
          });
          if (showResult.status === 0) {
            return showResult.stdout;
          }
          return null;
        };

        let gitContent = getGitContent('HEAD');
        if (!gitContent && base !== 'HEAD') {
          gitContent = getGitContent(base);
        }
        if (gitContent !== null && differsOnlyByLineEndings(diskContent, gitContent)) {
          orvalNoiseFiles.push(relPath);
        }
      } catch {
        // Ignore read errors
      }
    }
  }

  if (orvalNoiseFiles.length > 0) {
    console.warn(
      `\n[WARNING] Orval noise detected: ${orvalNoiseFiles.length} file(s) under client/src/shared/api/ differ only by line endings:`,
    );
    for (const file of orvalNoiseFiles) {
      console.warn(`  - ${file}`);
    }
    console.warn('Hint: revert line-ending noise with:');
    console.warn('  git checkout -- client/src/shared/api/\n');
  }
};

const main = () => {
  const { base, run } = parseArgs();

  validateBaseRef(base);

  const changedFiles = getChangedFiles(base);

  // Guards run ALWAYS, in both modes (--run or without), and before the plan
  runGuards({ base, changedFiles });

  const scopes = getAffectedScopes(changedFiles);
  const scripts = getOrderedScripts(changedFiles);
  const commands = scripts.map(scriptToCommand);

  console.log(`Base: ${base}`);
  console.log(`Changed files: ${changedFiles.length}`);
  if (changedFiles.length > 0) {
    for (const file of changedFiles) {
      console.log(`  ${file}`);
    }
  }

  console.log('\nAffected scopes:');
  if (scopes.length === 0) {
    console.log('  (none)');
  } else {
    for (const scope of scopes) {
      console.log(`  - ${scope}`);
    }
  }

  console.log('\nExecution plan:');
  if (commands.length === 0) {
    console.log('  (no commands required)');
  } else {
    for (let i = 0; i < commands.length; i++) {
      console.log(`  ${i + 1}. ${commands[i]}`);
    }
  }

  if (!run) {
    console.log('\nDry run complete. Use --run to execute these verification commands.');
    process.exit(0);
  }

  if (commands.length === 0) {
    console.log('\nNo commands to run.');
    process.exit(0);
  }

  console.log('\nRunning verification commands...\n');
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    console.log(`>>> [${i + 1}/${commands.length}] ${cmd}`);

    const parts = cmd.trim().split(/\s+/);
    if (parts[0] !== 'npm') {
      console.error(`Unsupported command executable: ${parts[0]}`);
      process.exit(1);
    }
    const npmArgs = parts.slice(1);
    const result = spawnSyncNpm(npmArgs, {
      cwd: rootDir,
      stdio: 'inherit',
    });

    if (result.status !== 0) {
      console.error(`\nCommand failed with exit code ${result.status ?? 1}: ${cmd}`);
      process.exit(result.status ?? 1);
    }
  }

  console.log('\nAll verification commands passed.');
  process.exit(0);
};

main();
