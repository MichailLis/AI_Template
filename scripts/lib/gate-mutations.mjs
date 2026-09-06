const createLinesOverflowContent = (count = 450) =>
  `\n// Maintainability lines overflow\n` +
  Array.from({ length: count }, (_, i) => `export const _lineOverflowVar_${i} = ${i};`).join('\n') +
  '\n';

const createUseStateOverflowContent = (count = 15) => {
  const states = Array.from({ length: count }, (_, i) => `  const [_s${i}] = useState(${i});`).join(
    '\n',
  );
  return `\n// Maintainability useState overflow\nfunction _dummyStateOverflow() {\n${states}\n}\n`;
};

/**
 * Registry of mutations per verification gate.
 * Each gate has at least two negative proof mutations.
 */
export const GATE_MUTATIONS = [
  // 1. verify-api-mutator.mjs
  {
    id: 'api-mutator-localstorage',
    gate: 'verify-api-mutator.mjs',
    script: 'scripts/verify-api-mutator.mjs',
    npmScript: 'verify:api-mutator',
    file: 'client/src/shared/api/api.ts',
    description: 'Add localStorage access to client/src/shared/api/api.ts',
    action: 'append',
    append: "\n// Browser storage in mutator\nlocalStorage.getItem('x');\n",
  },
  {
    id: 'api-mutator-remove-custom-instance',
    gate: 'verify-api-mutator.mjs',
    script: 'scripts/verify-api-mutator.mjs',
    npmScript: 'verify:api-mutator',
    file: 'client/src/shared/api/api.ts',
    description: 'Remove export const customInstance from client/src/shared/api/api.ts',
    action: 'replace',
    search: 'export const customInstance =',
    replace: '// customInstance export removed',
  },

  // 2. verify-maintainability.mjs
  {
    id: 'maintainability-max-lines',
    gate: 'verify-maintainability.mjs',
    script: 'scripts/verify-maintainability.mjs',
    npmScript: 'verify:maintainability',
    file: 'client/src/app/App.tsx',
    description: 'Add 450 effective lines to client/src/app/App.tsx exceeding 420 line limit',
    action: 'append',
    append: createLinesOverflowContent(450),
  },
  {
    id: 'maintainability-max-use-state',
    gate: 'verify-maintainability.mjs',
    script: 'scripts/verify-maintainability.mjs',
    npmScript: 'verify:maintainability',
    file: 'client/src/app/App.tsx',
    description: 'Add 15 useState calls to client/src/app/App.tsx exceeding limit of 14',
    action: 'append',
    append: createUseStateOverflowContent(15),
  },

  // 3. verify-package-scripts.mjs
  {
    id: 'package-scripts-remove-typecheck',
    gate: 'verify-package-scripts.mjs',
    script: 'scripts/verify-package-scripts.mjs',
    npmScript: 'verify:package-scripts',
    file: 'package.json',
    description: 'Remove && npm run typecheck from verify:local in package.json',
    action: 'replace',
    search: ' && npm run typecheck',
    replace: '',
  },
  {
    id: 'package-scripts-server-lint-fix',
    gate: 'verify-package-scripts.mjs',
    script: 'scripts/verify-package-scripts.mjs',
    npmScript: 'verify:package-scripts',
    file: 'server/package.json',
    description: 'Add --fix flag to lint script in server/package.json',
    action: 'replace',
    search: '"lint": "eslint \\"src/**/*.ts\\""',
    replace: '"lint": "eslint \\"src/**/*.ts\\" --fix"',
  },

  // 4. verify-ai-guide.mjs
  {
    id: 'ai-guide-nonexistent-path',
    gate: 'verify-ai-guide.mjs',
    script: 'scripts/verify-ai-guide.mjs',
    npmScript: 'verify:ai-guide',
    file: 'AI_GUIDE.md',
    description:
      'Add backtick reference to nonexistent file docs/this-file-does-not-exist.md in AI_GUIDE.md',
    action: 'append',
    append: '\nReference: `docs/this-file-does-not-exist.md`\n',
  },
  {
    id: 'ai-guide-missing-heading',
    gate: 'verify-ai-guide.mjs',
    script: 'scripts/verify-ai-guide.mjs',
    npmScript: 'verify:ai-guide',
    file: 'AI_GUIDE.md',
    description: 'Rename required ## Local Verification Entry Points heading in AI_GUIDE.md',
    action: 'replace',
    search: '## Local Verification Entry Points',
    replace: '## Renamed Local Verification Entry Points',
  },
  {
    id: 'ai-guide-claude-size-budget',
    gate: 'verify-ai-guide.mjs',
    script: 'scripts/verify-ai-guide.mjs',
    npmScript: 'verify:ai-guide',
    file: 'CLAUDE.md',
    description: 'Append content to CLAUDE.md exceeding the byte budget limit',
    action: 'append',
    append: '\n' + '# Budget overflow padding line\n'.repeat(200),
  },

  // 5. verify-runtime-config.mjs
  {
    id: 'runtime-config-backend-npm-install',
    gate: 'verify-runtime-config.mjs',
    script: 'scripts/verify-runtime-config.mjs',
    npmScript: 'verify:runtime-config',
    file: 'docker-compose.yml',
    description: 'Replace npm ci with npm install in backend command in docker-compose.yml',
    action: 'replace',
    search: 'npm ci &&',
    replace: 'npm install &&',
  },
  {
    id: 'runtime-config-remove-cors-origins',
    gate: 'verify-runtime-config.mjs',
    script: 'scripts/verify-runtime-config.mjs',
    npmScript: 'verify:runtime-config',
    file: 'server/src/setup-app.ts',
    description: 'Remove CORS_ALLOWED_ORIGINS reference from server/src/setup-app.ts',
    action: 'replace',
    search: /CORS_ALLOWED_ORIGINS/g,
    replace: 'DISABLED_ORIGINS',
  },

  // 6. verify-invariants.mjs
  {
    id: 'invariants-auth-logout-missing-api-response',
    gate: 'verify-invariants.mjs',
    script: 'scripts/verify-invariants.mjs',
    npmScript: 'verify:invariants',
    file: 'server/src/auth/auth.controller.ts',
    description: 'Remove @ApiResponse from logout handler in server/src/auth/auth.controller.ts',
    action: 'replace',
    search: "@ApiResponse({ status: HttpStatus.OK, description: 'User successfully logged out' })",
    replace:
      "// @ApiResponse({ status: HttpStatus.OK, description: 'User successfully logged out' })",
  },
  {
    id: 'invariants-client-storage-discipline',
    gate: 'verify-invariants.mjs',
    script: 'scripts/verify-invariants.mjs',
    npmScript: 'verify:invariants',
    file: 'client/src/app/App.tsx',
    description:
      'Add direct localStorage access to client/src/app/App.tsx outside allowed storage exception files',
    action: 'append',
    append: "\n// Storage discipline violation\nlocalStorage.getItem('x');\n",
  },

  // 7. verify-architecture.mjs
  {
    id: 'architecture-manifest-broken-route',
    gate: 'verify-architecture.mjs',
    script: 'scripts/verify-architecture.mjs',
    npmScript: 'verify:architecture',
    file: 'template/features.manifest.json',
    description:
      'Change feature route in template/features.manifest.json to diverge from server/openapi.json',
    action: 'replace',
    search: '"route": "/admin",',
    replace: '"route": "/admin-broken-diverged-route",',
    requiredFile: 'server/openapi.json',
    skipReason: 'server/openapi.json is missing (requires gen:openapi)',
  },
  {
    id: 'architecture-manifest-broken-required-route',
    gate: 'verify-architecture.mjs',
    script: 'scripts/verify-architecture.mjs',
    npmScript: 'verify:architecture',
    file: 'template/features.manifest.json',
    description:
      'Change auth requiredRoutes in template/features.manifest.json to an unwired route',
    action: 'replace',
    search: '"requiredRoutes": ["/login"],',
    replace: '"requiredRoutes": ["/nonexistent-login-unwired"],',
    requiredFile: 'server/openapi.json',
    skipReason: 'server/openapi.json is missing (requires gen:openapi)',
  },
];

