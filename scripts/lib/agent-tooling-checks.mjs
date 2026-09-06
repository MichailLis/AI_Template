/**
 * Pure logic behind `npm run doctor:agent-tooling`.
 *
 * Checks machine-local agent tooling preconditions:
 * 1. rtk hooks: exclude_commands contains all required hook exclusions.
 * 2. serena binary: installed and resolvable on PATH (avoiding uvx 30s MCP timeouts).
 * 3. root typescript: resolvable from root package (enabling typescript-lsp plugin).
 * 4. compose project name: docker-compose.yml pins top-level name to ai_template.
 *
 * No I/O or subprocesses here: caller supplies already-read content and booleans.
 */

/**
 * Extracts string command items from an exclude_commands array in TOML text.
 *
 * @param {string | null | undefined} configText
 * @returns {string[]}
 */
export const extractExcludeCommands = (configText) => {
  if (typeof configText !== 'string') return [];
  const match = configText.match(/exclude_commands\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return [];
  const body = match[1];
  const items = [];
  const strRegex = /["']([^"']+)["']/g;
  let m;
  while ((m = strRegex.exec(body)) !== null) {
    items.push(m[1].trim());
  }
  return items;
};

/**
 * Checks whether rtk config contains all required hook exclusions.
 *
 * @param {string | null | undefined} configText
 * @param {string[]} requiredHookExclusions
 * @returns {{ id: 'rtk', status: 'ok' | 'problem', message: string, fix: string | null }}
 */
export const checkRtkHookExclusions = (configText, requiredHookExclusions = []) => {
  if (configText === null || configText === undefined) {
    return {
      id: 'rtk',
      status: 'ok',
      message: 'rtk is not installed or config file not found; nothing to check',
      fix: null,
    };
  }

  const configured = new Set(extractExcludeCommands(configText));
  const missing = requiredHookExclusions.filter((item) => !configured.has(item));

  if (missing.length === 0) {
    return {
      id: 'rtk',
      status: 'ok',
      message: 'rtk config includes all required hook exclusions',
      fix: null,
    };
  }

  return {
    id: 'rtk',
    status: 'problem',
    message: `rtk config is missing required hook exclusions: ${missing.join(', ')}`,
    fix: `Add missing exclusions (${missing.map((cmd) => `"${cmd}"`).join(', ')}) to hooks.exclude_commands in rtk config.toml`,
  };
};

/**
 * Checks whether the Serena binary is resolved on PATH.
 *
 * @param {boolean} hasSerena
 * @returns {{ id: 'serena', status: 'ok' | 'problem', message: string, fix: string | null }}
 */
export const checkSerenaBinary = (hasSerena) => {
  if (hasSerena) {
    return {
      id: 'serena',
      status: 'ok',
      message: 'Serena binary resolved on PATH',
      fix: null,
    };
  }

  return {
    id: 'serena',
    status: 'problem',
    message:
      'Serena binary is not found on PATH. Connecting via uvx exceeds the 30-second MCP connection timeout (99s on warm cache, >5 min on cold cache).',
    fix: 'uv tool install serena-agent --from git+https://github.com/oraios/serena',
  };
};

/**
 * Checks whether typescript is resolvable from the repository root.
 *
 * @param {boolean} hasTypescript
 * @returns {{ id: 'typescript', status: 'ok' | 'problem', message: string, fix: string | null }}
 */
export const checkRootTypescript = (hasTypescript) => {
  if (hasTypescript) {
    return {
      id: 'typescript',
      status: 'ok',
      message: 'Root typescript resolved',
      fix: null,
    };
  }

  return {
    id: 'typescript',
    status: 'problem',
    message:
      'Root typescript is not resolved. The typescript-lsp plugin requires root typescript to start and provide findReferences and incomingCalls.',
    fix: 'Ensure typescript is installed in devDependencies and present in root node_modules',
  };
};

/**
 * Checks whether docker-compose.yml pins the top-level project name to "ai_template".
 *
 * @param {string | null | undefined} dockerComposeContent
 * @returns {{ id: 'compose', status: 'ok' | 'problem', message: string, fix: string | null }}
 */
export const checkComposeProjectName = (dockerComposeContent) => {
  if (typeof dockerComposeContent !== 'string' || dockerComposeContent.trim() === '') {
    return {
      id: 'compose',
      status: 'problem',
      message:
        'docker-compose.yml not found or empty. Without pinning name: ai_template, docker compose in worktrees addresses a separate project and fails to see running containers.',
      fix: 'Add top-level "name: ai_template" to docker-compose.yml',
    };
  }

  const match = dockerComposeContent.match(/^name:\s*['"]?([^#\s'"]+)['"]?/m);
  if (!match) {
    return {
      id: 'compose',
      status: 'problem',
      message:
        'docker-compose.yml is missing top-level "name" key. Without pinning name: ai_template, docker compose in worktrees addresses a separate project and fails to see the running stack.',
      fix: 'Add top-level "name: ai_template" to docker-compose.yml',
    };
  }

  const projectName = match[1];
  if (projectName !== 'ai_template') {
    return {
      id: 'compose',
      status: 'problem',
      message: `docker-compose.yml top-level name is "${projectName}", expected "ai_template". Without pinning name: ai_template, docker compose in worktrees addresses a separate project and fails to see the running stack.`,
      fix: 'Change top-level name in docker-compose.yml to "name: ai_template"',
    };
  }

  return {
    id: 'compose',
    status: 'ok',
    message: 'docker-compose.yml pins top-level name to "ai_template"',
    fix: null,
  };
};

/**
 * Runs all agent tooling checks over the supplied inputs.
 *
 * @param {{
 *   rtkConfig?: string | null,
 *   requiredHookExclusions?: string[],
 *   hasSerena?: boolean,
 *   hasRootTypescript?: boolean,
 *   dockerComposeContent?: string | null
 * }} inputs
 * @returns {Array<{ id: string, status: 'ok' | 'problem', message: string, fix: string | null }>}
 */
export const runAgentToolingChecks = ({
  rtkConfig = null,
  requiredHookExclusions = [],
  hasSerena = false,
  hasRootTypescript = false,
  dockerComposeContent = null,
}) => [
  checkRtkHookExclusions(rtkConfig, requiredHookExclusions),
  checkSerenaBinary(hasSerena),
  checkRootTypescript(hasRootTypescript),
  checkComposeProjectName(dockerComposeContent),
];

/**
 * Formats check results into a human-readable diagnostic report.
 *
 * @param {Array<{ id: string, status: 'ok' | 'problem', message: string, fix: string | null }>} results
 * @returns {string}
 */
export const formatReport = (results) => {
  const lines = [];
  for (const check of results) {
    const badge = check.status === 'ok' ? '[ok]     ' : '[problem]';
    lines.push(`${badge} ${check.id}: ${check.message}`);
  }

  const problems = results.filter((check) => check.status === 'problem');
  if (problems.length > 0) {
    lines.push('');
    lines.push('Actionable fixes:');
    for (const problem of problems) {
      if (problem.fix) {
        lines.push(`  - ${problem.id}: ${problem.fix}`);
      }
    }
  }

  return lines.join('\n');
};
