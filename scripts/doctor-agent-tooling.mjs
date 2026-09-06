import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import {
  deriveRtkHookExclusions,
  formatReport,
  runAgentToolingChecks,
} from './lib/agent-tooling-checks.mjs';

/**
 * `npm run doctor:agent-tooling` — diagnostic, not a gate.
 *
 * Inspects machine-local agent tooling preconditions (rtk hook exclusions, Serena binary,
 * root typescript resolution, docker-compose project name).
 *
 * Always exits 0: machine state must not fail builds on a clean tree.
 */

const rootDir = process.cwd();

const getRtkConfigPath = () => {
  if (process.platform === 'win32') {
    return process.env.APPDATA ? join(process.env.APPDATA, 'rtk', 'config.toml') : null;
  }
  if (process.env.XDG_CONFIG_HOME) {
    return join(process.env.XDG_CONFIG_HOME, 'rtk', 'config.toml');
  }
  if (process.env.HOME) {
    return join(process.env.HOME, '.config', 'rtk', 'config.toml');
  }
  return null;
};

const resolveBinaryInPath = (binaryName) => {
  const isWin = process.platform === 'win32';
  const lookup = isWin ? 'where.exe' : 'which';
  try {
    const res = spawnSync(lookup, [binaryName], { stdio: 'ignore' });
    if (res.status === 0) return true;
  } catch {
    // fallback below
  }
  const pathEnv = process.env.PATH || '';
  const delimiter = isWin ? ';' : ':';
  const extensions = isWin ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';') : [''];
  for (const dir of pathEnv.split(delimiter)) {
    if (!dir) continue;
    for (const ext of extensions) {
      const candidate = join(dir, isWin ? `${binaryName}${ext.toLowerCase()}` : binaryName);
      if (existsSync(candidate)) return true;
    }
  }
  return false;
};

// 1. rtk config
const rtkConfigPath = getRtkConfigPath();
let rtkConfig = null;
if (rtkConfigPath && existsSync(rtkConfigPath)) {
  try {
    rtkConfig = readFileSync(rtkConfigPath, 'utf8');
  } catch {
    rtkConfig = null;
  }
}

// Required hook exclusions derived from template/rtk-filters.json (unsafe list)
let requiredHookExclusions = [];
const filtersPath = join(rootDir, 'template', 'rtk-filters.json');
if (existsSync(filtersPath)) {
  try {
    const filtersData = JSON.parse(readFileSync(filtersPath, 'utf8'));
    requiredHookExclusions = deriveRtkHookExclusions(filtersData.unsafe);
  } catch {
    requiredHookExclusions = [];
  }
}

// 2. Serena binary on PATH
const hasSerena = resolveBinaryInPath('serena');

// 3. Root typescript resolution
let hasRootTypescript = false;
try {
  const rootRequire = createRequire(join(rootDir, 'package.json'));
  rootRequire.resolve('typescript');
  hasRootTypescript = true;
} catch {
  hasRootTypescript = false;
}

// 4. docker-compose.yml content
let dockerComposeContent = null;
const composePath = join(rootDir, 'docker-compose.yml');
if (existsSync(composePath)) {
  try {
    dockerComposeContent = readFileSync(composePath, 'utf8');
  } catch {
    dockerComposeContent = null;
  }
}

const results = runAgentToolingChecks({
  rtkConfig,
  requiredHookExclusions,
  hasSerena,
  hasRootTypescript,
  dockerComposeContent,
});

console.log(formatReport(results));
process.exit(0);