/**
 * Gates explicitly excepted from mutation verification.
 * Each entry MUST provide a clear reason explaining why it is excluded.
 */
export const GATE_EXCEPTIONS = [
  {
    gate: 'verify-prisma-migrations.mjs',
    script: 'scripts/verify-prisma-migrations.mjs',
    npmScript: 'verify:prisma-migrations',
    reason:
      'Raises shadow database in Docker container (ai_template_postgres), takes 2.2s and depends on environment',
  },
  {
    gate: 'verify-gates.mjs',
    script: 'scripts/verify-gates.mjs',
    npmScript: 'verify:gates',
    reason: 'Self-referential mutation verification runner cannot mutate its own execution',
  },
  {
    gate: 'smoke-server.mjs',
    script: 'scripts/smoke-server.mjs',
    npmScript: 'verify:smoke:server',
    reason:
      'Starts live backend server process and tests HTTP endpoints; requires running services',
  },
  {
    gate: 'e2e-critical-flows.mjs',
    script: 'scripts/e2e-critical-flows.mjs',
    npmScript: 'verify:e2e:critical',
    reason:
      'End-to-end browser automation suite via Playwright; requires running frontend and backend containers',
  },
];

/**
 * Pure function: applies a mutation to content (Buffer or string).
 * Preserves CRLF or LF line endings according to the source file.
 */
export const applyMutation = (content, mutation) => {
  const isBuffer = Buffer.isBuffer(content);
  const text = isBuffer ? content.toString('utf8') : content;
  const isCrlf = text.includes('\r\n');

  const normalizeLineEndings = (str) => {
    if (isCrlf) {
      return str.replace(/\r?\n/g, '\r\n');
    }
    return str.replace(/\r\n/g, '\n');
  };

  if (mutation.action === 'append') {
    const addition = normalizeLineEndings(mutation.append ?? '');
    const result = text + addition;
    return isBuffer ? Buffer.from(result, 'utf8') : result;
  }

  if (mutation.action === 'replace') {
    const search = mutation.search;
    const replacement = normalizeLineEndings(mutation.replace ?? '');

    if (typeof search === 'string') {
      if (!text.includes(search)) {
        throw new Error(
          `Mutation target "${search}" not found in content for mutation "${mutation.id}"`,
        );
      }
      const result = text.replace(search, replacement);
      return isBuffer ? Buffer.from(result, 'utf8') : result;
    }

    if (search instanceof RegExp) {
      if (!search.test(text)) {
        throw new Error(
          `Mutation pattern ${search} not found in content for mutation "${mutation.id}"`,
        );
      }
      const result = text.replace(search, replacement);
      return isBuffer ? Buffer.from(result, 'utf8') : result;
    }

    throw new Error(`Invalid search parameter in mutation "${mutation.id}"`);
  }
  throw new Error(`Unknown mutation action: "${mutation.action}" in mutation "${mutation.id}"`);
};

/**
 * Pure function: extracts all verify:* gates from verify:local and verify:template in package.json.
 */
export const extractPipelineGates = (packageJson) => {
  const scripts = packageJson?.scripts ?? {};
  const pipelineScriptNames = ['verify:local', 'verify:template'];
  const extracted = new Map();

  const resolveSegments = (commandStr) => {
    if (!commandStr) return [];
    return commandStr
      .split('&&')
      .map((seg) => seg.trim())
      .filter(Boolean);
  };

  const processNpmScript = (npmScript) => {
    const command = scripts[npmScript];
    if (!command) return;

    if (npmScript === 'verify:contracts') {
      const subSegments = resolveSegments(command);
      for (const sub of subSegments) {
        if (sub.startsWith('npm run ')) {
          const childName = sub.replace(/^npm\s+run\s+/, '').split(/\s+/)[0];
          if (childName.startsWith('verify:')) {
            processNpmScript(childName);
          }
        }
      }
      return;
    }

    const match = command.match(/node\s+scripts\/([a-zA-Z0-9_-]+\.mjs)/);
    const gateFile = match ? match[1] : `${npmScript.replace(/:/g, '-')}.mjs`;
    const scriptPath = match ? `scripts/${match[1]}` : `scripts/${gateFile}`;

    extracted.set(npmScript, {
      npmScript,
      gate: gateFile,
      script: scriptPath,
    });
  };

  for (const pipeline of pipelineScriptNames) {
    const segments = resolveSegments(scripts[pipeline]);
    for (const seg of segments) {
      if (seg.startsWith('npm run ')) {
        const npmScript = seg.replace(/^npm\s+run\s+/, '').split(/\s+/)[0];
        if (npmScript.startsWith('verify:')) {
          processNpmScript(npmScript);
        }
      }
    }
  }

  return Array.from(extracted.values());
};

/**
 * Pure function: verifies that every gate in the pipeline has at least one mutation
 * or is listed in exceptions with a reason.
 */
export const checkGateCoverage = ({
  mutations = GATE_MUTATIONS,
  exceptions = GATE_EXCEPTIONS,
  pipelineGates = [],
}) => {
  const errors = [];

  // 1. Verify exceptions have reasons
  for (const exception of exceptions) {
    const identifier = exception.gate ?? exception.script ?? exception.npmScript ?? 'unknown';
    if (
      !exception.reason ||
      typeof exception.reason !== 'string' ||
      exception.reason.trim() === ''
    ) {
      errors.push(`Exception for gate "${identifier}" must provide a non-empty text reason.`);
    }
  }

  // 2. Build coverage lookups
  const coveredGates = new Set(mutations.map((m) => m.gate));
  const coveredScripts = new Set(mutations.map((m) => m.script));
  const coveredNpmScripts = new Set(mutations.map((m) => m.npmScript).filter(Boolean));

  const exceptionGates = new Set(exceptions.map((e) => e.gate));
  const exceptionScripts = new Set(exceptions.map((e) => e.script));
  const exceptionNpmScripts = new Set(exceptions.map((e) => e.npmScript).filter(Boolean));

  let coveredCount = 0;
  let exceptedCount = 0;

  // 3. Check each pipeline gate
  for (const gate of pipelineGates) {
    const hasMutation =
      coveredGates.has(gate.gate) ||
      coveredScripts.has(gate.script) ||
      coveredNpmScripts.has(gate.npmScript);

    const hasException =
      exceptionGates.has(gate.gate) ||
      exceptionScripts.has(gate.script) ||
      exceptionNpmScripts.has(gate.npmScript);

    if (hasMutation) {
      coveredCount++;
    } else if (hasException) {
      exceptedCount++;
    } else {
      errors.push(
        `Gate "${gate.npmScript}" (${gate.script ?? gate.gate}) is in the verification pipeline ` +
          `but has no mutations in the registry and is not listed in exceptions.`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    coveredCount,
    exceptedCount,
    totalGates: pipelineGates.length,
  };
};
